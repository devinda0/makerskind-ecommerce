import { createFileRoute, Link } from '@tanstack/react-router'
import './Home.css'

export const Route = createFileRoute('/')({ component: HomePage })

function HomePage() {
    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="hero-content">
                    <span className="hero-badge">✨ Handcrafted with Love</span>
                    <h1 className="hero-title">
                        Discover Unique
                        <span className="hero-highlight">Artisan Treasures</span>
                    </h1>
                    <p className="hero-description">
                        Explore a curated collection of handmade goods crafted by talented 
                        makers from around the world. Each piece tells a story.
                    </p>
                    <div className="hero-actions">
                        <Link to="/products" className="hero-btn-primary">
                            Shop Collection
                        </Link>
                        <Link to="/" className="hero-btn-secondary">
                            Meet Our Makers
                        </Link>
                    </div>
                </div>
                <div className="hero-visual">
                    <div className="hero-shape"></div>
                    <div className="hero-shape-accent"></div>
                </div>
            </section>

            {/* Featured Section */}
            <section className="featured">
                <div className="featured-header">
                    <h2 className="featured-title">Featured Creations</h2>
                    <p className="featured-subtitle">
                        Handpicked treasures from our most talented artisans
                    </p>
                </div>
                <div className="featured-grid">
                    {/* Placeholder cards - will be replaced with real products */}
                    <div className="featured-card">
                        <div className="featured-card-image"></div>
                        <div className="featured-card-content">
                            <h3>Handwoven Basket</h3>
                            <p className="featured-price">$45.00</p>
                        </div>
                    </div>
                    <div className="featured-card">
                        <div className="featured-card-image"></div>
                        <div className="featured-card-content">
                            <h3>Ceramic Vase</h3>
                            <p className="featured-price">$78.00</p>
                        </div>
                    </div>
                    <div className="featured-card">
                        <div className="featured-card-image"></div>
                        <div className="featured-card-content">
                            <h3>Macramé Wall Art</h3>
                            <p className="featured-price">$62.00</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}
