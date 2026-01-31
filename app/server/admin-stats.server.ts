import { requireRole } from './auth-utils'
import { getOrderCollection } from './order-utils'
import { getProductCollection } from './product-utils'
import { type FinancialStats } from './admin-stats-types'

/**
 * Core logic for financial stats calculation
 */
export async function calculateFinancialStats(): Promise<FinancialStats> {
    await requireRole(['admin'])
    
    const collection = await getOrderCollection()
    
    const result = await collection.aggregate([
        // 1. Match only valid orders (exclude cancelled)
        { 
            $match: { 
                status: { $ne: 'cancelled' } 
            } 
        },
        // 2. Unwind items to process each product sold
        { $unwind: '$items' },
        // 3. Lookup product details to get the COST price
        // Note: We are using the CURRENT cost price. If historical cost is needed, 
        // it should have been snapshot at order time.
        {
            $lookup: {
                from: 'products',
                let: { productId: { $toObjectId: '$items.productId' } },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$productId'] } } }
                ],
                as: 'productDetails'
            }
        },
        // 4. Unwind the product details (lookup returns an array)
        { $unwind: '$productDetails' },
        // 5. Calculate Revenue, Cost, and Profit for this item
        {
            $project: {
                quantity: '$items.quantity',
                unitPrice: '$items.unitPrice', // Selling price at order time
                unitCost: '$productDetails.pricing.cost', // Current cost price (Fallback)
                itemRevenue: { $multiply: ['$items.quantity', '$items.unitPrice'] },
                itemCost: { $multiply: ['$items.quantity', '$productDetails.pricing.cost'] }
            }
        },
        // 6. Group to calculate totals
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: '$itemRevenue' },
                totalCost: { $sum: '$itemCost' },
                itemCount: { $sum: 1 } // Total individual line items processed
            }
        },
        // 7. Calculate Profit
        {
            $project: {
                _id: 0,
                revenue: '$totalRevenue',
                cost: '$totalCost',
                profit: { $subtract: ['$totalRevenue', '$totalCost'] }
            }
        }
    ]).toArray() as unknown as FinancialStats[]

    // Also get total order count separately
    const totalOrders = await collection.countDocuments({ status: { $ne: 'cancelled' } })

    // Get pending reviews count
    const productCollection = await getProductCollection()
    const pendingReviewCount = await productCollection.countDocuments({ status: 'pending_review' })

    const stats = result[0] || { revenue: 0, cost: 0, profit: 0, orderCount: 0 }

    return {
        revenue: stats.revenue,
        cost: stats.cost,
        profit: stats.profit,
        orderCount: totalOrders,
        pendingReviewCount
    }
}
