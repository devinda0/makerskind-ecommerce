import { createServerFn } from '@tanstack/react-start'


import type { FinancialStats } from './admin-stats-types'

// --- Server Functions ---

/**
 * Get financial statistics (Admin only)
 * Calculates Total Revenue, Total Cost, and Total Profit
 * Joins orders with products to get cost price
 */
export const getFinancialStatsFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { calculateFinancialStats } = await import('./admin-stats.server')
        return await calculateFinancialStats()
    })
