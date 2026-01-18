import { getRequest } from '@tanstack/react-start/server'
import { auth } from './auth-config'
import type { UserRole } from "../utils/auth";

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

export interface AuthSession {
    session: {
        id: string;
        userId: string;
        expiresAt: Date;
    } | null;
    user: AuthenticatedUser | null;
}

export async function getAuthSession(): Promise<AuthSession | null> {
    const request = getRequest()
    const session = await auth.api.getSession({
        headers: request.headers
    })
    return session as AuthSession | null
}

export async function requireAuth(): Promise<AuthenticatedUser> {
    const session = await getAuthSession()
    
    if (!session?.user) {
        throw new Error('Authentication required')
    }
    
    return session.user
}

export async function requireRole(allowedRoles: UserRole[]): Promise<AuthenticatedUser> {
    const user = await requireAuth()
    
    if (!allowedRoles.includes(user.role)) {
        throw new Error(`Access denied. Required roles: ${allowedRoles.join(', ')}`)
    }
    
    return user
}
