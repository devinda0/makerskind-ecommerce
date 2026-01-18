
import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import type { UserRole, ShippingAddress } from "../utils/auth";
// Re-export types
export { UserRole, ShippingAddress }

// --- Server Functions ---

// Type for authentication credentials
interface SignUpCredentials {
    name: string
    email: string
    password: string
}

interface SignInCredentials {
    email: string
    password: string
}

export const signUp = createServerFn({ method: "POST" })
    .inputValidator((data: SignUpCredentials) => data)
    .handler(async ({ data }) => {
        const request = getRequest()
        const { auth } = await import('./auth-config')
        return await auth.api.signUpEmail({
            body: data,
            headers: request.headers
        })
    })

export const signIn = createServerFn({ method: "POST" })
    .inputValidator((data: SignInCredentials) => data)
    .handler(async ({ data }) => {
        const request = getRequest()
        const { auth } = await import('./auth-config')
        return await auth.api.signInEmail({
            body: data,
            headers: request.headers
        })
    })

export const signOut = createServerFn({ method: "POST" })
    .handler(async () => {
        const request = getRequest()
        const { auth } = await import('./auth-config')
        return await auth.api.signOut({
            headers: request.headers
        })
    })

export const getSession = createServerFn({ method: "GET" })
    .handler(async () => {
        const request = getRequest()
        const { auth } = await import('./auth-config')
        return await auth.api.getSession({
            headers: request.headers
        })
    })

export const getCurrentUser = createServerFn({ method: "GET" })
    .handler(async () => {
        const { getAuthSession } = await import('./auth-utils')
        const session = await getAuthSession()
        return session?.user || null
    })

export const requireAdminAccess = createServerFn({ method: "GET" })
    .handler(async () => {
        const { requireRole } = await import('./auth-utils')
        return await requireRole(['admin'])
    })

export const requireSupplierAccess = createServerFn({ method: "GET" })
    .handler(async () => {
        const { requireRole } = await import('./auth-utils')
        return await requireRole(['admin', 'supplier'])
    })
