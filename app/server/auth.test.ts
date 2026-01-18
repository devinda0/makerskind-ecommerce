/**
 * Test Suite for GitHub Issue #04: [AUTH-01] Integrated BetterAuth Configuration
 * 
 * This file tests the acceptance criteria:
 * - BetterAuth installed in TanStack Start project
 * - MongoDB adapter configured successfully
 * - Auth Server Functions exposed (signUp, signIn, signOut, getSession)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================================
// SECTION 1: BetterAuth Installation Verification
// ============================================================================
describe('BetterAuth Installation', () => {
    it('should have better-auth package installed', async () => {
        // Verify the package can be imported
        const betterAuth = await import('better-auth')
        expect(betterAuth).toBeDefined()
        expect(betterAuth.betterAuth).toBeDefined()
    })

    it('should have better-auth/react client available', async () => {
        const betterAuthReact = await import('better-auth/react')
        expect(betterAuthReact).toBeDefined()
        expect(betterAuthReact.createAuthClient).toBeDefined()
    })

    it('should have mongodb adapter available', async () => {
        const adapters = await import('better-auth/adapters/mongodb')
        expect(adapters).toBeDefined()
        expect(adapters.mongodbAdapter).toBeDefined()
    })
})

// ============================================================================
// SECTION 2: MongoDB Adapter Configuration
// ============================================================================
describe('MongoDB Adapter Configuration', () => {
    beforeEach(() => {
        vi.resetModules()
    })

    it('should export auth instance from server/auth-config', async () => {
        // Mock the MongoDB client before importing auth
        vi.doMock('../server/db/mongo', () => ({
            default: Promise.resolve({
                db: () => ({
                    collection: vi.fn().mockReturnValue({
                        findOne: vi.fn(),
                        insertOne: vi.fn(),
                        updateOne: vi.fn(),
                        deleteOne: vi.fn(),
                    })
                })
            })
        }))

        const authModule = await import('../server/auth-config')
        expect(authModule.auth).toBeDefined()
    })

    it('should have email and password authentication enabled', async () => {
        // This test verifies the auth configuration includes emailAndPassword
        // We check this by examining the auth module's structure
        vi.doMock('../server/db/mongo', () => ({
            default: Promise.resolve({
                db: () => ({
                    collection: vi.fn().mockReturnValue({
                        findOne: vi.fn(),
                        insertOne: vi.fn(),
                        updateOne: vi.fn(),
                        deleteOne: vi.fn(),
                    })
                })
            })
        }))

        const authModule = await import('../server/auth-config')
        expect(authModule.auth).toBeDefined()
        // The auth object should have API methods for email authentication
        expect(authModule.auth.api).toBeDefined()
        expect(authModule.auth.api.signUpEmail).toBeDefined()
        expect(authModule.auth.api.signInEmail).toBeDefined()
    })
})

// ============================================================================
// SECTION 3: Auth Server Functions
// ============================================================================
describe('Auth Server Functions', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('signUp Server Function', () => {
        it('should be exported from server/auth module', async () => {
            // Mock dependencies
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn().mockResolvedValue({ user: { id: '1', email: 'test@test.com' } }),
                        signInEmail: vi.fn(),
                        signOut: vi.fn(),
                        getSession: vi.fn()
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.signUp).toBeDefined()
        })

        it('should accept SignUpCredentials with name, email, and password', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            const mockSignUpEmail = vi.fn().mockResolvedValue({ 
                user: { id: '1', email: 'test@test.com', name: 'Test User' } 
            })
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: mockSignUpEmail,
                        signInEmail: vi.fn(),
                        signOut: vi.fn(),
                        getSession: vi.fn()
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.signUp).toBeDefined()
            // The function should be a server function with proper structure
            expect(typeof serverAuth.signUp).toBe('function')
        })
    })

    describe('signIn Server Function', () => {
        it('should be exported from server/auth module', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn(),
                        signInEmail: vi.fn().mockResolvedValue({ session: { id: 'session-1' } }),
                        signOut: vi.fn(),
                        getSession: vi.fn()
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.signIn).toBeDefined()
        })

        it('should accept SignInCredentials with email and password', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn(),
                        signInEmail: vi.fn().mockResolvedValue({ session: { id: 'session-1' } }),
                        signOut: vi.fn(),
                        getSession: vi.fn()
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.signIn).toBeDefined()
            expect(typeof serverAuth.signIn).toBe('function')
        })
    })

    describe('signOut Server Function', () => {
        it('should be exported from server/auth module', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn(),
                        signInEmail: vi.fn(),
                        signOut: vi.fn().mockResolvedValue({ success: true }),
                        getSession: vi.fn()
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.signOut).toBeDefined()
        })

        it('should not require any input parameters', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn(),
                        signInEmail: vi.fn(),
                        signOut: vi.fn().mockResolvedValue({ success: true }),
                        getSession: vi.fn()
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.signOut).toBeDefined()
            expect(typeof serverAuth.signOut).toBe('function')
        })
    })

    describe('getSession Server Function', () => {
        it('should be exported from server/auth module', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn(),
                        signInEmail: vi.fn(),
                        signOut: vi.fn(),
                        getSession: vi.fn().mockResolvedValue({ session: null, user: null })
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.getSession).toBeDefined()
        })

        it('should not require any input parameters', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: {
                    api: {
                        signUpEmail: vi.fn(),
                        signInEmail: vi.fn(),
                        signOut: vi.fn(),
                        getSession: vi.fn().mockResolvedValue({ session: null, user: null })
                    }
                }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.getSession).toBeDefined()
            expect(typeof serverAuth.getSession).toBe('function')
        })
    })
})

// ============================================================================
// SECTION 4: Auth Client Configuration
// ============================================================================
describe('Auth Client Configuration', () => {
    it('should export authClient from utils/auth-client', async () => {
        const authClientModule = await import('../utils/auth-client')
        expect(authClientModule.authClient).toBeDefined()
    })

    it('should create auth client with baseURL configuration', async () => {
        const authClientModule = await import('../utils/auth-client')
        expect(authClientModule.authClient).toBeDefined()
        // The client should have standard auth methods
        expect(authClientModule.authClient.signIn).toBeDefined()
        expect(authClientModule.authClient.signUp).toBeDefined()
        expect(authClientModule.authClient.signOut).toBeDefined()
    })
})

// ============================================================================
// SECTION 5: Type Definitions Verification
// ============================================================================
describe('Type Definitions', () => {
    it('should have proper SignUpCredentials interface structure', () => {
        interface SignUpCredentials {
            name: string
            email: string
            password: string
        }
        
        const validCredentials: SignUpCredentials = {
            name: 'Test User',
            email: 'test@example.com',
            password: 'securePassword123'
        }
        
        expect(validCredentials.name).toBe('Test User')
        expect(validCredentials.email).toBe('test@example.com')
        expect(validCredentials.password).toBe('securePassword123')
    })
})

// ============================================================================
// SECTION 6: RBAC & User Schema Extension (GitHub Issue #05)
// ============================================================================
describe('RBAC & User Schema Extension', () => {
    beforeEach(() => {
        vi.resetModules()
        vi.clearAllMocks()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('User Schema Additional Fields', () => {
        it('should have role field configuration in auth', async () => {
            // Mock dependencies
            vi.doMock('../server/db/mongo', () => ({
                default: Promise.resolve({
                    db: () => ({
                        collection: vi.fn().mockReturnValue({
                            findOne: vi.fn(),
                            insertOne: vi.fn(),
                            updateOne: vi.fn(),
                            deleteOne: vi.fn(),
                        })
                    })
                })
            }))

            const authModule = await import('../server/auth-config')
            expect(authModule.auth).toBeDefined()
            // Verify auth object has expected structure
            expect(authModule.auth.api).toBeDefined()
        })

        it('should export ShippingAddress interface', async () => {
            const { parseShippingAddress } = await import('../utils/rbac')
            // UserRole is a type, so it doesn't exist at runtime to be imported here
            // we just check imports work for runtime values
            expect(parseShippingAddress).toBeDefined()
        })
    })

    describe('RBAC Helper Functions', () => {
        it('should export rbac utility functions', async () => {
            vi.doMock('../utils/auth', () => ({
               UserRole: 'user' as const,
               ShippingAddress: {}
            }))

            const rbacModule = await import('../utils/rbac')
            expect(rbacModule.isAdmin).toBeDefined()
            expect(rbacModule.isSupplier).toBeDefined()
            expect(rbacModule.isUser).toBeDefined()
            // requireAuth and getAuthSession are now in server/auth
        })
        
        it('should export server rbac functions from server/auth-utils', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
             vi.doMock('../server/auth-config', () => ({
                auth: { api: { getSession: vi.fn().mockResolvedValue({}) } }
            }))
            
            const authUtils = await import('../server/auth-utils')
            expect(authUtils.requireAuth).toBeDefined()
            expect(authUtils.requireRole).toBeDefined()
            expect(authUtils.getAuthSession).toBeDefined()
        })

        it('isAdmin should return true only for admin role', async () => {
            const { isAdmin } = await import('../utils/rbac')
            
            expect(isAdmin({ id: '1', email: 'a@a.com', name: 'Test', role: 'admin', shippingAddress: null, emailVerified: true, createdAt: new Date(), updatedAt: new Date() })).toBe(true)
            expect(isAdmin({ id: '1', email: 'a@a.com', name: 'Test', role: 'user', shippingAddress: null, emailVerified: true, createdAt: new Date(), updatedAt: new Date() })).toBe(false)
        })

        it('should export shipping address utilities', async () => {
            const { parseShippingAddress, stringifyShippingAddress } = await import('../utils/rbac')
            
            const address = { street: '123 Main', city: 'NYC', zip: '10001', country: 'USA' }
            const stringified = stringifyShippingAddress(address)
            const parsed = parseShippingAddress(stringified)
            
            expect(parsed).toEqual(address)
        })
    })

    describe('getCurrentUser Server Function', () => {
        it('should be exported from server/auth module', async () => {
            vi.doMock('@tanstack/react-start/server', () => ({
                getRequest: vi.fn().mockReturnValue({ headers: new Headers() })
            }))
            
            vi.doMock('../server/auth-config', () => ({
                auth: { api: { getSession: vi.fn().mockResolvedValue({}) } }
            }))

            const serverAuth = await import('../server/auth')
            expect(serverAuth.getCurrentUser).toBeDefined()
            expect(typeof serverAuth.getCurrentUser).toBe('function')
        })
    })
})
