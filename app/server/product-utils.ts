import clientPromise from './db/mongo'
import type { ObjectId, Collection, Db, WithId } from 'mongodb'

// --- Product Types ---

export interface ProductPricing {
    cost: number    // Admin only - not exposed to public
    selling: number // Public selling price
}

export interface ProductInventory {
    onHand: number
}

export interface ProductImages {
    original: string[]   // Multiple product images
    enhanced: string[]   // AI-enhanced versions of images
}

export type ProductStatus = 'active' | 'draft' | 'archived' | 'pending_review' | 'rejected'

export interface Product {
    _id?: ObjectId
    supplierId: string
    name: string
    description: string
    pricing: ProductPricing
    inventory: ProductInventory
    images: ProductImages
    status: ProductStatus
    createdAt: Date
    updatedAt: Date
}

// Safe output type without cost field for non-admin users
export interface ProductPublic {
    _id?: ObjectId
    supplierId: string
    name: string
    description: string
    pricing: { selling: number }
    inventory: ProductInventory
    images: ProductImages
    status: ProductStatus
    createdAt: Date
    updatedAt: Date
}

// --- Serializable Types for Server Functions ---
// These types use string IDs instead of ObjectId for safe serialization

export interface ProductSerializable {
    _id: string
    supplierId: string
    name: string
    description: string
    pricing: ProductPricing
    inventory: ProductInventory
    images: ProductImages
    status: ProductStatus
    createdAt: string
    updatedAt: string
}

export interface ProductPublicSerializable {
    _id: string
    supplierId: string
    name: string
    description: string
    pricing: { selling: number }
    inventory: ProductInventory
    images: ProductImages
    status: ProductStatus
    createdAt: string
    updatedAt: string
}

// Input type for creating a new product
export interface CreateProductInput {
    name: string
    description: string
    costPrice: number
    sellingPrice: number
    quantity: number
    images?: string[]
    status?: ProductStatus
}

// Input type for updating a product
export interface UpdateProductInput {
    name?: string
    description?: string
    costPrice?: number
    sellingPrice?: number
    quantity?: number
    images?: string[]
    status?: ProductStatus
}

// Pagination options
export interface ProductListOptions {
    page?: number
    limit?: number
    status?: ProductStatus
    supplierId?: string
    search?: string
}

// Paginated response
export interface PaginatedProducts<T> {
    products: T[]
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

export async function getProductCollection(): Promise<Collection<Product>> {
    const db = await getDb()
    return db.collection<Product>('products')
}

// --- Utility Functions ---

/**
 * Convert a MongoDB product document to a serializable format
 * This converts ObjectId to string and Date to ISO string for safe transport
 */
export function toSerializable(product: WithId<Product>): ProductSerializable {
    return {
        _id: product._id.toHexString(),
        supplierId: product.supplierId,
        name: product.name,
        description: product.description,
        pricing: product.pricing,
        inventory: product.inventory,
        images: product.images,
        status: product.status,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
    }
}

/**
 * Strip the cost field from a product for non-admin responses
 * and convert to serializable format
 */
export function stripCostField(product: WithId<Product>): ProductPublicSerializable {
    return {
        _id: product._id.toHexString(),
        supplierId: product.supplierId,
        name: product.name,
        description: product.description,
        pricing: { selling: product.pricing.selling },
        inventory: product.inventory,
        images: product.images,
        status: product.status,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString()
    }
}

/**
 * Create a new product
 */
export async function createProduct(
    supplierId: string,
    input: CreateProductInput
): Promise<WithId<Product>> {
    const collection = await getProductCollection()
    
    const product: Product = {
        supplierId,
        name: input.name,
        description: input.description,
        pricing: {
            cost: input.costPrice,
            selling: input.sellingPrice
        },
        inventory: {
            onHand: input.quantity
        },
        images: {
            original: input.images || [],
            enhanced: []
        },
        status: input.status || 'draft',
        createdAt: new Date(),
        updatedAt: new Date()
    }
    
    const result = await collection.insertOne(product)
    return { ...product, _id: result.insertedId }
}

/**
 * Get a product by its ID
 */
export async function getProductById(productId: string): Promise<WithId<Product> | null> {
    const collection = await getProductCollection()
    const { ObjectId } = await import('mongodb')
    
    try {
        return await collection.findOne({ _id: new ObjectId(productId) })
    } catch {
        // Invalid ObjectId format
        return null
    }
}

/**
 * Get products by supplier ID
 */
export async function getProductsBySupplier(supplierId: string): Promise<WithId<Product>[]> {
    const collection = await getProductCollection()
    return await collection.find({ supplierId }).toArray()
}

/**
 * Get count of products for a supplier
 */
export async function getSupplierProductCount(supplierId: string): Promise<number> {
    const collection = await getProductCollection()
    return await collection.countDocuments({ supplierId })
}

/**
 * Get paginated list of products with optional filters
 */
export async function getProductList(
    options: ProductListOptions = {}
): Promise<PaginatedProducts<WithId<Product>>> {
    const collection = await getProductCollection()
    
    const page = Math.max(1, options.page || 1)
    const limit = Math.min(100, Math.max(1, options.limit || 20))
    const skip = (page - 1) * limit
    
    // Build query filter
    const filter: Record<string, unknown> = {}
    
    if (options.status) {
        filter.status = options.status
    }
    
    if (options.supplierId) {
        filter.supplierId = options.supplierId
    }
    
    if (options.search) {
        filter.$or = [
            { name: { $regex: options.search, $options: 'i' } },
            { description: { $regex: options.search, $options: 'i' } }
        ]
    }
    
    const [products, total] = await Promise.all([
        collection
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray(),
        collection.countDocuments(filter)
    ])
    
    return {
        products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
    }
}

/**
 * Update a product by ID
 */
export async function updateProduct(
    productId: string,
    input: UpdateProductInput
): Promise<WithId<Product> | null> {
    const collection = await getProductCollection()
    const { ObjectId } = await import('mongodb')
    
    let objectId: ObjectId
    try {
        objectId = new ObjectId(productId)
    } catch {
        return null
    }
    
    // Build update object
    const updateFields: Record<string, unknown> = {
        updatedAt: new Date()
    }
    
    if (input.name !== undefined) {
        updateFields.name = input.name
    }
    
    if (input.description !== undefined) {
        updateFields.description = input.description
    }
    
    if (input.costPrice !== undefined) {
        updateFields['pricing.cost'] = input.costPrice
    }
    
    if (input.sellingPrice !== undefined) {
        updateFields['pricing.selling'] = input.sellingPrice
    }
    
    if (input.quantity !== undefined) {
        updateFields['inventory.onHand'] = input.quantity
    }
    
    if (input.images !== undefined) {
        updateFields['images.original'] = input.images
    }
    
    if (input.status !== undefined) {
        updateFields.status = input.status
    }
    
    await collection.updateOne(
        { _id: objectId },
        { $set: updateFields }
    )
    
    return await collection.findOne({ _id: objectId })
}

/**
 * Delete a product by ID
 */
export async function deleteProduct(productId: string): Promise<boolean> {
    const collection = await getProductCollection()
    const { ObjectId } = await import('mongodb')
    
    try {
        const result = await collection.deleteOne({ _id: new ObjectId(productId) })
        return result.deletedCount > 0
    } catch {
        return false
    }
}

export async function isProductOwner(productId: string, userId: string): Promise<boolean> {
    const product = await getProductById(productId)
    return product?.supplierId === userId
}

// --- Image Association Types ---

export type ImageType = 'original' | 'enhanced'
export type ImageAssociationMode = 'append' | 'replace'

export interface AssociateImagesInput {
    imageUrls: string[]
    imageType: ImageType
    mode?: ImageAssociationMode
}

// --- Image Association Functions ---

/**
 * Validate that a URL is a Firebase Storage URL
 * This is a lightweight format check - does not make network requests
 */
export function validateFirebaseStorageUrl(url: string): boolean {
    // Firebase Storage URLs typically follow these patterns:
    // - https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{path}
    // - https://storage.googleapis.com/{bucket}/{path}
    // - gs://{bucket}/{path}
    const firebasePatterns = [
        /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\/.+/,
        /^https:\/\/storage\.googleapis\.com\/[^/]+\/.+/,
        /^gs:\/\/[^/]+\/.+/
    ]
    
    return firebasePatterns.some(pattern => pattern.test(url))
}

/**
 * Associate image URLs with a product
 * @param productId - The product ID to update
 * @param input - Image association input (urls, type, mode)
 * @returns Updated product or null if not found
 */
export async function associateImages(
    productId: string,
    input: AssociateImagesInput
): Promise<WithId<Product> | null> {
    const collection = await getProductCollection()
    const { ObjectId } = await import('mongodb')
    
    let objectId: ObjectId
    try {
        objectId = new ObjectId(productId)
    } catch {
        return null
    }
    
    const { imageUrls, imageType, mode = 'append' } = input
    const fieldPath = `images.${imageType}`
    
    // Build update operation based on mode
    const updateOperation = mode === 'append'
        ? { $push: { [fieldPath]: { $each: imageUrls } }, $set: { updatedAt: new Date() } }
        : { $set: { [fieldPath]: imageUrls, updatedAt: new Date() } }
    
    const result = await collection.updateOne(
        { _id: objectId },
        updateOperation
    )
    
    if (result.matchedCount === 0) {
        return null
    }
    
    return await collection.findOne({ _id: objectId })
}
