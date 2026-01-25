import { Link } from '@tanstack/react-router'
import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react'
import { useCartStore } from '../hooks/useCartStore'
import './CartPopup.css'
import { useEffect, useState } from 'react'

export function CartPopup() {
    const { items, isOpen, toggleCart, removeItem, updateQuantity } = useCartStore()
    const [mounted, setMounted] = useState(false)

    // Handle hydration mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)

    return (
        <>
            <div 
                className={`cart-popup-overlay ${isOpen ? 'open' : ''}`} 
                onClick={toggleCart}
                aria-hidden="true"
            />
            
            <div className={`cart-popup ${isOpen ? 'open' : ''}`} role="dialog" aria-modal="true" aria-label="Shopping Cart">
                <div className="cart-header">
                    <h2 className="cart-title">Your Cart ({items.length})</h2>
                    <button onClick={toggleCart} className="cart-close-btn" aria-label="Close cart">
                        <X size={24} />
                    </button>
                </div>

                <div className="cart-items">
                    {items.length === 0 ? (
                        <div className="cart-empty-state">
                            <ShoppingBag size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                            <p>Your cart is empty</p>
                            <button 
                                onClick={toggleCart} 
                                className="checkout-btn" 
                                style={{ marginTop: '1rem', width: 'auto', padding: '0.75rem 1.5rem' }}
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="cart-item">
                                <div className="cart-item-image">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e5e7eb', borderRadius: '8px', color: '#9ca3af', fontSize: '0.75rem' }}>
                                            No Image
                                        </div>
                                    )}
                                </div>
                                <div className="cart-item-details">
                                    <div>
                                        <h3 className="cart-item-name">{item.name}</h3>
                                        <p className="cart-item-price">${item.price.toFixed(2)}</p>
                                    </div>
                                    <div className="cart-item-controls">
                                        <div className="quantity-controls">
                                            <button 
                                                className="quantity-btn"
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                disabled={item.quantity <= 1}
                                                aria-label="Decrease quantity"
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="quantity-value">{item.quantity}</span>
                                            <button 
                                                className="quantity-btn"
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                aria-label="Increase quantity"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                        <button 
                                            onClick={() => removeItem(item.id)} 
                                            className="remove-btn"
                                            aria-label="Remove item"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="cart-footer">
                        <div className="cart-subtotal">
                            <span>Subtotal</span>
                            <span>${subtotal.toFixed(2)}</span>
                        </div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)', marginBottom: '1rem', textAlign: 'center' }}>
                            Shipping and taxes calculated at checkout
                        </p>
                        <Link 
                            to="/checkout" 
                            className="checkout-btn"
                            onClick={toggleCart}
                        >
                            Proceed to Checkout
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
