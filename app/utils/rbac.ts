/**
 * RBAC (Role-Based Access Control) Utilities
 * 
 * Helper functions for validating user roles in Server Functions.
 * Reference: System Design Section 3.1
 */

import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { auth, type UserRole, type ShippingAddress } from './auth'

// Re-export types for convenience
export type { UserRole, ShippingAddress }

// User type with extended fields
export interface AuthenticatedUser {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    shippingAddress: string | null;
    emailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Session with user data
export interface AuthSession {
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
    } | null;
    user: AuthenticatedUser | null;
}

/**
 * Get current authenticated session and user
 * Returns null if not authenticated
 */
export async function getAuthSession(): Promise<AuthSession | null> {
    const request = getRequest()
    const session = await auth.api.getSession({
        headers: request.headers
    })
    return session as AuthSession | null
}

/**
 * Require authentication - throws an error if not authenticated
 */
export async function requireAuth(): Promise<AuthenticatedUser> {
    const session = await getAuthSession()
    
    if (!session?.user) {
        throw new Error('Authentication required')
    }
    
    return session.user
}

/**
 * Require specific role(s) - throws an error if user doesn't have required role
 * @param allowedRoles - Array of roles that are allowed to access
 */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
    const user = await requireAuth()
    
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
    }
    
    return user
}

/**
 * Check if user has admin role
 */
export function isAdmin(user: AuthenticatedUser | null): boolean {
    return user?.role === 'admin'
}

/**
 * Check if user has supplier role
 */
export function isSupplier(user: AuthenticatedUser | null): boolean {
    return user?.role === 'supplier'
}

/**
 * Check if user has regular user role
 */
export function isUser(user: AuthenticatedUser | null): boolean {
    return user?.role === 'user'
}

/**
 * Parse shipping address from JSON string
 */
export function parseShippingAddress(addressJson: string | null): ShippingAddress | null {
    if (!addressJson) return null
    
    try {
        return JSON.parse(addressJson) as ShippingAddress
    } catch {
        return null
    }
}

/**
 * Stringify shipping address to JSON for storage
 */
export function stringifyShippingAddress(address: ShippingAddress): string {
    return JSON.stringify(address)
}

// ============================================================================
// Pre-built Server Function Middleware Wrappers
// ============================================================================

/**
 * Server function to get current user with role info
 */
export const getCurrentUser = createServerFn({ method: "GET" })
    .handler(async () => {
        const session = await getAuthSession()
        return session?.user || null
    })

/**
 * Server function to require admin access
 * Use this as a guard before admin-only operations
 */
export const requireAdminAccess = createServerFn({ method: "GET" })
    .handler(async () => {
        return await requireRole(['admin'])
    })

/**
 * Server function to require supplier access
 * Use this as a guard before supplier-only operations
 */
export const requireSupplierAccess = createServerFn({ method: "GET" })
    .handler(async () => {
        return await requireRole(['admin', 'supplier'])
    })
