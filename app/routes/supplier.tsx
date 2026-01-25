import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
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
    return (
        <div className="supplier-layout">
            <header className="supplier-header">
                <h1 className="supplier-title">Supplier Portal</h1>
                <p className="supplier-subtitle">Manage your inventory and view performance</p>
            </header>
            <main>
                <Outlet />
            </main>
        </div>
    )
}
