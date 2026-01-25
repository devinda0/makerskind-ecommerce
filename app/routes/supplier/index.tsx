import { createFileRoute, Link } from '@tanstack/react-router'
import { getSupplierStatsFn } from '../../server/supplier'

export const Route = createFileRoute('/supplier/')({
    loader: async () => {
        return await getSupplierStatsFn()
    },
    component: SupplierDashboard,
})

function SupplierDashboard() {
    const stats = Route.useLoaderData()

    return (
        <div className="supplier-dashboard space-y-6">
            <h2 className="section-header text-2xl font-semibold text-gray-800">Dashboard Overview</h2>
            
            <div className="dashboard-grid">
                {/* Total Sales Card */}
                <div className="stat-card">
                    <div className="card-header">
                        <div>
                            <p className="stat-label">Total Revenue</p>
                            <p className="stat-value">
                                ${stats.totalSales.toFixed(2)}
                            </p>
                        </div>
                        <div className="icon-wrapper green">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Total Items Card */}
                <div className="stat-card">
                    <div className="card-header">
                        <div>
                            <p className="stat-label">Total Products</p>
                            <p className="stat-value">
                                {stats.totalItems}
                            </p>
                        </div>
                        <div className="icon-wrapper blue">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Quick Actions (Future placeholder) */}
                <div className="stat-card placeholder-card">
                    <p className="placeholder-text">More stats coming soon...</p>
                </div>
            </div>
            
            <div className="quick-links-section">
                <h3 className="section-title">Quick Links</h3>
                <div className="button-group">
                     <Link to="/supplier/products/new" className="btn btn-primary">
                        Add New Product
                     </Link>
                     
                     <Link to="/supplier/products" className="btn btn-secondary">
                        View My Products
                     </Link>
                </div>
            </div>
        </div>
    )
}
