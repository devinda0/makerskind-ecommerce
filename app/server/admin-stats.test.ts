import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { calculateFinancialStats } from './admin-stats.server.ts'

// Mock dependencies
vi.mock('./auth-utils', () => ({
    requireRole: vi.fn(),
    getAuthSession: vi.fn(), 
}))

// Mock mongo client
vi.mock('./db/mongo', () => ({
    default: Promise.resolve({
        db: () => ({
            collection: () => ({ /* mock implementation if needed */ })
        })
    })
}))

// Mock order-utils
vi.mock('./order-utils', () => ({
    getOrderCollection: vi.fn()
}))

describe('Admin Financial Stats', () => {
    let mockCollection: any
    
    beforeEach(async () => {
        mockCollection = {
            aggregate: vi.fn().mockReturnThis(),
            toArray: vi.fn(),
            countDocuments: vi.fn()
        }
        
        const { getOrderCollection } = await import('./order-utils')
        vi.mocked(getOrderCollection).mockResolvedValue(mockCollection)
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it('should calculate revenue, cost, and profit correctly', async () => {
        // Mock admin role
        const { requireRole } = await import('./auth-utils')
        vi.mocked(requireRole).mockResolvedValue({ id: 'admin1', role: 'admin' } as any)

        // Mock aggregation result
        mockCollection.toArray.mockResolvedValue([{
            revenue: 440,
            cost: 220,
            profit: 220
        }])
        
        mockCollection.countDocuments.mockResolvedValue(2)

        const result = await calculateFinancialStats()

        expect(result.revenue).toBe(440)
        expect(result.cost).toBe(220)
        expect(result.profit).toBe(220)
        expect(result.orderCount).toBe(2)
        
        // Verify aggregation pipeline structure (basic check)
        expect(mockCollection.aggregate).toHaveBeenCalled()
    })

    it('should return zeros if no orders exist', async () => {
        const { requireRole } = await import('./auth-utils')
        vi.mocked(requireRole).mockResolvedValue({ id: 'admin1', role: 'admin' } as any)
        
        // Mock empty result
        mockCollection.toArray.mockResolvedValue([])
        mockCollection.countDocuments.mockResolvedValue(0)
        
        const result = await calculateFinancialStats()
        
        expect(result.revenue).toBe(0)
        expect(result.cost).toBe(0)
        expect(result.profit).toBe(0)
        expect(result.orderCount).toBe(0)
    })
})
