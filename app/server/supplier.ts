import { createServerFn } from '@tanstack/react-start'

/**
 * Get statistics for the logged-in supplier
 */
export const getSupplierStatsFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { requireRole } = await import('./auth-utils')
        const { getSupplierProductCount } = await import('./product-utils')
        const { getSupplierTotalSales } = await import('./order-utils')
        
        // Only suppliers can see their own dashboard stats
        const user = await requireRole(['supplier'])
        
        const [totalItems, totalSales] = await Promise.all([
            getSupplierProductCount(user.id),
            getSupplierTotalSales(user.id)
        ])
        
        return {
            totalItems,
            totalSales
        }
    })

/**
 * Update product stock (Supplier only)
 */
export const updateProductStockFn = createServerFn({ method: "POST" })
    .inputValidator((data: { productId: string; quantity: number }) => data)
    .handler(async ({ data }) => {
        const { requireRole } = await import('./auth-utils')
        const { isProductOwner, updateProduct } = await import('./product-utils')
        
        const user = await requireRole(['supplier'])
        const { productId, quantity } = data

        const isOwner = await isProductOwner(productId, user.id)
        if (!isOwner) {
            throw new Error('Access denied: You can only modify your own products')
        }

        const updatedProduct = await updateProduct(productId, { quantity })

        if (!updatedProduct) {
            throw new Error('Failed to update product stock')
        }

        return { success: true }
    })
