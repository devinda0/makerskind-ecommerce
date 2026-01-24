import { createServerFn } from '@tanstack/react-start'

import type { 
    CreateProductInput, 
    UpdateProductInput,
    ImageType,
    ImageAssociationMode
} from './product-utils'

// --- Input Types for Server Functions ---

interface GetProductsInput {
    page?: number
    limit?: number
    status?: 'active' | 'draft' | 'archived'
    supplierId?: string
    search?: string
}

interface GetProductByIdInput {
    productId: string
}

interface UpdateProductServerInput extends UpdateProductInput {
    productId: string
}

interface DeleteProductInput {
    productId: string
}

interface AssociateImageInput {
    productId: string
    imageUrls: string[]
    imageType: ImageType
    mode?: ImageAssociationMode
}

interface RefineImageInput {
    productId: string
    originalImageUrl: string
}

// --- Server Functions ---

/**
 * Create a new product (Supplier/Admin only)
 */
export const createProductFn = createServerFn({ method: "POST" })
    .inputValidator((data: CreateProductInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { createProduct, stripCostField, toSerializable } = await import('./product-utils')
        
        // Only suppliers and admins can create products
        const user = await requireRole(['supplier', 'admin'])
        
        const product = await createProduct(user.id, data)
        
        // Admin sees full product (serialized), others see filtered (already serializable)
        if (user.role === 'admin') {
            return { product: toSerializable(product), success: true }
        }
        
        return { product: stripCostField(product), success: true }
    })

/**
 * Get paginated list of products (Public)
 * Cost field is stripped for non-admin users
 */
export const getProductsFn = createServerFn({ method: "GET" })
    .inputValidator((data: GetProductsInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { getProductList, stripCostField, toSerializable } = await import('./product-utils')
        
        const session = await getAuthSession()
        const isAdmin = session?.user?.role === 'admin'
        
        const result = await getProductList({
            page: data.page,
            limit: data.limit,
            status: data.status,
            supplierId: data.supplierId,
            search: data.search
        })
        
        // Strip cost field for non-admin users, serialize for admin
        if (!isAdmin) {
            return {
                ...result,
                products: result.products.map(stripCostField)
            }
        }
        
        return {
            ...result,
            products: result.products.map(toSerializable)
        }
    })

/**
 * Get a single product by ID (Public)
 * Cost field is stripped for non-admin users
 */
export const getProductByIdFn = createServerFn({ method: "GET" })
    .inputValidator((data: GetProductByIdInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { getProductById, stripCostField, toSerializable } = await import('./product-utils')
        
        const product = await getProductById(data.productId)
        
        if (!product) {
            throw new Error('Product not found')
        }
        
        const session = await getAuthSession()
        const isAdmin = session?.user?.role === 'admin'
        
        // Strip cost field for non-admin users, serialize for admin
        if (!isAdmin) {
            return { product: stripCostField(product) }
        }
        
        return { product: toSerializable(product) }
    })

/**
 * Update a product (Admin can update any, Supplier can update own)
 */
export const updateProductFn = createServerFn({ method: "POST" })
    .inputValidator((data: UpdateProductServerInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { getProductById, updateProduct, isProductOwner, stripCostField, toSerializable } = await import('./product-utils')
        
        // Only suppliers and admins can update products
        const user = await requireRole(['supplier', 'admin'])
        
        const { productId, ...updateData } = data
        
        // Check if product exists
        const existingProduct = await getProductById(productId)
        if (!existingProduct) {
            throw new Error('Product not found')
        }
        
        // Check authorization: admin can update any, supplier only their own
        if (user.role !== 'admin') {
            const isOwner = await isProductOwner(productId, user.id)
            if (!isOwner) {
                throw new Error('Access denied: You can only modify your own products')
            }
        }
        
        const updatedProduct = await updateProduct(productId, updateData)
        
        if (!updatedProduct) {
            throw new Error('Failed to update product')
        }
        
        // Admin sees full product (serialized), others see filtered (already serializable)
        if (user.role === 'admin') {
            return { product: toSerializable(updatedProduct), success: true }
        }
        
        return { product: stripCostField(updatedProduct), success: true }
    })

/**
 * Delete a product (Admin can delete any, Supplier can delete own)
 */
export const deleteProductFn = createServerFn({ method: "POST" })
    .inputValidator((data: DeleteProductInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { getProductById, deleteProduct, isProductOwner } = await import('./product-utils')
        
        // Only suppliers and admins can delete products
        const user = await requireRole(['supplier', 'admin'])
        
        // Check if product exists
        const existingProduct = await getProductById(data.productId)
        if (!existingProduct) {
            throw new Error('Product not found')
        }
        
        // Check authorization: admin can delete any, supplier only their own
        if (user.role !== 'admin') {
            const isOwner = await isProductOwner(data.productId, user.id)
            if (!isOwner) {
                throw new Error('Access denied: You can only delete your own products')
            }
        }
        
        const deleted = await deleteProduct(data.productId)
        
        if (!deleted) {
            throw new Error('Failed to delete product')
        }
        
        return { success: true, message: 'Product deleted successfully' }
    })

/**
 * Get products for the current supplier (Supplier only)
 */
export const getMyProductsFn = createServerFn({ method: "GET" })
    .inputValidator((data: Omit<GetProductsInput, 'supplierId'>) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { getProductList, toSerializable } = await import('./product-utils')
        
        // Only suppliers can access their own products list
        const user = await requireRole(['supplier'])
        
        const result = await getProductList({
            page: data.page,
            limit: data.limit,
            status: data.status,
            search: data.search,
            supplierId: user.id
        })
        
        // Suppliers see serialized products (full info for their own products)
        return {
            ...result,
            products: result.products.map(toSerializable)
        }
    })

/**
 * Associate image URLs with a product (Supplier/Admin only)
 * Suppliers can only associate images to their own products
 * Admins can associate images to any product
 */
export const associateImageFn = createServerFn({ method: "POST" })
    .inputValidator((data: AssociateImageInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { 
            getProductById, 
            associateImages, 
            isProductOwner, 
            validateFirebaseStorageUrl,
            stripCostField, 
            toSerializable 
        } = await import('./product-utils')
        
        // Only suppliers and admins can associate images
        const user = await requireRole(['supplier', 'admin'])
        
        const { productId, imageUrls, imageType, mode } = data
        
        // Validate image URLs (optional - warn but don't block)
        const invalidUrls = imageUrls.filter(url => !validateFirebaseStorageUrl(url))
        if (invalidUrls.length > 0) {
            console.warn(`[associateImageFn] Non-Firebase Storage URLs detected: ${invalidUrls.join(', ')}`)
        }
        
        // Check if product exists
        const existingProduct = await getProductById(productId)
        if (!existingProduct) {
            throw new Error('Product not found')
        }
        
        // Check authorization: admin can update any, supplier only their own
        if (user.role !== 'admin') {
            const isOwner = await isProductOwner(productId, user.id)
            if (!isOwner) {
                throw new Error('Access denied: You can only modify your own products')
            }
        }
        
        const updatedProduct = await associateImages(productId, {
            imageUrls,
            imageType,
            mode
        })
        
        if (!updatedProduct) {
            throw new Error('Failed to associate images with product')
        }
        
        // Admin sees full product (serialized), others see filtered
        if (user.role === 'admin') {
            return { product: toSerializable(updatedProduct), success: true }
        }
        
        return { product: stripCostField(updatedProduct), success: true }
    })

/**
 * Refine an image using Gemini AI (Supplier/Admin only)
 * Downloads the original image, sends to Gemini for enhancement,
 * uploads the result to Firebase Storage, and updates the product record.
 * Suppliers can only refine images for their own products.
 * Admins can refine images for any product.
 */
export const refineImageFn = createServerFn({ method: "POST" })
    .inputValidator((data: RefineImageInput) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { 
            getProductById, 
            associateImages, 
            isProductOwner, 
            validateFirebaseStorageUrl,
            stripCostField, 
            toSerializable 
        } = await import('./product-utils')
        const { enhanceProductImage } = await import('./gemini/image-enhancement')
        
        // Only suppliers and admins can refine images
        const user = await requireRole(['supplier', 'admin'])
        
        const { productId, originalImageUrl } = data
        
        // Validate the image URL is a Firebase Storage URL
        if (!validateFirebaseStorageUrl(originalImageUrl)) {
            throw new Error('Invalid image URL: Must be a Firebase Storage URL')
        }
        
        // Check if product exists
        const existingProduct = await getProductById(productId)
        if (!existingProduct) {
            throw new Error('Product not found')
        }
        
        // Check authorization: admin can update any, supplier only their own
        if (user.role !== 'admin') {
            const isOwner = await isProductOwner(productId, user.id)
            if (!isOwner) {
                throw new Error('Access denied: You can only refine images for your own products')
            }
        }
        
        // Enhance the image using Gemini AI
        const enhancedImageUrl = await enhanceProductImage(productId, originalImageUrl)
        
        // Associate the enhanced image with the product
        const updatedProduct = await associateImages(productId, {
            imageUrls: [enhancedImageUrl],
            imageType: 'enhanced',
            mode: 'append'
        })
        
        if (!updatedProduct) {
            throw new Error('Failed to update product with enhanced image')
        }
        
        // Admin sees full product (serialized), others see filtered
        if (user.role === 'admin') {
            return { 
                product: toSerializable(updatedProduct), 
                enhancedImageUrl,
                success: true 
            }
        }
        
        return { 
            product: stripCostField(updatedProduct), 
            enhancedImageUrl,
            success: true 
        }
    })

