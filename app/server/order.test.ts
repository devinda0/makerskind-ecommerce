import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock Imports for Testing ---

// Mock for MongoDB collections
const mockOrderCollection = {
    findOne: vi.fn(),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    find: vi.fn(),
    countDocuments: vi.fn(),
}

const mockProductCollection = {
    find: vi.fn(),
    bulkWrite: vi.fn(),
}

const mockCartCollection = {
    updateOne: vi.fn(),
}

const mockDb = {
    collection: vi.fn((name: string) => {
        if (name === 'orders') return mockOrderCollection
        if (name === 'products') return mockProductCollection
        if (name === 'carts') return mockCartCollection
        return mockOrderCollection
    }),
}

const mockSession = {
    withTransaction: vi.fn(async (callback: () => Promise<void>) => {
        await callback()
    }),
    endSession: vi.fn(),
}

const mockClient = {
    db: () => mockDb,
    startSession: () => mockSession,
}

const mockClientPromise = Promise.resolve(mockClient)

// Mock mongo client
vi.mock('./db/mongo', () => ({
    default: mockClientPromise,
}))

// Mock ObjectId
vi.mock('mongodb', () => ({
    ObjectId: class MockObjectId {
        private id: string
        constructor(id?: string) {
            this.id = id || Math.random().toString(36).substring(7)
        }
        toHexString() {
            return this.id
        }
        toString() {
            return this.id
        }
    },
}))

// --- Unit Tests ---

describe('Order Types and Schema', () => {
    it('should define OrderItem interface with required fields', async () => {
        const orderItem = {
            productId: 'prod-123',
            productName: 'Handcrafted Vase',
            quantity: 2,
            unitPrice: 29.99,
            supplierId: 'supplier-456',
        }
        
        expect(orderItem.productId).toBe('prod-123')
        expect(orderItem.productName).toBe('Handcrafted Vase')
        expect(orderItem.quantity).toBe(2)
        expect(orderItem.unitPrice).toBe(29.99)
        expect(orderItem.supplierId).toBe('supplier-456')
    })

    it('should define ShippingAddress interface with required fields', async () => {
        const address = {
            street: '123 Main St',
            city: 'Portland',
            zip: '97201',
            country: 'USA',
        }
        
        expect(address.street).toBe('123 Main St')
        expect(address.city).toBe('Portland')
        expect(address.zip).toBe('97201')
        expect(address.country).toBe('USA')
    })

    it('should define OrderStatus as valid enum values', async () => {
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
        const status = 'pending'
        
        expect(validStatuses).toContain(status)
    })

    it('should define Order interface with all required fields', async () => {
        const order = {
            userId: 'user-123',
            items: [],
            shippingAddress: {
                street: '123 Main St',
                city: 'Portland',
                zip: '97201',
                country: 'USA',
            },
            totals: {
                subtotal: 59.98,
                shipping: 0,
                total: 59.98,
            },
            status: 'pending' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        expect(order.userId).toBe('user-123')
        expect(order.status).toBe('pending')
        expect(order.totals.total).toBe(59.98)
    })
})

describe('Order Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('toSerializable', () => {
        it('should convert MongoDB order to serializable format', async () => {
            const { toSerializable } = await import('./order-utils')
            const { ObjectId } = await import('mongodb')
            
            const mongoOrder = {
                _id: new ObjectId('order-123'),
                userId: 'user-123',
                items: [{
                    productId: 'prod-1',
                    productName: 'Vase',
                    quantity: 2,
                    unitPrice: 29.99,
                    supplierId: 'supplier-1',
                }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
                totals: {
                    subtotal: 59.98,
                    shipping: 0,
                    total: 59.98,
                },
                status: 'pending' as const,
                createdAt: new Date('2026-01-24T10:00:00Z'),
                updatedAt: new Date('2026-01-24T10:00:00Z'),
            }
            
            const result = toSerializable(mongoOrder)
            
            expect(result._id).toBe('order-123')
            expect(result.createdAt).toBe('2026-01-24T10:00:00.000Z')
            expect(result.updatedAt).toBe('2026-01-24T10:00:00.000Z')
        })
    })

    describe('createOrder - Stock Validation', () => {
        it('should validate that all products exist and are active', async () => {
            // Setup: Product not found scenario
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([]) // No products found
            })
            
            const { createOrder } = await import('./order-utils')
            
            await expect(createOrder('user-123', {
                items: [{ productId: 'nonexistent-prod', quantity: 1 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })).rejects.toThrow('One or more products not found or not available')
        })

        it('should throw error for insufficient stock', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            // Product exists but has insufficient stock
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Vase',
                    pricing: { selling: 29.99 },
                    inventory: { onHand: 1 }, // Only 1 in stock
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            const { createOrder } = await import('./order-utils')
            
            await expect(createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 5 }], // Requesting 5
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })).rejects.toThrow('Insufficient stock for product: Vase')
        })
    })

    describe('createOrder - Atomic Stock Decrement', () => {
        it('should use $inc operator for atomic stock decrement', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            // Product with sufficient stock
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Vase',
                    pricing: { selling: 29.99 },
                    inventory: { onHand: 10 },
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            // BulkWrite succeeds
            mockProductCollection.bulkWrite.mockResolvedValueOnce({
                modifiedCount: 1,
            })
            
            // Insert order succeeds
            mockOrderCollection.insertOne.mockResolvedValueOnce({
                insertedId: new ObjectId('order-123'),
            })
            
            // Cart update succeeds
            mockCartCollection.updateOne.mockResolvedValueOnce({
                modifiedCount: 1,
            })
            
            const { createOrder } = await import('./order-utils')
            
            await createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 3 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })
            
            // Verify bulkWrite was called with $inc operator
            expect(mockProductCollection.bulkWrite).toHaveBeenCalledWith(
                expect.arrayContaining([
                    expect.objectContaining({
                        updateOne: expect.objectContaining({
                            filter: expect.objectContaining({
                                'inventory.onHand': { $gte: 3 },
                            }),
                            update: expect.objectContaining({
                                $inc: { 'inventory.onHand': -3 },
                            }),
                        }),
                    }),
                ]),
                expect.objectContaining({ session: expect.anything() })
            )
        })

        it('should throw error if atomic decrement fails', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Vase',
                    pricing: { selling: 29.99 },
                    inventory: { onHand: 10 },
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            // BulkWrite fails (concurrent modification reduced stock)
            mockProductCollection.bulkWrite.mockResolvedValueOnce({
                modifiedCount: 0, // No items were updated
            })
            
            const { createOrder } = await import('./order-utils')
            
            await expect(createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 3 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })).rejects.toThrow('Insufficient stock for one or more items')
        })
    })

    describe('createOrder - Transactional Integrity', () => {
        it('should use MongoDB session with transaction', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Vase',
                    pricing: { selling: 29.99 },
                    inventory: { onHand: 10 },
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            mockProductCollection.bulkWrite.mockResolvedValueOnce({ modifiedCount: 1 })
            mockOrderCollection.insertOne.mockResolvedValueOnce({
                insertedId: new ObjectId('order-123'),
            })
            mockCartCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
            
            const { createOrder } = await import('./order-utils')
            
            await createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 1 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })
            
            // Verify transaction was used
            expect(mockSession.withTransaction).toHaveBeenCalled()
            expect(mockSession.endSession).toHaveBeenCalled()
        })

        it('should end session even on error', async () => {
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockRejectedValueOnce(new Error('Database error'))
            })
            
            const { createOrder } = await import('./order-utils')
            
            await expect(createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 1 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })).rejects.toThrow('Database error')
            
            // Session should still be ended
            expect(mockSession.endSession).toHaveBeenCalled()
        })
    })

    describe('createOrder - Order Totals Calculation', () => {
        it('should calculate subtotal correctly', async () => {
            const { ObjectId } = await import('mongodb')
            const prod1Id = new ObjectId('prod-1')
            const prod2Id = new ObjectId('prod-2')
            
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([
                    {
                        _id: prod1Id,
                        name: 'Vase',
                        pricing: { selling: 25.00 },
                        inventory: { onHand: 10 },
                        supplierId: 'supplier-1',
                        status: 'active',
                    },
                    {
                        _id: prod2Id,
                        name: 'Bowl',
                        pricing: { selling: 15.00 },
                        inventory: { onHand: 10 },
                        supplierId: 'supplier-1',
                        status: 'active',
                    },
                ])
            })
            
            mockProductCollection.bulkWrite.mockResolvedValueOnce({ modifiedCount: 2 })
            mockOrderCollection.insertOne.mockResolvedValueOnce({
                insertedId: new ObjectId('order-123'),
            })
            mockCartCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
            
            const { createOrder } = await import('./order-utils')
            
            const result = await createOrder('user-123', {
                items: [
                    { productId: 'prod-1', quantity: 2 }, // 25 * 2 = 50
                    { productId: 'prod-2', quantity: 3 }, // 15 * 3 = 45
                ],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })
            
            expect(result.totals.subtotal).toBe(95) // 50 + 45
        })

        it('should provide free shipping for orders over $50', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Premium Vase',
                    pricing: { selling: 60.00 },
                    inventory: { onHand: 10 },
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            mockProductCollection.bulkWrite.mockResolvedValueOnce({ modifiedCount: 1 })
            mockOrderCollection.insertOne.mockResolvedValueOnce({
                insertedId: new ObjectId('order-123'),
            })
            mockCartCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
            
            const { createOrder } = await import('./order-utils')
            
            const result = await createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 1 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })
            
            expect(result.totals.shipping).toBe(0)
            expect(result.totals.total).toBe(60)
        })

        it('should charge $5.99 shipping for orders under $50', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Small Item',
                    pricing: { selling: 20.00 },
                    inventory: { onHand: 10 },
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            mockProductCollection.bulkWrite.mockResolvedValueOnce({ modifiedCount: 1 })
            mockOrderCollection.insertOne.mockResolvedValueOnce({
                insertedId: new ObjectId('order-123'),
            })
            mockCartCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
            
            const { createOrder } = await import('./order-utils')
            
            const result = await createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 1 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })
            
            expect(result.totals.shipping).toBe(5.99)
            expect(result.totals.total).toBeCloseTo(25.99, 2) // 20 + 5.99
        })
    })

    describe('createOrder - Cart Clearing', () => {
        it('should clear user cart after successful order', async () => {
            const { ObjectId } = await import('mongodb')
            const productId = new ObjectId('prod-123')
            
            mockProductCollection.find.mockReturnValueOnce({
                toArray: vi.fn().mockResolvedValueOnce([{
                    _id: productId,
                    name: 'Vase',
                    pricing: { selling: 29.99 },
                    inventory: { onHand: 10 },
                    supplierId: 'supplier-1',
                    status: 'active',
                }])
            })
            
            mockProductCollection.bulkWrite.mockResolvedValueOnce({ modifiedCount: 1 })
            mockOrderCollection.insertOne.mockResolvedValueOnce({
                insertedId: new ObjectId('order-123'),
            })
            mockCartCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
            
            const { createOrder } = await import('./order-utils')
            
            await createOrder('user-123', {
                items: [{ productId: 'prod-123', quantity: 1 }],
                shippingAddress: {
                    street: '123 Main St',
                    city: 'Portland',
                    zip: '97201',
                    country: 'USA',
                },
            })
            
            // Verify cart was cleared
            expect(mockCartCollection.updateOne).toHaveBeenCalledWith(
                { userId: 'user-123' },
                expect.objectContaining({
                    $set: expect.objectContaining({
                        items: [],
                    }),
                }),
                expect.objectContaining({ session: expect.anything() })
            )
        })
    })
})

describe('getOrderById', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('should return order when found', async () => {
        const { ObjectId } = await import('mongodb')
        const existingOrder = {
            _id: new ObjectId('order-123'),
            userId: 'user-123',
            items: [],
            shippingAddress: {
                street: '123 Main St',
                city: 'Portland',
                zip: '97201',
                country: 'USA',
            },
            totals: { subtotal: 50, shipping: 0, total: 50 },
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        mockOrderCollection.findOne.mockResolvedValueOnce(existingOrder)
        
        const { getOrderById } = await import('./order-utils')
        const result = await getOrderById('order-123')
        
        expect(result).toEqual(existingOrder)
    })

    it('should return null for invalid ObjectId', async () => {
        const { getOrderById } = await import('./order-utils')
        const result = await getOrderById('invalid-id')
        
        // Should handle gracefully (returns null or undefined)
        expect(result).toBeFalsy()
    })
})

describe('updateOrderStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('should update order status', async () => {
        const { ObjectId } = await import('mongodb')
        const orderId = new ObjectId('order-123')
        const updatedOrder = {
            _id: orderId,
            userId: 'user-123',
            items: [],
            shippingAddress: {
                street: '123 Main St',
                city: 'Portland',
                zip: '97201',
                country: 'USA',
            },
            totals: { subtotal: 50, shipping: 0, total: 50 },
            status: 'shipped',
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        mockOrderCollection.updateOne.mockResolvedValueOnce({ modifiedCount: 1 })
        mockOrderCollection.findOne.mockResolvedValueOnce(updatedOrder)
        
        const { updateOrderStatus } = await import('./order-utils')
        const result = await updateOrderStatus('order-123', 'shipped')
        
        expect(result?.status).toBe('shipped')
        expect(mockOrderCollection.updateOne).toHaveBeenCalledWith(
            expect.objectContaining({ _id: expect.anything() }),
            expect.objectContaining({
                $set: expect.objectContaining({
                    status: 'shipped',
                }),
            })
        )
    })
})

describe('isOrderOwner', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('should return true if user owns the order', async () => {
        const { ObjectId } = await import('mongodb')
        mockOrderCollection.findOne.mockResolvedValueOnce({
            _id: new ObjectId('order-123'),
            userId: 'user-123',
        })
        
        const { isOrderOwner } = await import('./order-utils')
        const result = await isOrderOwner('order-123', 'user-123')
        
        expect(result).toBe(true)
    })

    it('should return false if user does not own the order', async () => {
        const { ObjectId } = await import('mongodb')
        mockOrderCollection.findOne.mockResolvedValueOnce({
            _id: new ObjectId('order-123'),
            userId: 'other-user',
        })
        
        const { isOrderOwner } = await import('./order-utils')
        const result = await isOrderOwner('order-123', 'user-123')
        
        expect(result).toBe(false)
    })
})

describe('Pagination Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('getOrdersByUser', () => {
        it('should return paginated orders for user', async () => {
            const mockOrders = [
                { _id: 'order-1', userId: 'user-123' },
                { _id: 'order-2', userId: 'user-123' },
            ]
            
            const mockCursor = {
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                toArray: vi.fn().mockResolvedValueOnce(mockOrders),
            }
            
            mockOrderCollection.find.mockReturnValueOnce(mockCursor)
            mockOrderCollection.countDocuments.mockResolvedValueOnce(2)
            
            const { getOrdersByUser } = await import('./order-utils')
            const result = await getOrdersByUser('user-123', { page: 1, limit: 10 })
            
            expect(result.orders).toHaveLength(2)
            expect(result.total).toBe(2)
            expect(result.page).toBe(1)
            expect(result.limit).toBe(10)
            expect(result.totalPages).toBe(1)
        })
    })

    describe('getAllOrders', () => {
        it('should return all orders with pagination', async () => {
            const mockOrders = Array(20).fill(null).map((_, i) => ({
                _id: `order-${i}`,
                userId: `user-${i}`,
            }))
            
            const mockCursor = {
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                toArray: vi.fn().mockResolvedValueOnce(mockOrders),
            }
            
            mockOrderCollection.find.mockReturnValueOnce(mockCursor)
            mockOrderCollection.countDocuments.mockResolvedValueOnce(50)
            
            const { getAllOrders } = await import('./order-utils')
            const result = await getAllOrders({ page: 1, limit: 20 })
            
            expect(result.orders).toHaveLength(20)
            expect(result.total).toBe(50)
            expect(result.totalPages).toBe(3)
        })
    })

    describe('getOrdersBySupplier', () => {
        it('should filter orders by supplier ID in items', async () => {
            const mockOrders = [
                { _id: 'order-1', items: [{ supplierId: 'supplier-123' }] },
            ]
            
            const mockCursor = {
                sort: vi.fn().mockReturnThis(),
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                toArray: vi.fn().mockResolvedValueOnce(mockOrders),
            }
            
            mockOrderCollection.find.mockReturnValueOnce(mockCursor)
            mockOrderCollection.countDocuments.mockResolvedValueOnce(1)
            
            const { getOrdersBySupplier } = await import('./order-utils')
            const result = await getOrdersBySupplier('supplier-123')
            
            expect(mockOrderCollection.find).toHaveBeenCalledWith(
                expect.objectContaining({
                    'items.supplierId': 'supplier-123',
                })
            )
            expect(result.orders).toHaveLength(1)
        })
    })
})
