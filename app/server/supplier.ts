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
