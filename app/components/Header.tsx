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
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    useEffect(() => {
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

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false)
    }, [router.state.location.pathname])

    const handleSignOut = async () => {
        try {
            await signOut()
            setSession(null)
            router.navigate({ to: '/' })
        } catch (error) {
            console.error('Sign out failed:', error)
        }
    }

    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen)
    }

    return (
        <>
            <header className="header">
                <div className="brand">
                    <Link to="/">Makerskind</Link>
                </div>

                {/* Desktop Navigation */}
                <nav className="nav desktop-nav">
                    <div className="nav-item">
                        <Link to="/">Home</Link>
                    </div>
                    <div className="nav-item">
                        <Link to="/">Products</Link>
                    </div>
                </nav>

                {/* Desktop Auth Actions */}
                <div className="auth-actions desktop-auth">
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

                {/* Mobile Menu Button */}
                <button
                    className={`hamburger ${isMobileMenuOpen ? 'active' : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                    aria-expanded={isMobileMenuOpen}
                >
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                    <span className="hamburger-line"></span>
                </button>
            </header>

            {/* Mobile Menu Overlay */}
            <div
                className={`mobile-overlay ${isMobileMenuOpen ? 'active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu Drawer */}
            <div className={`mobile-menu ${isMobileMenuOpen ? 'active' : ''}`}>
                <nav className="mobile-nav">
                    <Link to="/" className="mobile-nav-item">Home</Link>
                    <Link to="/" className="mobile-nav-item">Products</Link>
                </nav>

                <div className="mobile-auth">
                    {isLoading ? (
                        <span className="header-link">Loading...</span>
                    ) : session?.user ? (
                        <div className="mobile-user-info">
                            <span className="user-name">{session.user.name || session.user.email}</span>
                            <button onClick={handleSignOut} className="sign-out-btn mobile-sign-out">
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <div className="mobile-auth-buttons">
                            <Link to="/login" className="header-button-outline mobile-auth-btn">
                                Sign In
                            </Link>
                            <Link to="/register" className="header-button mobile-auth-btn">
                                Sign Up
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}
