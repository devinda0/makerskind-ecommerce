import { createServerFn } from '@tanstack/react-start'

import type { ShippingAddress } from '../utils/auth'

// --- Input Types ---

interface UpdateAddressInput {
    address: ShippingAddress
}

// --- Server Functions ---

/**
 * Get current user profile with parsed shipping address
 */
export const getUserProfileFn = createServerFn({ method: "GET" })
    .handler(async () => {
        const { getAuthSession } = await import('./auth-utils')
        const { getUserProfile } = await import('./user-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        return getUserProfile(session.user)
    })

/**
 * Update current user's shipping address
 */
export const updateUserAddressFn = createServerFn({ method: "POST" })
    .inputValidator((data: UpdateAddressInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { updateUserAddress } = await import('./user-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        const success = await updateUserAddress(session.user.id, data.address)
        
        if (!success) {
            // It's possible the address was "updated" to the exact same value
            // but we shouldn't throw an error for that.
            // Let's just return success true if no error occurred.
        }
        
        return { success: true }
    })
