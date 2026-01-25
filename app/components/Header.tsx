import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getSession, signOut } from '../server/auth'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '../hooks/useCartStore'
import { CartPopup } from './CartPopup'

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
    const { items, toggleCart } = useCartStore()
    const cartItemCount = items.reduce((acc, item) => acc + item.quantity, 0)

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
                        <Link to="/products">Products</Link>
                    </div>
                </nav>

                {/* Desktop Auth Actions */}
                <div className="auth-actions desktop-auth">
                    {/* Cart Button */}
                    <div className="cart-btn-wrapper">
                        <button 
                            className="cart-btn" 
                            onClick={toggleCart}
                            aria-label="Open cart"
                        >
                            <ShoppingBag size={20} />
                            {cartItemCount > 0 && (
                                <span className="cart-badge">{cartItemCount}</span>
                            )}
                        </button>
                    </div>

                    {isLoading ? (
                        <span className="header-link">Loading...</span>
                    ) : session?.user ? (
                        <div className="user-info">
                            <Link to="/profile" className="user-name">
                                {session.user.name || session.user.email}
                            </Link>
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
                    <Link to="/products" className="mobile-nav-item">Products</Link>
                </nav>

                <div className="mobile-auth">
                    {isLoading ? (
                        <span className="header-link">Loading...</span>
                    ) : session?.user ? (
                        <div className="mobile-user-info">
                            <Link to="/profile" className="user-name">
                                {session.user.name || session.user.email}
                            </Link>
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
            
            <CartPopup />
        </>
    )
}
