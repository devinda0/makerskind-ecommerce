import { ProductCard } from './ProductCard'
import type { ProductPublicSerializable } from '../server/product-utils'

interface ProductGridProps {
    products: ProductPublicSerializable[]
    isLoading?: boolean
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
    if (isLoading) {
        return (
            <div className="product-grid">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="product-card-skeleton">
                        <div className="skeleton-image" />
                        <div className="skeleton-content">
                            <div className="skeleton-title" />
                            <div className="skeleton-description" />
                            <div className="skeleton-price" />
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (products.length === 0) {
        return (
            <div className="products-empty">
                <div className="products-empty-icon">🎨</div>
                <h3>No products found</h3>
                <p>Try adjusting your filters or check back later for new artisan creations.</p>
            </div>
        )
    }

    return (
        <div className="product-grid">
            {products.map((product) => (
                <ProductCard key={product._id} product={product} />
            ))}
        </div>
    )
}
