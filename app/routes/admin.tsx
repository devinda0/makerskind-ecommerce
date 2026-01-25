import { createFileRoute, Outlet, Link, redirect } from '@tanstack/react-router'
import { requireAdminAccess } from '../server/auth'
import './admin/admin.css'

export const Route = createFileRoute('/admin')({
  loader: async ({ location }) => {
    try {
      await requireAdminAccess()
    } catch (error) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      })
    }
  },
  component: AdminLayout,
})

function AdminLayout() {
  return (
    <div className="admin-layout">
        <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
                <h1 className="admin-sidebar-title">MakersKind Admin</h1>
            </div>
            <nav className="admin-nav">
                <Link 
                    to="/admin" 
                    activeProps={{ className: 'active' }}
                    className="admin-nav-link"
                >
                    Dashboard
                </Link>
                {/* Placeholders for future routes */}
                <Link 
                    to="/admin" 
                    className="admin-nav-link"
                >
                    Inventory
                </Link>
                <Link 
                    to="/admin" 
                    className="admin-nav-link"
                >
                    Orders
                </Link>
                <Link 
                    to="/admin" 
                    className="admin-nav-link"
                >
                    Statistics
                </Link>
            </nav>
            <div className="admin-user-profile">
                <span className="text-sm text-gray-400">Admin User</span>
            </div>
        </aside>

        <main className="admin-main">
            <header className="admin-header">
                <h2 className="admin-page-title">Dashboard</h2>
                <Link to="/" className="btn btn-secondary">View Site</Link>
            </header>
            <div className="admin-content">
                <Outlet />
            </div>
        </main>
    </div>
  )
}
