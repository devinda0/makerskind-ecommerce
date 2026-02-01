import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { getSupplierOrderByIdFn, updateSupplierOrderStatusFn } from '../../../server/order'
import { z } from 'zod'
import { ChevronLeft, Package, Truck, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import type { OrderStatus } from '../../../server/order-utils'

const orderIdSchema = z.object({
    orderId: z.string(),
})

export const Route = createFileRoute('/supplier/orders/$orderId')({
    loader: async ({ params }) => {
        return await getSupplierOrderByIdFn({ data: { orderId: params.orderId } })
    },
    component: SupplierOrderDetailsPage,
})

function SupplierOrderDetailsPage() {
    const { order } = Route.useLoaderData()
    const router = useRouter()

    const updateStatusMutation = useMutation({
        mutationFn: async (status: OrderStatus) => {
            return await updateSupplierOrderStatusFn({ data: { orderId: order._id, status } })
        },
        onSuccess: () => {
            router.invalidate()
        },
        onError: (error) => {
            console.error('Failed to update status:', error)
            alert('Failed to update status. Please try again.')
        }
    })

    const getStatusActions = () => {
        switch (order.status) {
            case 'pending':
                return (
                    <div className="flex gap-2">
                        <button 
                            className="btn btn-primary bg-blue-600 hover:bg-blue-700 hover:text-white"
                            onClick={() => updateStatusMutation.mutate('processing')}
                            disabled={updateStatusMutation.isPending}
                        >
                            Mark as Processing
                        </button>
                    </div>
                )
            case 'processing':
                return (
                    <div className="flex gap-2">
                        <button 
                            className="btn btn-primary bg-indigo-600 hover:bg-indigo-700 hover:text-white"
                            onClick={() => updateStatusMutation.mutate('shipped')}
                             disabled={updateStatusMutation.isPending}
                        >
                            Mark as Shipped
                        </button>
                    </div>
                )
            case 'shipped':
                 return (
                    <div className="flex gap-2">
                         <button 
                            className="btn btn-primary bg-green-600 hover:bg-green-700 hover:text-white"
                            onClick={() => updateStatusMutation.mutate('delivered')}
                             disabled={updateStatusMutation.isPending}
                        >
                            Mark as Delivered
                        </button>
                    </div>
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
             <header className="supplier-header">
                <Link to="/supplier/orders" className="text-sm text-gray-500 hover:text-gray-900 flex items-center mb-2">
                    <ChevronLeft size={16} className="mr-1" /> Back to Orders
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="supplier-title">Order #{order._id.slice(-6).toUpperCase()}</h1>
                        <p className="supplier-subtitle">
                            Placed on {new Date(order.createdAt).toLocaleDateString()}
                        </p>
                    </div>
                    <StatusBadge status={order.status} size="lg" />
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Items Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Items to Fulfill</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 text-sm text-gray-500">
                                        <th className="pb-3 font-medium">Product</th>
                                        <th className="pb-3 font-medium text-right">Cost Price</th>
                                        <th className="pb-3 font-medium text-right">Quantity</th>
                                        <th className="pb-3 font-medium text-right">Total Cost</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td className="py-4">
                                                <span className="font-medium text-gray-900">{item.productName}</span>
                                                <div className="text-xs text-gray-400 font-mono mt-1">{item.productId}</div>
                                            </td>
                                            <td className="py-4 text-right font-mono text-gray-600">
                                                ${(item.costPrice || 0).toFixed(2)}
                                            </td>
                                            <td className="py-4 text-right text-gray-900">
                                                {item.quantity}
                                            </td>
                                            <td className="py-4 text-right font-medium text-gray-900 font-mono">
                                                ${((item.costPrice || 0) * item.quantity).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t border-gray-100">
                                        <td colSpan={3} className="pt-4 text-right font-semibold text-gray-900">Total Payout:</td>
                                        <td className="pt-4 text-right font-bold text-gray-900 text-lg font-mono">
                                            ${order.totals.total.toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* Timeline / Status Actions */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h2>
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Current Status</p>
                                <p className="text-sm text-gray-500 capitalize">{order.status}</p>
                            </div>
                            {getStatusActions()}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Shipping Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                         <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h2>
                         <div className="text-sm text-gray-600 space-y-1">
                             <p className="font-medium text-gray-900">Customer</p>
                             <p>{order.shippingAddress.street}</p>
                             <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                             <p>{order.shippingAddress.country}</p>
                         </div>
                    </div>

                    {/* Help Card */}
                    <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-100">
                        <h3 className="text-indigo-900 font-semibold mb-2">Need Help?</h3>
                        <p className="text-sm text-indigo-700 mb-4">
                            If you have issues fulfilling this order, please contact admin support immediately.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatusBadge({ status, size = 'md' }: { status: string, size?: 'md' | 'lg' }) {
    const styles = {
        pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        processing: 'bg-blue-100 text-blue-800 border-blue-200',
        shipped: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        delivered: 'bg-green-100 text-green-800 border-green-200',
        cancelled: 'bg-red-100 text-red-800 border-red-200',
    }

    const icons = {
        pending: Clock,
        processing: Package,
        shipped: Truck,
        delivered: CheckCircle,
        cancelled: XCircle
    }

    const Icon = icons[status as keyof typeof icons] || Clock
    const style = styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
    const padding = size === 'lg' ? 'px-4 py-2 text-base' : 'px-2.5 py-0.5 text-xs'

    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${style} ${padding}`}>
            <Icon size={size === 'lg' ? 18 : 14} />
            <span className="capitalize">{status}</span>
        </span>
    )
}
