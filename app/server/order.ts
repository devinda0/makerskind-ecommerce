import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

import type { 
    CreateOrderInput,
    OrderStatus 
} from './order-utils'

// --- Input Types for Server Functions ---

interface GetOrdersInput {
    page?: number
    limit?: number
    status?: OrderStatus
}

interface GetOrderByIdInput {
    orderId: string
}

interface UpdateOrderStatusInput {
    orderId: string
    status: OrderStatus
}

// --- Server Functions ---

/**
 * Create a new order from cart items (Any user - guest or registered)
 * Validates stock and atomically decrements inventory
 */
export const createOrderFn = createServerFn({ method: "POST" })
    .inputValidator((data: CreateOrderInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { auth } = await import('./auth-config')
        const { createOrder, toSerializable } = await import('./order-utils')
        const request = getRequest()
        
        let session = await getAuthSession()
        
        // If no session, sign in anonymously
        if (!session?.user) {
            const result = await auth.api.signInAnonymous({ headers: request.headers })
            if (result) {
                // BetterAuth user structure matches our needs here
                session = {
                    user: result.user,
                    session: result.session
                }
            }
        }
        
        if (!session?.user) {
            throw new Error('Failed to create session')
        }
        
        // Validate input
        if (!data.items || data.items.length === 0) {
            throw new Error('Order must contain at least one item')
        }
        
        if (!data.shippingAddress) {
            throw new Error('Shipping address is required')
        }
        
        const order = await createOrder(session.user.id, data)
        
        return { 
            order: toSerializable(order), 
            success: true 
        }
    })

/**
 * Get a specific order by ID
 * Users can only view their own orders, admins can view any
 */
export const getOrderByIdFn = createServerFn({ method: "GET" })
    .inputValidator((data: GetOrderByIdInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { getOrderById, isOrderOwner, toSerializable } = await import('./order-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        const order = await getOrderById(data.orderId)
        
        if (!order) {
            throw new Error('Order not found')
        }
        
        // Check authorization: admin can view any, users only their own
        const isAdmin = session.user.role === 'admin'
        const isOwner = await isOrderOwner(data.orderId, session.user.id)
        
        if (!isAdmin && !isOwner) {
            throw new Error('Access denied: You can only view your own orders')
        }
        
        return { order: toSerializable(order) }
    })

/**
 * Get current user's orders with pagination
 */
export const getMyOrdersFn = createServerFn({ method: "GET" })
    .inputValidator((data: GetOrdersInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { getOrdersByUser, toSerializable } = await import('./order-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        const result = await getOrdersByUser(session.user.id, {
            page: data.page,
            limit: data.limit,
            status: data.status
        })
        
        return {
            ...result,
            orders: result.orders.map(toSerializable)
        }
    })

/**
 * Get orders for supplier's products (Supplier only)
 */
export const getSupplierOrdersFn = createServerFn({ method: "GET" })
    .inputValidator((data: GetOrdersInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { getOrdersBySupplier, toSerializable } = await import('./order-utils')
        
        const user = await requireRole(['supplier'])
        
        const result = await getOrdersBySupplier(user.id, {
            page: data.page,
            limit: data.limit,
            status: data.status
        })
        
        return {
            ...result,
            orders: result.orders.map(toSerializable)
        }
    })

/**
 * Get all orders with pagination (Admin only)
 */
export const getOrdersFn = createServerFn({ method: "GET" })
    .inputValidator((data: GetOrdersInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { getAllOrders, toSerializable } = await import('./order-utils')
        
        await requireRole(['admin'])
        
        const result = await getAllOrders({
            page: data.page,
            limit: data.limit,
            status: data.status
        })
        
        return {
            ...result,
            orders: result.orders.map(toSerializable)
        }
    })

/**
 * Update order status (Admin only)
 */
export const updateOrderStatusFn = createServerFn({ method: "POST" })
    .inputValidator((data: UpdateOrderStatusInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { getOrderById, updateOrderStatus, toSerializable } = await import('./order-utils')
        
        await requireRole(['admin'])
        
        const existingOrder = await getOrderById(data.orderId)
        if (!existingOrder) {
            throw new Error('Order not found')
        }
        
        const updatedOrder = await updateOrderStatus(data.orderId, data.status)
        
        if (!updatedOrder) {
            throw new Error('Failed to update order status')
        }
        
        return { 
            order: toSerializable(updatedOrder), 
            success: true 
        }
    })
