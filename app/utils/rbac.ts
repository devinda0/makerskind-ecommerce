/**
 * RBAC (Role-Based Access Control) Client Utilities
 * 
 * Helper functions for checking user roles on the client.
 */

import type { UserRole, ShippingAddress } from './auth'

export type { UserRole, ShippingAddress }

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
