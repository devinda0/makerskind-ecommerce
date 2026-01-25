import clientPromise from './db/mongo'
import type { Db, Collection } from 'mongodb'
import type { ShippingAddress } from '../utils/auth'

// --- Types ---

export interface UserProfile {
    id: string
    name: string | null
    email: string
    role: string
    image?: string | null
    shippingAddress: ShippingAddress | null
    createdAt: Date
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

export async function getUserCollection(): Promise<Collection> {
    const db = await getDb()
    return db.collection('user')
}

// --- Utility Functions ---

/**
 * Update user's shipping address
 * Stores as JSON string to match BetterAuth schema
 */
export async function updateUserAddress(
    userId: string, 
    address: ShippingAddress
): Promise<boolean> {
    const collection = await getUserCollection()
    
    // Stringify the address for storage
    const addressString = JSON.stringify(address)
    
    const result = await collection.updateOne(
        { id: userId }, // BetterAuth uses string IDs in 'id' field, not _id
        { 
            $set: { 
                shippingAddress: addressString,
                updatedAt: new Date()
            } 
        }
    )
    
    return result.modifiedCount > 0
}

/**
 * Get user profile with parsed address
 */
export async function getUserProfile(user: { id: string, shippingAddress: string | null, [key: string]: any }): Promise<UserProfile> {
    const shippingAddress = parseShippingAddress(user.shippingAddress)
    
    return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        image: user.image,
        shippingAddress,
        createdAt: user.createdAt
    }
}

/**
 * Parse shipping address from string
 */
export function parseShippingAddress(addressStr: string | null | undefined): ShippingAddress | null {
    if (!addressStr) return null
    
    try {
        return JSON.parse(addressStr) as ShippingAddress
    } catch {
        return null
    }
}
