import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'

// --- Cart Types ---

interface AddToCartInput {
    productId: string
    quantity?: number
}

interface UpdateCartItemInput {
    productId: string
    quantity: number
}

interface RemoveFromCartInput {
    productId: string
}

// --- Server Functions ---

/**
 * Get the current user's cart or create an anonymous session and cart
 */
export const getCart = createServerFn({ method: "GET" })
    .handler(async () => {
        const { getAuthSession } = await import('./auth-utils')
        const { getUserCart } = await import('./cart-utils')
        const { auth } = await import('./auth-config')
        const request = getRequest()
        
        let session = await getAuthSession()
        
        // If no session, sign in anonymously
        if (!session?.user) {
            const newSession = await auth.api.signInAnonymous({ headers: request.headers })
            if (newSession) {
                session = { 
                    session: newSession.session, 
                    user: { 
                        ...newSession.user,
                        role: newSession.user.role as any
                    } 
                }
            }
        }
        
        if (!session?.user) {
            throw new Error('Failed to create session')
        }
        
        const cart = await getUserCart(session.user.id)
        return {
            items: cart.items,
            userId: session.user.id,
            isAnonymous: session.user.isAnonymous ?? false
        }
    })

/**
 * Add an item to the cart
 */
export const addToCart = createServerFn({ method: "POST" })
    .inputValidator((data: AddToCartInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { addItemToCart } = await import('./cart-utils')
        const { auth } = await import('./auth-config')
        const request = getRequest()
        
        let session = await getAuthSession()
        
        // If no session, sign in anonymously
        if (!session?.user) {
            const newSession = await auth.api.signInAnonymous({ headers: request.headers })
            if (newSession) {
                session = { 
                    session: newSession.session, 
                    user: { 
                        ...newSession.user,
                        role: newSession.user.role as any
                    } 
                }
            }
        }
        
        if (!session?.user) {
            throw new Error('Failed to create session')
        }
        
        const cart = await addItemToCart(
            session.user.id, 
            data.productId, 
            data.quantity ?? 1
        )
        
        return {
            items: cart.items,
            userId: session.user.id,
            isAnonymous: session.user.isAnonymous ?? false
        }
    })

/**
 * Update the quantity of an item in the cart
 */
export const updateCartItem = createServerFn({ method: "POST" })
    .inputValidator((data: UpdateCartItemInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { updateCartItemQuantity } = await import('./cart-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        const cart = await updateCartItemQuantity(
            session.user.id,
            data.productId,
            data.quantity
        )
        
        return {
            items: cart.items,
            userId: session.user.id,
            isAnonymous: session.user.isAnonymous ?? false
        }
    })

/**
 * Remove an item from the cart
 */
export const removeFromCart = createServerFn({ method: "POST" })
    .inputValidator((data: RemoveFromCartInput) => data)
    .handler(async ({ data }) => {
        const { getAuthSession } = await import('./auth-utils')
        const { removeItemFromCart } = await import('./cart-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        const cart = await removeItemFromCart(
            session.user.id,
            data.productId
        )
        
        return {
            items: cart.items,
            userId: session.user.id,
            isAnonymous: session.user.isAnonymous ?? false
        }
    })

/**
 * Clear all items from the cart
 */
export const clearCart = createServerFn({ method: "POST" })
    .handler(async () => {
        const { getAuthSession } = await import('./auth-utils')
        const { clearUserCart } = await import('./cart-utils')
        
        const session = await getAuthSession()
        
        if (!session?.user) {
            throw new Error('Authentication required')
        }
        
        await clearUserCart(session.user.id)
        
        return {
            items: [],
            userId: session.user.id,
            isAnonymous: session.user.isAnonymous ?? false
        }
    })

/**
 * Sign in anonymously as a guest user
 */
export const signInAsGuest = createServerFn({ method: "POST" })
    .handler(async () => {
        const { auth } = await import('./auth-config')
        const request = getRequest()
        
        return await auth.api.signInAnonymous({
            headers: request.headers,
            asResponse: true
        })
    })
