import { createServerFn } from '@tanstack/react-start'

import type { 
    CreateProductInput, 
    UpdateProductInput
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
