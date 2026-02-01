import { createFileRoute, Outlet, redirect, Link, useLocation } from '@tanstack/react-router'
import { requireSupplierAccess } from '../server/auth'
import './supplier/supplier.css'

export const Route = createFileRoute('/supplier')({
    loader: async ({ location }) => {
        try {
            await requireSupplierAccess()
        } catch (error) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            })
        }
    },
    component: SupplierLayout,
})

function SupplierLayout() {
    const location = useLocation()
    
    // Simple helper to check active route
    const isActive = (path: string) => location.pathname === path || (path !== '/supplier' && location.pathname.startsWith(path))

    return (
        <div className="supplier-layout-container">
            {/* Sidebar Navigation */}
            <aside className="supplier-sidebar">
                <div className="sidebar-header">
                    <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
                    <Link to="/supplier" className="sidebar-brand">
                        Makerskind
                    </Link>
                </div>
                
                <nav className="sidebar-nav">
                    <Link to="/supplier" className={`nav-item ${location.pathname === '/supplier' ? 'active' : ''}`}>
                        <DashboardIcon />
                        Dashboard
                    </Link>
                    
                    <Link to="/supplier/products" className={`nav-item ${isActive('/supplier/products') ? 'active' : ''}`}>
                        <CubeIcon />
                        My Products
                    </Link>
                    
                    <Link to="/supplier/orders" className={`nav-item ${isActive('/supplier/orders') ? 'active' : ''}`}>
                         <ShoppingBagIcon />
                        Orders
                    </Link>

                    <div className="mt-auto border-t border-gray-100 pt-4">
                        <Link to="/" className="nav-item">
                            <HomeIcon /> 
                            Back to Store
                        </Link>
                    </div>
                </nav>
            </aside>

            {/* Main Content */}
            <main className="supplier-main-content">
                <Outlet />
            </main>
        </div>
    )
}

// Icons
function DashboardIcon() {
    return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
}

function CubeIcon() {
    return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
}

function ShoppingBagIcon() {
     return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
}

function HomeIcon() {
    return <svg className="nav-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
}
