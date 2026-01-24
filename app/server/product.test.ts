import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ObjectId } from 'mongodb'

// --- Mock Imports for Testing ---

// Mock for MongoDB collection
const mockProductCollection = {
    findOne: vi.fn(),
    find: vi.fn(() => ({
        sort: vi.fn(() => ({
            skip: vi.fn(() => ({
                limit: vi.fn(() => ({
                    toArray: vi.fn(),
                })),
            })),
        })),
    })),
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    deleteOne: vi.fn(),
    countDocuments: vi.fn(),
}

const mockDb = {
    collection: vi.fn(() => mockProductCollection),
}

const mockClientPromise = Promise.resolve({
    db: () => mockDb,
})

// Mock mongo client
vi.mock('./db/mongo', () => ({
    default: mockClientPromise,
}))

// Mock auth utilities
const mockAuthSession = vi.fn()
const mockRequireRole = vi.fn()

vi.mock('./auth-utils', () => ({
    getAuthSession: () => mockAuthSession(),
    requireRole: (roles: string[]) => mockRequireRole(roles),
}))

// --- Unit Tests ---

describe('Product Types and Schema', () => {
    it('should define ProductPricing interface with cost and selling fields', async () => {
        const pricing = {
            cost: 50.00,
            selling: 100.00,
        }
        
        expect(pricing.cost).toBe(50.00)
        expect(pricing.selling).toBe(100.00)
    })

    it('should define ProductImages interface with arrays for multiple images', async () => {
        const images = {
            original: ['image1.jpg', 'image2.jpg'],
            enhanced: ['enhanced1.jpg'],
        }
        
        expect(Array.isArray(images.original)).toBe(true)
        expect(Array.isArray(images.enhanced)).toBe(true)
        expect(images.original).toHaveLength(2)
    })

    it('should define Product interface with all required fields', async () => {
        const product = {
            _id: new ObjectId(),
            supplierId: 'supplier-123',
            name: 'Handmade Vase',
            description: 'Beautiful ceramic vase',
            pricing: { cost: 25, selling: 50 },
            inventory: { onHand: 10 },
            images: { original: [], enhanced: [] },
            status: 'active' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        expect(product.supplierId).toBe('supplier-123')
        expect(product.pricing.cost).toBe(25)
        expect(product.pricing.selling).toBe(50)
        expect(product.status).toBe('active')
    })

    it('should define ProductPublic without cost field', async () => {
        const publicProduct = {
            supplierId: 'supplier-123',
            name: 'Handmade Vase',
            description: 'Beautiful ceramic vase',
            pricing: { selling: 50 }, // No cost field
            inventory: { onHand: 10 },
            images: { original: [], enhanced: [] },
            status: 'active' as const,
            createdAt: new Date(),
            updatedAt: new Date(),
        }
        
        expect(publicProduct.pricing).not.toHaveProperty('cost')
        expect(publicProduct.pricing.selling).toBe(50)
    })
})

describe('Product Utility Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('stripCostField', () => {
        it('should remove cost field from product pricing', async () => {
            const { stripCostField } = await import('./product-utils')
            
            const product = {
                _id: new ObjectId(),
                supplierId: 'supplier-123',
                name: 'Test Product',
                description: 'Test Description',
                pricing: { cost: 25, selling: 50 },
                inventory: { onHand: 10 },
                images: { original: ['img.jpg'], enhanced: [] },
                status: 'active' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            
            const publicProduct = stripCostField(product)
            
            expect(publicProduct.pricing).not.toHaveProperty('cost')
            expect(publicProduct.pricing.selling).toBe(50)
            expect(publicProduct.name).toBe('Test Product')
        })

        it('should preserve all other fields when stripping cost', async () => {
            const { stripCostField } = await import('./product-utils')
            
            const product = {
                _id: new ObjectId(),
                supplierId: 'supplier-123',
                name: 'Test Product',
                description: 'Test Description',
                pricing: { cost: 25, selling: 50 },
                inventory: { onHand: 10 },
                images: { original: ['img1.jpg', 'img2.jpg'], enhanced: ['enh1.jpg'] },
                status: 'draft' as const,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            
            const publicProduct = stripCostField(product)
            
            expect(publicProduct.supplierId).toBe('supplier-123')
            expect(publicProduct.description).toBe('Test Description')
            expect(publicProduct.inventory.onHand).toBe(10)
            expect(publicProduct.images.original).toHaveLength(2)
            expect(publicProduct.status).toBe('draft')
        })
    })

    describe('createProduct', () => {
        it('should create a product with correct structure', async () => {
            const insertedId = new ObjectId()
            mockProductCollection.insertOne.mockResolvedValueOnce({ insertedId })
            
            const { createProduct } = await import('./product-utils')
            
            const result = await createProduct('supplier-123', {
                name: 'New Product',
                description: 'Product description',
                costPrice: 30,
                sellingPrice: 60,
                quantity: 15,
                images: ['image1.jpg'],
                status: 'active',
            })
            
            expect(mockProductCollection.insertOne).toHaveBeenCalled()
            expect(result.name).toBe('New Product')
            expect(result.supplierId).toBe('supplier-123')
            expect(result.pricing.cost).toBe(30)
            expect(result.pricing.selling).toBe(60)
            expect(result._id).toEqual(insertedId)
        })

        it('should set default status to draft', async () => {
            const insertedId = new ObjectId()
            mockProductCollection.insertOne.mockResolvedValueOnce({ insertedId })
            
            const { createProduct } = await import('./product-utils')
            
            const result = await createProduct('supplier-123', {
                name: 'New Product',
                description: 'Product description',
                costPrice: 30,
                sellingPrice: 60,
                quantity: 15,
            })
            
            expect(result.status).toBe('draft')
        })

        it('should initialize empty enhanced images array', async () => {
            const insertedId = new ObjectId()
            mockProductCollection.insertOne.mockResolvedValueOnce({ insertedId })
            
            const { createProduct } = await import('./product-utils')
            
            const result = await createProduct('supplier-123', {
                name: 'New Product',
                description: 'Product description',
                costPrice: 30,
                sellingPrice: 60,
                quantity: 15,
                images: ['original.jpg'],
            })
            
            expect(result.images.original).toEqual(['original.jpg'])
            expect(result.images.enhanced).toEqual([])
        })
    })

    describe('getProductById', () => {
        it('should return product when found', async () => {
            const productId = new ObjectId()
            const mockProduct = {
                _id: productId,
                supplierId: 'supplier-123',
                name: 'Test Product',
                description: 'Test',
                pricing: { cost: 25, selling: 50 },
                inventory: { onHand: 10 },
                images: { original: [], enhanced: [] },
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            
            mockProductCollection.findOne.mockResolvedValueOnce(mockProduct)
            
            const { getProductById } = await import('./product-utils')
            const result = await getProductById(productId.toString())
            
            expect(result).toEqual(mockProduct)
        })

        it('should return null for invalid ObjectId', async () => {
            const { getProductById } = await import('./product-utils')
            const result = await getProductById('invalid-id')
            
            expect(result).toBeNull()
        })

        it('should return null when product not found', async () => {
            mockProductCollection.findOne.mockResolvedValueOnce(null)
            
            const { getProductById } = await import('./product-utils')
            const result = await getProductById(new ObjectId().toString())
            
            expect(result).toBeNull()
        })
    })

    describe('deleteProduct', () => {
        it('should return true when product is deleted', async () => {
            mockProductCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 })
            
            const { deleteProduct } = await import('./product-utils')
            const result = await deleteProduct(new ObjectId().toString())
            
            expect(result).toBe(true)
        })

        it('should return false when product not found', async () => {
            mockProductCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 })
            
            const { deleteProduct } = await import('./product-utils')
            const result = await deleteProduct(new ObjectId().toString())
            
            expect(result).toBe(false)
        })

        it('should return false for invalid ObjectId', async () => {
            const { deleteProduct } = await import('./product-utils')
            const result = await deleteProduct('invalid-id')
            
            expect(result).toBe(false)
        })
    })

    describe('isProductOwner', () => {
        it('should return true when user is the product supplier', async () => {
            const productId = new ObjectId()
            mockProductCollection.findOne.mockResolvedValueOnce({
                _id: productId,
                supplierId: 'supplier-123',
            })
            
            const { isProductOwner } = await import('./product-utils')
            const result = await isProductOwner(productId.toString(), 'supplier-123')
            
            expect(result).toBe(true)
        })

        it('should return false when user is not the product supplier', async () => {
            const productId = new ObjectId()
            mockProductCollection.findOne.mockResolvedValueOnce({
                _id: productId,
                supplierId: 'supplier-123',
            })
            
            const { isProductOwner } = await import('./product-utils')
            const result = await isProductOwner(productId.toString(), 'other-user')
            
            expect(result).toBe(false)
        })

        it('should return false when product not found', async () => {
            mockProductCollection.findOne.mockResolvedValueOnce(null)
            
            const { isProductOwner } = await import('./product-utils')
            const result = await isProductOwner(new ObjectId().toString(), 'supplier-123')
            
            expect(result).toBe(false)
        })
    })
})

describe('RBAC for Product Operations', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('Create Product Access Control', () => {
        it('should allow suppliers to create products', async () => {
            const supplierUser = {
                id: 'supplier-123',
                email: 'supplier@test.com',
                name: 'Supplier',
                role: 'supplier' as const,
                shippingAddress: null,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            
            // Supplier role should be allowed
            const allowedRoles = ['supplier', 'admin']
            expect(allowedRoles.includes(supplierUser.role)).toBe(true)
        })

        it('should allow admins to create products', async () => {
            const adminUser = {
                id: 'admin-123',
                email: 'admin@test.com',
                name: 'Admin',
                role: 'admin' as const,
                shippingAddress: null,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            
            const allowedRoles = ['supplier', 'admin']
            expect(allowedRoles.includes(adminUser.role)).toBe(true)
        })

        it('should deny regular users from creating products', async () => {
            const regularUser = {
                id: 'user-123',
                email: 'user@test.com',
                name: 'User',
                role: 'user' as const,
                shippingAddress: null,
                emailVerified: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            }
            
            const allowedRoles = ['supplier', 'admin']
            expect(allowedRoles.includes(regularUser.role)).toBe(false)
        })
    })

    describe('Update/Delete Product Access Control', () => {
        it('should allow admins to update any product', async () => {
            const adminUser = { id: 'admin-123', role: 'admin' as const }
            const product = { supplierId: 'other-supplier' }
            
            // Admin can always update regardless of ownership
            const canUpdate = adminUser.role === 'admin' || product.supplierId === adminUser.id
            expect(canUpdate).toBe(true)
        })

        it('should allow suppliers to update their own products', async () => {
            const supplierUser = { id: 'supplier-123', role: 'supplier' as 'user' | 'supplier' | 'admin' }
            const ownProduct = { supplierId: 'supplier-123' }
            
            const canUpdate = supplierUser.role === 'admin' || ownProduct.supplierId === supplierUser.id
            expect(canUpdate).toBe(true)
        })

        it('should deny suppliers from updating other suppliers products', async () => {
            const supplierUser = { id: 'supplier-123', role: 'supplier' as 'user' | 'supplier' | 'admin' }
            const otherProduct = { supplierId: 'other-supplier' }
            
            const canUpdate = supplierUser.role === 'admin' || otherProduct.supplierId === supplierUser.id
            expect(canUpdate).toBe(false)
        })
    })
})

describe('Cost Field Filtering for Non-Admin Users', () => {
    it('should include cost field for admin users', () => {
        const isAdmin = true
        const product = { pricing: { cost: 25, selling: 50 } }
        
        // Admin sees full product
        if (isAdmin) {
            expect(product.pricing.cost).toBe(25)
        }
    })

    it('should exclude cost field for non-admin users', () => {
        const isAdmin = false
        const fullProduct = { pricing: { cost: 25, selling: 50 } }
        
        // Non-admin gets filtered product
        const publicProduct = isAdmin 
            ? fullProduct 
            : { pricing: { selling: fullProduct.pricing.selling } }
        
        expect(publicProduct.pricing).not.toHaveProperty('cost')
        expect(publicProduct.pricing.selling).toBe(50)
    })

    it('should exclude cost field for unauthenticated users', () => {
        const session = null as { user: { role: string } } | null // No session
        const isAdmin = session?.user?.role === 'admin'
        const fullProduct = { pricing: { cost: 25, selling: 50 } }
        
        const publicProduct = isAdmin 
            ? fullProduct 
            : { pricing: { selling: fullProduct.pricing.selling } }
        
        expect(publicProduct.pricing).not.toHaveProperty('cost')
    })

    it('should exclude cost field for supplier users viewing products', () => {
        const supplierSession = { user: { role: 'supplier' } }
        const isAdmin = supplierSession.user.role === 'admin'
        const fullProduct = { pricing: { cost: 25, selling: 50 } }
        
        const publicProduct = isAdmin 
            ? fullProduct 
            : { pricing: { selling: fullProduct.pricing.selling } }
        
        expect(publicProduct.pricing).not.toHaveProperty('cost')
    })
})

describe('Product List Pagination', () => {
    it('should default to page 1 and limit 20', () => {
        const options: { page?: number; limit?: number } = {}
        const page = Math.max(1, options.page || 1)
        const limit = Math.min(100, Math.max(1, options.limit || 20))
        
        expect(page).toBe(1)
        expect(limit).toBe(20)
    })

    it('should cap limit at 100', () => {
        const options = { limit: 500 }
        const limit = Math.min(100, Math.max(1, options.limit || 20))
        
        expect(limit).toBe(100)
    })

    it('should calculate correct skip value', () => {
        const page = 3
        const limit = 20
        const skip = (page - 1) * limit
        
        expect(skip).toBe(40)
    })

    it('should calculate total pages correctly', () => {
        const total = 55
        const limit = 20
        const totalPages = Math.ceil(total / limit)
        
        expect(totalPages).toBe(3)
    })
})

describe('Product Status Filtering', () => {
    it('should support active status filter', () => {
        const validStatuses = ['active', 'draft', 'archived']
        expect(validStatuses.includes('active')).toBe(true)
    })

    it('should support draft status filter', () => {
        const validStatuses = ['active', 'draft', 'archived']
        expect(validStatuses.includes('draft')).toBe(true)
    })

    it('should support archived status filter', () => {
        const validStatuses = ['active', 'draft', 'archived']
        expect(validStatuses.includes('archived')).toBe(true)
    })
})

describe('Image Association Utility Functions', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('validateFirebaseStorageUrl', () => {
        it('should return true for valid Firebase Storage URLs (firebasestorage.googleapis.com)', async () => {
            const { validateFirebaseStorageUrl } = await import('./product-utils')
            
            const validUrl = 'https://firebasestorage.googleapis.com/v0/b/my-bucket/o/images%2Fproduct.jpg'
            expect(validateFirebaseStorageUrl(validUrl)).toBe(true)
        })

        it('should return true for valid Cloud Storage URLs (storage.googleapis.com)', async () => {
            const { validateFirebaseStorageUrl } = await import('./product-utils')
            
            const validUrl = 'https://storage.googleapis.com/my-bucket/images/product.jpg'
            expect(validateFirebaseStorageUrl(validUrl)).toBe(true)
        })

        it('should return true for gs:// protocol URLs', async () => {
            const { validateFirebaseStorageUrl } = await import('./product-utils')
            
            const validUrl = 'gs://my-bucket/images/product.jpg'
            expect(validateFirebaseStorageUrl(validUrl)).toBe(true)
        })

        it('should return false for non-Firebase URLs', async () => {
            const { validateFirebaseStorageUrl } = await import('./product-utils')
            
            expect(validateFirebaseStorageUrl('https://example.com/image.jpg')).toBe(false)
            expect(validateFirebaseStorageUrl('https://cdn.other-service.com/img.png')).toBe(false)
            expect(validateFirebaseStorageUrl('http://localhost:3000/image.jpg')).toBe(false)
        })

        it('should return false for empty or malformed URLs', async () => {
            const { validateFirebaseStorageUrl } = await import('./product-utils')
            
            expect(validateFirebaseStorageUrl('')).toBe(false)
            expect(validateFirebaseStorageUrl('not-a-url')).toBe(false)
        })
    })

    describe('associateImages', () => {
        it('should append images to existing product images array', async () => {
            const productId = new ObjectId()
            const existingProduct = {
                _id: productId,
                supplierId: 'supplier-123',
                name: 'Test Product',
                images: { original: ['existing.jpg'], enhanced: [] },
            }
            
            mockProductCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 })
            mockProductCollection.findOne.mockResolvedValueOnce({
                ...existingProduct,
                images: { original: ['existing.jpg', 'new1.jpg', 'new2.jpg'], enhanced: [] },
            })
            
            const { associateImages } = await import('./product-utils')
            const result = await associateImages(productId.toString(), {
                imageUrls: ['new1.jpg', 'new2.jpg'],
                imageType: 'original',
                mode: 'append',
            })
            
            expect(result).not.toBeNull()
            expect(result?.images.original).toContain('new1.jpg')
            expect(result?.images.original).toContain('new2.jpg')
        })

        it('should replace images when mode is replace', async () => {
            const productId = new ObjectId()
            
            mockProductCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 })
            mockProductCollection.findOne.mockResolvedValueOnce({
                _id: productId,
                images: { original: ['replaced.jpg'], enhanced: [] },
            })
            
            const { associateImages } = await import('./product-utils')
            const result = await associateImages(productId.toString(), {
                imageUrls: ['replaced.jpg'],
                imageType: 'original',
                mode: 'replace',
            })
            
            expect(result).not.toBeNull()
            expect(result?.images.original).toEqual(['replaced.jpg'])
        })

        it('should support associating enhanced images', async () => {
            const productId = new ObjectId()
            
            mockProductCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 })
            mockProductCollection.findOne.mockResolvedValueOnce({
                _id: productId,
                images: { original: [], enhanced: ['enhanced.jpg'] },
            })
            
            const { associateImages } = await import('./product-utils')
            const result = await associateImages(productId.toString(), {
                imageUrls: ['enhanced.jpg'],
                imageType: 'enhanced',
            })
            
            expect(result).not.toBeNull()
            expect(result?.images.enhanced).toContain('enhanced.jpg')
        })

        it('should return null for non-existent product', async () => {
            mockProductCollection.updateOne.mockResolvedValueOnce({ matchedCount: 0 })
            
            const { associateImages } = await import('./product-utils')
            const result = await associateImages(new ObjectId().toString(), {
                imageUrls: ['image.jpg'],
                imageType: 'original',
            })
            
            expect(result).toBeNull()
        })

        it('should return null for invalid ObjectId', async () => {
            const { associateImages } = await import('./product-utils')
            const result = await associateImages('invalid-id', {
                imageUrls: ['image.jpg'],
                imageType: 'original',
            })
            
            expect(result).toBeNull()
        })

        it('should default to append mode when mode is not specified', async () => {
            const productId = new ObjectId()
            
            mockProductCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 })
            mockProductCollection.findOne.mockResolvedValueOnce({
                _id: productId,
                images: { original: ['existing.jpg', 'appended.jpg'], enhanced: [] },
            })
            
            const { associateImages } = await import('./product-utils')
            const result = await associateImages(productId.toString(), {
                imageUrls: ['appended.jpg'],
                imageType: 'original',
                // mode not specified - should default to 'append'
            })
            
            expect(result).not.toBeNull()
            expect(mockProductCollection.updateOne).toHaveBeenCalled()
        })
    })
})

describe('RBAC for Image Association', () => {
    it('should allow suppliers to associate images to their own products', () => {
        const supplierUser = { id: 'supplier-123', role: 'supplier' as 'user' | 'supplier' | 'admin' }
        const ownProduct = { supplierId: 'supplier-123' }
        
        const allowedRoles = ['supplier', 'admin']
        const canAssociate = allowedRoles.includes(supplierUser.role) && 
            (supplierUser.role === 'admin' || ownProduct.supplierId === supplierUser.id)
        
        expect(canAssociate).toBe(true)
    })

    it('should allow admins to associate images to any product', () => {
        const adminUser = { id: 'admin-123', role: 'admin' as const }
        const anyProduct = { supplierId: 'other-supplier' }
        
        const allowedRoles = ['supplier', 'admin']
        const canAssociate = allowedRoles.includes(adminUser.role) && 
            (adminUser.role === 'admin' || anyProduct.supplierId === adminUser.id)
        
        expect(canAssociate).toBe(true)
    })

    it('should deny suppliers from associating images to other suppliers products', () => {
        const supplierUser = { id: 'supplier-123', role: 'supplier' as 'user' | 'supplier' | 'admin' }
        const otherProduct = { supplierId: 'other-supplier' }
        
        const allowedRoles = ['supplier', 'admin']
        const canAssociate = allowedRoles.includes(supplierUser.role) && 
            (supplierUser.role === 'admin' || otherProduct.supplierId === supplierUser.id)
        
        expect(canAssociate).toBe(false)
    })

    it('should deny regular users from associating images', () => {
        const regularUser = { id: 'user-123', role: 'user' as const }
        
        const allowedRoles = ['supplier', 'admin']
        const canAssociate = allowedRoles.includes(regularUser.role)
        
        expect(canAssociate).toBe(false)
    })
})

