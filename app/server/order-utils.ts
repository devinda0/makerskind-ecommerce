import clientPromise from './db/mongo'
import type { ObjectId, Collection, Db, WithId } from 'mongodb'

// --- Order Types ---

export interface OrderItem {
    productId: string
    productName: string
    quantity: number
    unitPrice: number      // Selling price at time of order
    supplierId: string
}

export interface ShippingAddress {
    street: string
    city: string
    zip: string
    country: string
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderTotals {
    subtotal: number
    shipping: number
    total: number
}

export interface Order {
    _id?: ObjectId
    userId: string
    items: OrderItem[]
    shippingAddress: ShippingAddress
    totals: OrderTotals
    status: OrderStatus
    createdAt: Date
    updatedAt: Date
}

// --- Serializable Types ---

export interface OrderSerializable {
    _id: string
    userId: string
    items: OrderItem[]
    shippingAddress: ShippingAddress
    totals: OrderTotals
    status: OrderStatus
    createdAt: string
    updatedAt: string
}

// --- Input Types ---

export interface CreateOrderInput {
    items: Array<{
        productId: string
        quantity: number
    }>
    shippingAddress: ShippingAddress
}

export interface OrderListOptions {
    page?: number
    limit?: number
    status?: OrderStatus
    userId?: string
    supplierId?: string
}

export interface PaginatedOrders<T> {
    orders: T[]
    total: number
    page: number
    limit: number
    totalPages: number
}

// --- Database Access ---

let _db: Db | null = null

async function getDb(): Promise<Db> {
    if (!_db) {
        const client = await clientPromise
        _db = client.db()
    }
    return _db
}

export async function getOrderCollection(): Promise<Collection<Order>> {
    const db = await getDb()
    return db.collection<Order>('orders')
}

// --- Utility Functions ---

/**
 * Convert a MongoDB order document to a serializable format
 */
export function toSerializable(order: WithId<Order>): OrderSerializable {
    return {
        _id: order._id.toHexString(),
        userId: order.userId,
        items: order.items,
        shippingAddress: order.shippingAddress,
        totals: order.totals,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        updatedAt: order.updatedAt.toISOString()
    }
}

/**
 * Create a new order with atomic stock validation and decrement
 * Uses MongoDB transaction for transactional integrity
 */
export async function createOrder(
    userId: string,
    input: CreateOrderInput
): Promise<WithId<Order>> {
    const { ObjectId } = await import('mongodb')
    const client = await clientPromise
    const session = client.startSession()
    
    try {
        let createdOrder: WithId<Order> | null = null
        
        await session.withTransaction(async () => {
            const db = client.db()
            const productCollection = db.collection('products')
            const orderCollection = db.collection<Order>('orders')
            const cartCollection = db.collection('carts')
            
            // Fetch all products to validate they exist and get current prices
            const productIds = input.items.map(item => new ObjectId(item.productId))
            const products = await productCollection.find(
                { _id: { $in: productIds }, status: 'active' },
                { session }
            ).toArray()
            
            // Verify all products exist and are active
            if (products.length !== input.items.length) {
                throw new Error('One or more products not found or not available')
            }
            
            // Create a map for quick product lookup
            const productMap = new Map(
                products.map(p => [p._id.toHexString(), p])
            )
            
            // Prepare order items with current prices
            const orderItems: OrderItem[] = []
            let subtotal = 0
            
            for (const item of input.items) {
                const product = productMap.get(item.productId)
                if (!product) {
                    throw new Error(`Product ${item.productId} not found`)
                }
                
                // Check if sufficient stock
                if (product.inventory.onHand < item.quantity) {
                    throw new Error(`Insufficient stock for product: ${product.name}`)
                }
                
                orderItems.push({
                    productId: item.productId,
                    productName: product.name,
                    quantity: item.quantity,
                    unitPrice: product.pricing.selling,
                    supplierId: product.supplierId
                })
                
                subtotal += product.pricing.selling * item.quantity
            }
            
            // Atomic stock decrement using bulkWrite with $inc
            const bulkOps = input.items.map(item => ({
                updateOne: {
                    filter: {
                        _id: new ObjectId(item.productId),
                        'inventory.onHand': { $gte: item.quantity }
                    },
                    update: {
                        $inc: { 'inventory.onHand': -item.quantity },
                        $set: { updatedAt: new Date() }
                    }
                }
            }))
            
            const bulkResult = await productCollection.bulkWrite(bulkOps, { session })
            
            // Verify all items were updated (stock was sufficient at update time)
            if (bulkResult.modifiedCount !== input.items.length) {
                throw new Error('Insufficient stock for one or more items. Please refresh and try again.')
            }
            
            // Calculate totals
            const shipping = subtotal >= 50 ? 0 : 5.99 // Free shipping over $50
            const total = subtotal + shipping
            
            // Create the order
            const order: Order = {
                userId,
                items: orderItems,
                shippingAddress: input.shippingAddress,
                totals: {
                    subtotal,
                    shipping,
                    total
                },
                status: 'pending',
                createdAt: new Date(),
                updatedAt: new Date()
            }
            
            const result = await orderCollection.insertOne(order, { session })
            createdOrder = { ...order, _id: result.insertedId }
            
            // Clear the user's cart after successful order
            await cartCollection.updateOne(
                { userId },
                { $set: { items: [], updatedAt: new Date() } },
                { session }
            )
        })
        
        if (!createdOrder) {
            throw new Error('Failed to create order')
        }
        
        return createdOrder
    } finally {
        await session.endSession()
    }
}

/**
 * Get an order by ID
 */
export async function getOrderById(orderId: string): Promise<WithId<Order> | null> {
    const collection = await getOrderCollection()
    const { ObjectId } = await import('mongodb')
    
    try {
        return await collection.findOne({ _id: new ObjectId(orderId) })
    } catch {
        return null
    }
}

/**
 * Get paginated orders for a specific user
 */
export async function getOrdersByUser(
    userId: string,
    options: Omit<OrderListOptions, 'userId' | 'supplierId'> = {}
): Promise<PaginatedOrders<WithId<Order>>> {
    const collection = await getOrderCollection()
    
    const page = Math.max(1, options.page || 1)
    const limit = Math.min(100, Math.max(1, options.limit || 20))
    const skip = (page - 1) * limit
    
    const filter: Record<string, unknown> = { userId }
    
    if (options.status) {
        filter.status = options.status
    }
    
    const [orders, total] = await Promise.all([
        collection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(filter)
    ])
    
    return {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
}

/**
 * Get paginated orders containing products from a specific supplier
 */
export async function getOrdersBySupplier(
    supplierId: string,
    options: Omit<OrderListOptions, 'userId' | 'supplierId'> = {}
): Promise<PaginatedOrders<WithId<Order>>> {
    const collection = await getOrderCollection()
    
    const page = Math.max(1, options.page || 1)
    const limit = Math.min(100, Math.max(1, options.limit || 20))
    const skip = (page - 1) * limit
    
    const filter: Record<string, unknown> = {
        'items.supplierId': supplierId
    }
    
    if (options.status) {
        filter.status = options.status
    }
    
    const [orders, total] = await Promise.all([
        collection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(filter)
    ])
    
    return {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
}

/**
 * Get total sales for a specific supplier
 * Calculates sum of (quantity * unitPrice) for all items belonging to the supplier
 * Excludes cancelled orders
 */
export async function getSupplierTotalSales(supplierId: string): Promise<number> {
    const collection = await getOrderCollection()
    
    const result = await collection.aggregate([
        // Match orders that contain at least one item from this supplier and are not cancelled
        { 
            $match: { 
                'items.supplierId': supplierId,
                status: { $ne: 'cancelled' }
            } 
        },
        // Unwind items array to process individual items
        { $unwind: '$items' },
        // Filter only items belonging to this supplier
        { 
            $match: { 
                'items.supplierId': supplierId 
            } 
        },
        // Sum up the sales amount
        { 
            $group: { 
                _id: null, 
                totalSales: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } } 
            } 
        }
    ]).toArray()
    
    return result[0]?.totalSales || 0
}

/**
 * Get all orders (Admin only) with pagination
 */
export async function getAllOrders(
    options: Omit<OrderListOptions, 'userId' | 'supplierId'> = {}
): Promise<PaginatedOrders<WithId<Order>>> {
    const collection = await getOrderCollection()
    
    const page = Math.max(1, options.page || 1)
    const limit = Math.min(100, Math.max(1, options.limit || 20))
    const skip = (page - 1) * limit
    
    const filter: Record<string, unknown> = {}
    
    if (options.status) {
        filter.status = options.status
    }
    
    const [orders, total] = await Promise.all([
        collection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(filter)
    ])
    
    return {
        orders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
}

/**
 * Update order status
 */
export async function updateOrderStatus(
    orderId: string,
    status: OrderStatus
): Promise<WithId<Order> | null> {
    const collection = await getOrderCollection()
    const { ObjectId } = await import('mongodb')
    
    let objectId: ObjectId
    try {
        objectId = new ObjectId(orderId)
    } catch {
        return null
    }
    
    await collection.updateOne(
        { _id: objectId },
        { 
            $set: { 
                status,
                updatedAt: new Date()
            }
        }
    )
    
    return await collection.findOne({ _id: objectId })
}

/**
 * Check if a user owns an order
 */
export async function isOrderOwner(orderId: string, userId: string): Promise<boolean> {
    const order = await getOrderById(orderId)
    return order?.userId === userId
}
