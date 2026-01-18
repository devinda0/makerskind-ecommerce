import clientPromise from './db/mongo'
import type { ObjectId, Collection, Db } from 'mongodb'

// --- Cart Types ---

export interface CartItem {
    productId: string
    quantity: number
    addedAt: Date
}

export interface Cart {
    _id?: ObjectId
    userId: string
    items: CartItem[]
    createdAt: Date
    updatedAt: Date
}

// --- Cart Collection Access ---

let _db: Db | null = null

async function getDb(): Promise<Db> {
    if (!_db) {
        const client = await clientPromise
        _db = client.db()
    }
    return _db
}

export async function getCartCollection(): Promise<Collection<Cart>> {
    const db = await getDb()
    return db.collection<Cart>('carts')
}

// --- Cart Utility Functions ---

/**
 * Get a user's cart, creating one if it doesn't exist
 */
export async function getUserCart(userId: string): Promise<Cart> {
    const collection = await getCartCollection()
    
    let cart = await collection.findOne({ userId })
    
    if (!cart) {
        const newCart: Cart = {
            userId,
            items: [],
            createdAt: new Date(),
            updatedAt: new Date()
        }
        await collection.insertOne(newCart)
        cart = await collection.findOne({ userId })
    }
    
    return cart!
}

/**
 * Add an item to a user's cart or increment quantity if it exists
 */
export async function addItemToCart(
    userId: string, 
    productId: string, 
    quantity: number = 1
): Promise<Cart> {
    const collection = await getCartCollection()
    const cart = await getUserCart(userId)
    
    const existingItemIndex = cart.items.findIndex(
        item => item.productId === productId
    )
    
    if (existingItemIndex >= 0) {
        // Update existing item quantity
        cart.items[existingItemIndex].quantity += quantity
    } else {
        // Add new item
        cart.items.push({
            productId,
            quantity,
            addedAt: new Date()
        })
    }
    
    await collection.updateOne(
        { userId },
        { 
            $set: { 
                items: cart.items,
                updatedAt: new Date()
            } 
        }
    )
    
    return (await collection.findOne({ userId }))!
}

/**
 * Update the quantity of an item in the cart
 */
export async function updateCartItemQuantity(
    userId: string,
    productId: string,
    quantity: number
): Promise<Cart> {
    const collection = await getCartCollection()
    const cart = await getUserCart(userId)
    
    const itemIndex = cart.items.findIndex(
        item => item.productId === productId
    )
    
    if (itemIndex >= 0) {
        if (quantity <= 0) {
            // Remove item if quantity is 0 or less
            cart.items.splice(itemIndex, 1)
        } else {
            cart.items[itemIndex].quantity = quantity
        }
        
        await collection.updateOne(
            { userId },
            { 
                $set: { 
                    items: cart.items,
                    updatedAt: new Date()
                } 
            }
        )
    }
    
    return (await collection.findOne({ userId }))!
}

/**
 * Remove an item from the cart
 */
export async function removeItemFromCart(
    userId: string,
    productId: string
): Promise<Cart> {
    const collection = await getCartCollection()
    const cart = await getUserCart(userId)
    
    cart.items = cart.items.filter(item => item.productId !== productId)
    
    await collection.updateOne(
        { userId },
        { 
            $set: { 
                items: cart.items,
                updatedAt: new Date()
            } 
        }
    )
    
    return (await collection.findOne({ userId }))!
}

/**
 * Clear all items from the cart
 */
export async function clearUserCart(userId: string): Promise<void> {
    const collection = await getCartCollection()
    
    await collection.updateOne(
        { userId },
        { 
            $set: { 
                items: [],
                updatedAt: new Date()
            } 
        }
    )
}

/**
 * Delete a user's cart entirely
 */
export async function deleteUserCart(userId: string): Promise<void> {
    const collection = await getCartCollection()
    await collection.deleteOne({ userId })
}

/**
 * Merge a guest user's cart into a registered user's cart
 * Called when an anonymous user links their account
 */
export async function mergeGuestCart(
    anonymousUserId: string,
    newUserId: string
): Promise<void> {
    const collection = await getCartCollection()
    
    // Get both carts
    const guestCart = await collection.findOne({ userId: anonymousUserId })
    
    if (!guestCart || guestCart.items.length === 0) {
        // No guest cart to merge
        return
    }
    
    // Get or create the new user's cart
    const newUserCart = await getUserCart(newUserId)
    
    // Merge items - combine quantities for same products
    for (const guestItem of guestCart.items) {
        const existingIndex = newUserCart.items.findIndex(
            item => item.productId === guestItem.productId
        )
        
        if (existingIndex >= 0) {
            // Add guest quantity to existing item
            newUserCart.items[existingIndex].quantity += guestItem.quantity
        } else {
            // Add new item from guest cart
            newUserCart.items.push({
                ...guestItem,
                addedAt: new Date() // Update the addedAt to merge time
            })
        }
    }
    
    // Update the new user's cart
    await collection.updateOne(
        { userId: newUserId },
        { 
            $set: { 
                items: newUserCart.items,
                updatedAt: new Date()
            } 
        }
    )
    
    // Delete the guest cart
    await deleteUserCart(anonymousUserId)
}
