import { describe, it, expect, vi, beforeEach } from 'vitest'
import { updateUserAddress, getUserProfile } from './user-utils'
import { getUserProfileFn, updateUserAddressFn } from './user'

// Mock dependencies
const { mockCollection } = vi.hoisted(() => {
    return {
        mockCollection: {
            updateOne: vi.fn()
        }
    }
})

vi.mock('./db/mongo', () => {
    const mockDb = {
        collection: vi.fn().mockReturnValue(mockCollection)
    }
    
    const mockClient = {
        db: () => mockDb
    }
    return {
        default: Promise.resolve(mockClient)
    }
})

describe('User Utilities', () => {
    const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        shippingAddress: null,
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
    }

    const mockAddress = {
        street: '123 Test St',
        city: 'Test City',
        zip: '12345',
        country: 'Test Country'
    }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('getUserProfile', () => {
        it('should return user profile with null address if none set', async () => {
            const result = await getUserProfile(mockUser)
            
            expect(result.id).toBe(mockUser.id)
            expect(result.shippingAddress).toBeNull()
        })

        it('should return user profile with parsed address', async () => {
            const userWithAddress = {
                ...mockUser,
                shippingAddress: JSON.stringify(mockAddress)
            }

            const result = await getUserProfile(userWithAddress)
            
            expect(result.shippingAddress).toEqual(mockAddress)
        })
    })

    describe('updateUserAddress', () => {
        it('should update address successfully', async () => {
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 })

            const result = await updateUserAddress('user-123', mockAddress)
            
            expect(result).toBe(true)
            expect(mockCollection.updateOne).toHaveBeenCalledWith(
                { id: 'user-123' },
                { 
                    $set: { 
                        shippingAddress: JSON.stringify(mockAddress),
                        updatedAt: expect.any(Date)
                    } 
                }
            )
        })

        it('should return false if no documents modified', async () => {
             // This might happen if the address is the same
            mockCollection.updateOne.mockResolvedValue({ modifiedCount: 0 })

            const result = await updateUserAddress('user-123', mockAddress)
            
            expect(result).toBe(false)
        })
    })
})

describe('User Server Functions (Smoke Test)', () => {
    it('should export server functions', () => {
        expect(getUserProfileFn).toBeDefined()
        expect(updateUserAddressFn).toBeDefined()
    })
})
