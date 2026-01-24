import { Link } from '@tanstack/react-router'
import type { ProductPublicSerializable } from '../server/product-utils'
import './ProductCard.css'

interface ProductCardProps {
    product: ProductPublicSerializable
}

export function ProductCard({ product }: ProductCardProps) {
    // Use enhanced image if available, fallback to original
    const imageUrl = product.images.enhanced[0] || product.images.original[0]
    
    return (
        <Link 
            to="/products" 
            className="product-card"
            aria-label={`View ${product.name}`}
        >
            <div className="product-card-image">
                {imageUrl ? (
                    <img src={imageUrl} alt={product.name} loading="lazy" />
                ) : (
                    <div className="product-card-placeholder">
                        <span>No Image</span>
                    </div>
                )}
            </div>
            <div className="product-card-content">
                <h3 className="product-card-title">{product.name}</h3>
                <p className="product-card-description">{product.description}</p>
                <p className="product-card-price">
                    ${product.pricing.selling.toFixed(2)}
                </p>
            </div>
        </Link>
    )
}
