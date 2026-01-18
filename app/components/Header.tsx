import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getSession, signOut } from '../server/auth'

import './Header.css'

interface UserSession {
    user?: {
        id: string
        name: string
        email: string
    }
}

export default function Header() {
    const router = useRouter()
    const [session, setSession] = useState<UserSession | null>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // Fetch session on mount
        const fetchSession = async () => {
            try {
                const result = await getSession()
                setSession(result as UserSession | null)
            } catch {
                setSession(null)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSession()
    }, [])

    const handleSignOut = async () => {
        try {
            await signOut()
            setSession(null)
            router.navigate({ to: '/' })
        } catch (error) {
            console.error('Sign out failed:', error)
        }
    }

    return (
        <header className="header">
            <div className="brand">
                <Link to="/">Makerskind</Link>
            </div>

            <nav className="nav">
                <div className="nav-item">
                    <Link to="/">Home</Link>
                </div>
            </nav>

            <div className="auth-actions">
                {isLoading ? (
                    <span className="header-link">Loading...</span>
                ) : session?.user ? (
                    <div className="user-info">
                        <span className="user-name">{session.user.name || session.user.email}</span>
                        <button onClick={handleSignOut} className="sign-out-btn">
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <>
                        <Link to="/login" className="header-button-outline">
                            Sign In
                        </Link>
                        <Link to="/register" className="header-button">
                            Sign Up
                        </Link>
                    </>
                )}
            </div>
        </header>
    )
}
