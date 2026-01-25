import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { getProductByIdFn } from '../../server/product'
// import { addToCart } from '../../server/cart'
// import { useServerFn } from '@tanstack/react-start'
import { useCartStore } from '../../hooks/useCartStore'
import { useState } from 'react'

// --- Types ---


// --- Query Options ---
const productQueryOptions = (productId: string) => ({
    queryKey: ['product', productId],
    queryFn: () => getProductByIdFn({ data: { productId } }),
    staleTime: 60 * 1000, 
})

export const Route = createFileRoute('/product/$productId')({
    loader: async ({ context, params }) => {
        const queryClient = context.queryClient as QueryClient
        return await queryClient.ensureQueryData(productQueryOptions(params.productId))
    },
    component: ProductDetailPage,
    head: ({ loaderData }) => {
        const product = loaderData?.product
        const title = product ? `${product.name} | Makerskind` : 'Product Details | Makerskind'
        return {
            title,
            meta: [
                { title },
                { 
                    name: 'description', 
                    content: product?.description 
                        ? product.description.slice(0, 160) 
                        : 'View product details' 
                },
                {
                    property: 'og:title',
                    content: product ? product.name : 'Product Details'
                },
                {
                    property: 'og:description',
                    content: product?.description?.slice(0, 160)
                },
                ...(product?.images.original?.[0] ? [{
                    property: 'og:image',
                    content: product.images.original[0]
                }] : [])
            ]
        }
    },
})

// --- Icons ---
import { ShoppingBag, ArrowLeft, ShieldCheck, Truck, Clock } from 'lucide-react'
import './ProductDetail.css'

function ProductDetailPage() {
    const params = Route.useParams()
    const { data } = useSuspenseQuery(productQueryOptions(params.productId))
    const product = data.product
    
    // Server Function Hook
    // const addToCartFn = useServerFn(addToCart)
    const { addItem } = useCartStore()
    
    const [isAdding, setIsAdding] = useState(false)
    const [added, setAdded] = useState(false)

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="not-found-container">
                    <h1 className="product-title">Product Not Found</h1>
                    <p className="product-description">The product you are looking for does not exist.</p>
                    <a href="/products" className="back-link">
                        <ArrowLeft size={16} /> Back to Products
                    </a>
                </div>
            </div>
        )
    }

    const handleAddToCart = async () => {
        setIsAdding(true)
        try {
            // await addToCartFn({ data: { productId: product._id } })
            // Determine main image for cart
            const cartImage = product.images.enhanced?.[0] || product.images.original?.[0]
            
            addItem({
                id: product._id,
                name: product.name,
                price: product.pricing.selling,
                image: cartImage,
            })

            setAdded(true)
            setTimeout(() => setAdded(false), 3000)
        } catch (error) {
            console.error('Failed to add to cart:', error)
            alert('Failed to add to cart')
        } finally {
            setIsAdding(false)
        }
    }

    // Determine main image
    const mainImage = product.images.enhanced?.[0] || product.images.original?.[0] || 'https://placehold.co/600x600?text=No+Image'

    return (
        <div className="product-detail-page">
            <div className="product-detail-container">
                {/* Breadcrumb */}
                <nav className="breadcrumb">
                    <a href="/">Home</a>
                    <span className="breadcrumb-separator">/</span>
                    <a href="/products">Products</a>
                    <span className="breadcrumb-separator">/</span>
                    <span className="breadcrumb-current">{product.name}</span>
                </nav>

                <div className="product-main-grid">
                    {/* Image Section */}
                    <div className="product-gallery">
                        <div className="main-image-wrapper">
                            <img 
                                src={mainImage} 
                                alt={product.name} 
                                className="main-image"
                            />
                            {product.images.enhanced?.length > 0 && (
                                <div className="ai-badge">
                                    <span className="ai-dot"></span>
                                    AI Enhanced
                                </div>
                            )}
                        </div>
                        {/* Thumbnails Placeholder (Visual only for now) */}
                        <div className="thumbnails-grid">
                            {[mainImage, mainImage, mainImage].map((img, i) => (
                                <div key={i} className={`thumbnail-wrapper ${i === 0 ? 'active' : ''}`}>
                                    <img src={img} alt="" className="thumbnail-image" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="product-info">
                        <span className="handcrafted-tag">
                            Handcrafted
                        </span>
                        <h1 className="product-title">
                            {product.name}
                        </h1>
                        <div className="price-container">
                            <span className="product-price">
                                ${product.pricing.selling.toFixed(2)}
                            </span>
                            {product.inventory.onHand <= 5 && product.inventory.onHand > 0 && (
                                <span className="stock-warning">
                                    Only {product.inventory.onHand} left
                                </span>
                            )}
                        </div>

                        <div className="product-description">
                            <p>{product.description}</p>
                        </div>

                        <div className="action-section">
                            {/* Stock Status Indicator */}
                            <div className={`stock-status ${product.inventory.onHand > 0 ? 'in-stock' : 'out-of-stock'}`}>
                                <span className="status-dot"></span>
                                <span>
                                    {product.inventory.onHand > 0 ? 'In Stock & Ready to Ship' : 'Currently Out of Stock'}
                                </span>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={isAdding || product.inventory.onHand <= 0}
                                className={`add-to-cart-btn ${added ? 'success' : 'primary'}`}
                            >
                                {isAdding ? (
                                    <span>Adding to Cart...</span>
                                ) : added ? (
                                    <>
                                        <Truck className="w-5 h-5" />
                                        Added to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingBag className="w-5 h-5" />
                                        Add to Cart
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Value Props */}
                        <div className="value-props">
                            <div className="value-prop-item">
                                <ShieldCheck className="value-prop-icon" />
                                <div className="value-prop-text">
                                    <h4>Authentic Quality</h4>
                                    <p>Verified artisanal craftsmanship</p>
                                </div>
                            </div>
                            <div className="value-prop-item">
                                <Truck className="value-prop-icon" />
                                <div className="value-prop-text">
                                    <h4>Secure Shipping</h4>
                                    <p>Tracked global delivery</p>
                                </div>
                            </div>
                            <div className="value-prop-item">
                                <Clock className="value-prop-icon" />
                                <div className="value-prop-text">
                                    <h4>Made to Last</h4>
                                    <p>Durable, sustainable materials</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Extended Details Section */}
                <div className="extended-details-section">
                    <h2 className="section-title">About This Piece</h2>
                    <div className="details-grid">
                        <div className="details-column">
                            <h3>The Craftsmanship</h3>
                            <p>Every Makerskind item is a testament to the skill and dedication of our artisan partners. Created using traditional techniques passed down through generations, this piece preserves cultural heritage while offering contemporary utility.</p>
                        </div>
                        <div className="details-column">
                            <h3>Material & Care</h3>
                            <p>We believe in sustainable luxury. This item is crafted from ethically sourced materials. To ensure its longevity, handle with care and follow standard maintenance practices for natural materials.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
