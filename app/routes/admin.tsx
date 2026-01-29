import { createFileRoute, Outlet, Link, redirect } from '@tanstack/react-router'
import { requireAdminAccess } from '../server/auth'
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  LogOut,
  User,
  Settings
} from 'lucide-react'

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:flex-shrink-0">
        <div className="flex h-full flex-col">
          {/* Logo / Header */}
          <div className="flex h-16 shrink-0 items-center px-6 border-b border-slate-800">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight text-white hover:text-indigo-400 transition-colors">
              <span className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">MK</span>
              <span>MakersKind</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-6 overflow-y-auto">
            <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Platform</p>
            
            <AdminNavLink to="/admin" exact icon={<LayoutDashboard className="h-5 w-5" />}>
              Dashboard
            </AdminNavLink>
            
            <AdminNavLink to="/admin/inventory" icon={<Package className="h-5 w-5" />}>
              Inventory
            </AdminNavLink>
            
            <AdminNavLink to="/admin/orders" icon={<ShoppingCart className="h-5 w-5" />}>
              Orders
            </AdminNavLink>
            
            <AdminNavLink to="/admin" icon={<BarChart3 className="h-5 w-5" />}>
              Analytics
            </AdminNavLink>

            <div className="pt-6 mt-6 border-t border-slate-800">
              <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Settings</p>
              <AdminNavLink to="/admin" icon={<User className="h-5 w-5" />}>
                Profile
              </AdminNavLink>
              <AdminNavLink to="/admin" icon={<Settings className="h-5 w-5" />}>
                Configuration
              </AdminNavLink>
            </div>
          </nav>

          {/* User Profile / Footer */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                AD
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">Admin User</p>
                <p className="truncate text-xs text-slate-400">admin@makerskind.com</p>
              </div>
              <button className="text-slate-400 hover:text-white transition-colors">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Header */}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-gray-200 bg-white px-6 shadow-sm z-10">
          <div className="flex items-center gap-2 text-gray-500">
             <span className="text-sm font-medium text-gray-900">Admin Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
                to="/" 
                className="text-sm font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                target="_blank"
            >
                View Live Site &rarr;
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

function AdminNavLink({ 
    to, 
    children, 
    icon,
    exact = false
}: { 
    to: string
    children: React.ReactNode
    icon: React.ReactNode
    exact?: boolean
}) {
  return (
    <Link
      to={to}
      activeOptions={{ exact }}
      activeProps={{ className: 'bg-indigo-600/10 text-indigo-400 font-medium border-r-2 border-indigo-500' }}
      className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all`}
    >
      {({ isActive }) => (
        <>
            <span className={`transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white'}`}>
                {icon}
            </span>
            {children}
        </>
      )}
    </Link>
  )
}
