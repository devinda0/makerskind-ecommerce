import { Link } from '@tanstack/react-router'
import './Footer.css'

export default function Footer() {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-brand">
                    <h3 className="footer-logo">Makerskind</h3>
                    <p className="footer-tagline">
                        Handcrafted with love. Unique artisan creations 
                        from talented makers around the world.
                    </p>
                </div>

                <div className="footer-links">
                    <div className="footer-section">
                        <h4>Shop</h4>
                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/">Products</Link></li>
                        </ul>
                    </div>

                    <div className="footer-section">
                        <h4>Support</h4>
                        <ul>
                            <li><Link to="/">Terms & Conditions</Link></li>
                            <li><Link to="/">Refund Policy</Link></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="footer-bottom">
                <p>&copy; {currentYear} Makerskind. All rights reserved.</p>
            </div>
        </footer>
    )
}
