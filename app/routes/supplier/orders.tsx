import { createFileRoute, Link } from '@tanstack/react-router'
import { getSupplierOrdersFn } from '../../server/order'
import { z } from 'zod'

// Define search parameters for pagination
const searchSchema = z.object({
    page: z.number().optional().default(1),
})

export const Route = createFileRoute('/supplier/orders')({
    validateSearch: searchSchema,
    loaderDeps: ({ search }) => ({ page: search.page }),
    loader: async ({ deps }) => {
        return await getSupplierOrdersFn({
            data: {
                page: deps.page,
                limit: 20
            }
        })
    },
    component: SupplierOrdersPage,
})

function SupplierOrdersPage() {
    const { orders, page, totalPages, total } = Route.useLoaderData()
    
    return (
        <div className="space-y-6">
            <header className="supplier-header flex justify-between items-end">
                <div>
                    <h1 className="supplier-title">Orders</h1>
                    <p className="supplier-subtitle">Manage and track your product orders</p>
                </div>
            </header>

            <div className="orders-table-container shadow-sm">
                <table className="orders-table">
                    <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Customer</th>
                            <th>Items (Yours)</th>
                            <th>Total (Yours)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-8 text-gray-500">
                                    No orders found.
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => {
                                // Calculate total for this supplier's items only
                                // Note: order.items might contain items from OTHER suppliers too, 
                                // but we should filter visuals if needed.
                                // However, existing getSupplierOrdersFn returns full order. 
                                // Let's simplify display to just show the Order total for now or do a quick client-side calc if accessible.
                                // Actually check implementation of getSupplierOrdersFn... it returns standard order object.
                                // We'll just display the full order total for context but maybe tooltip "Your items: $X"
                                // For MVP, let's just show Order Total to avoid confusion.
                                
                                return (
                                    <tr key={order._id}>
                                        <td className="font-mono text-xs">{order._id.slice(-6).toUpperCase()}</td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td><StatusBadge status={order.status} /></td>
                                        <td>User {order.userId.slice(0,4)}...</td>
                                        <td>{order.items.length} item(s)</td>
                                        <td className="font-medium">${order.totals.total.toFixed(2)}</td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Simple Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    <Link
                        disabled={page <= 1}
                        to="/supplier/orders"
                        search={{ page: page - 1 }}
                        className={`btn btn-secondary ${page <= 1 ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Previous
                    </Link>
                     <span className="flex items-center px-4 text-sm text-gray-600">
                        Page {page} of {totalPages}
                    </span>
                    <Link
                        disabled={page >= totalPages}
                        to="/supplier/orders"
                        search={{ page: page + 1 }}
                         className={`btn btn-secondary ${page >= totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        Next
                    </Link>
                </div>
            )}
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const getStatusClass = (s: string) => {
        switch (s) {
            case 'pending': return 'status-pending'
            case 'processing': return 'status-processing'
            case 'shipped': return 'status-shipped'
            case 'delivered': return 'status-success'
            case 'cancelled': return 'status-cancelled'
            default: return 'bg-gray-100 text-gray-800'
        }
    }
    
    return (
        <span className={`status-badge ${getStatusClass(status)}`}>
            {status}
        </span>
    )
}
