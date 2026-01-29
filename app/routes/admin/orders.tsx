import { createFileRoute } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getOrdersFn, updateOrderStatusFn } from '../../server/order'
import { 
  Loader2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Filter,
  ShoppingCart,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  MoreHorizontal
} from 'lucide-react'
import { useRouter } from '@tanstack/react-router'

// --- Types ---
type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

type Order = {
  _id: string
  userId: string
  items: Array<{
    productId: string
    productName: string
    quantity: number
    unitPrice: number
    supplierId: string
  }>
  shippingAddress: {
    street: string
    city: string
    zip: string
    country: string
  }
  totals: {
    subtotal: number
    shipping: number
    total: number
  }
  status: OrderStatus
  createdAt: string
  updatedAt: string
}

export const Route = createFileRoute('/admin/orders')({
  component: OrdersPage,
})

function OrdersPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // --- State ---
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  
  // --- Data Fetching ---
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'orders', pagination.pageIndex, pagination.pageSize, statusFilter],
    queryFn: () => getOrdersFn({
      data: {
        page: pagination.pageIndex + 1, // API is 1-indexed
        limit: pagination.pageSize,
        status: statusFilter || undefined
      }
    }),
  })

  // --- Mutations ---
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: OrderStatus }) => {
      const result = await updateOrderStatusFn({ data: { orderId, status } })
      if (!result.success) throw new Error('Failed to update status')
      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
      router.invalidate()
    },
  })

  // --- Table Configuration ---
  const columnHelper = createColumnHelper<Order>()

  const columns = [
    columnHelper.accessor('_id', {
      header: 'Order ID',
      cell: info => (
        <span className="font-mono text-xs text-gray-500">
            #{info.getValue().substring(0, 8)}
        </span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Date',
      cell: info => (
        <div className="flex flex-col">
            <span className="text-sm text-gray-900">
                {new Date(info.getValue()).toLocaleDateString()}
            </span>
            <span className="text-xs text-gray-500">
                {new Date(info.getValue()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
        </div>
      ),
    }),
    columnHelper.accessor('items', {
      header: 'Items',
      cell: info => {
        const items = info.getValue()
        return (
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-900">
                {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            <div className="text-xs text-gray-500 line-clamp-1">
                {items.map(i => i.productName).join(', ')}
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('totals.total', {
      header: 'Total',
      cell: info => (
        <span className="font-semibold text-gray-900">
            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(info.getValue())}
        </span>
      ),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const orderId = info.row.original._id
        const currentStatus = info.getValue()
        const isUpdating = updateStatusMutation.isPending && updateStatusMutation.variables?.orderId === orderId

        const getStatusColor = (status: OrderStatus) => {
            switch(status) {
                case 'pending': return 'bg-amber-100 text-amber-700 ring-amber-600/20'
                case 'processing': return 'bg-blue-100 text-blue-700 ring-blue-600/20'
                case 'shipped': return 'bg-indigo-100 text-indigo-700 ring-indigo-600/20'
                case 'delivered': return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20'
                case 'cancelled': return 'bg-slate-100 text-slate-700 ring-slate-600/20'
            }
        }

        const getStatusIcon = (status: OrderStatus) => {
            switch(status) {
                case 'pending': return <Clock className="mr-1.5 h-3.5 w-3.5" />
                case 'processing': return <PackageCheck className="mr-1.5 h-3.5 w-3.5" />
                case 'shipped': return <Truck className="mr-1.5 h-3.5 w-3.5" />
                case 'delivered': return <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                case 'cancelled': return <XCircle className="mr-1.5 h-3.5 w-3.5" />
            }
        }

        return (
          <div className="relative inline-block text-left group/status">
             {isUpdating ? (
                <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                    <span className="text-xs text-gray-500">Updating...</span>
                </div>
             ) : (
                <div className="relative">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${getStatusColor(currentStatus)} cursor-pointer`}>
                        {getStatusIcon(currentStatus)}
                        {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
                    </span>
                    
                    {/* Simplified Status Dropdown on Hover/Focus - Ideally use a real Dropdown component */}
                    <div className="absolute left-0 z-10 mt-1 w-32 origin-top-left rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none opacity-0 invisible group-hover/status:opacity-100 group-hover/status:visible transition-all duration-100">
                        <div className="py-1">
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
                                <button
                                    key={s}
                                    onClick={() => updateStatusMutation.mutate({ orderId, status: s as OrderStatus })}
                                    className={`block w-full px-4 py-2 text-left text-xs ${s === currentStatus ? 'bg-gray-100 text-gray-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}
                                >
                                    {s.charAt(0).toUpperCase() + s.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
             )}
          </div>
        )
      }
    }),
    columnHelper.display({
      id: 'actions',
      cell: () => (
        <button className="text-gray-400 hover:text-gray-600 p-1">
            <MoreHorizontal className="h-4 w-4" />
        </button>
      )
    })
  ]

  const table = useReactTable({
    data: data?.orders || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: data?.totalPages || -1,
    state: {
      pagination,
    },
    onPaginationChange: setPagination,
  })

  // --- Render ---

  if (isError) {
    return (
      <div className="p-6">
        <div className="rounded-lg bg-red-50 p-4 border border-red-200 shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{(error as Error).message}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-6">
        <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Order Management</h1>
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                View and manage all customer orders. processing, shipping, and delivery status updates.
            </p>
        </div>
      </div>

      {/* Controls Container */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10 transition-all">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Filters */}
            <div className="flex items-center space-x-3 w-full sm:w-auto">
                <div className="relative w-full sm:w-64">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Filter className="h-3.5 w-3.5 text-gray-500" />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => {
                            setStatusFilter(e.target.value as any)
                            setPagination(p => ({ ...p, pageIndex: 0 }))
                        }}
                        className="block w-full rounded-lg border-0 py-2.5 pl-9 pr-8 text-gray-700 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-white cursor-pointer hover:bg-gray-50"
                    >
                        <option value="">All Statuses</option>
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                    </select>
                </div>
            </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)]">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin text-indigo-600 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Loading Orders</h3>
                        <p className="text-gray-500 mt-1">Fetching the latest order data...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.orders.length === 0 ? (
                <tr>
                   <td colSpan={columns.length} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <ShoppingCart className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No orders found</h3>
                        <p className="text-gray-500 mt-1 text-center">
                            We couldn't find any orders matching your criteria.
                        </p>
                        <button 
                            onClick={() => {
                                setStatusFilter('')
                            }}
                            className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Clear filters
                        </button>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map(row => (
                  <tr key={row.id} className="group hover:bg-gray-50/80 transition-all duration-150">
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-4 sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                    <button
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                        className="relative inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                        className="relative ml-3 inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Next
                    </button>
                </div>
                <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                    <div>
                        <p className="text-sm text-gray-500">
                            Showing <span className="font-semibold text-gray-900">{Math.min(data.total, (pagination.pageIndex * pagination.pageSize) + 1)}</span> to{' '}
                            <span className="font-semibold text-gray-900">{Math.min(data.total, (pagination.pageIndex + 1) * pagination.pageSize)}</span> of{' '}
                            <span className="font-semibold text-gray-900">{data.total}</span> results
                        </p>
                    </div>
                    <div>
                        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                            <button
                                onClick={() => table.previousPage()}
                                disabled={!table.getCanPreviousPage()}
                                className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                            >
                                <span className="sr-only">Previous</span>
                                <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                            </button>
                            {/* Current Page Indicator */}
                            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 focus:outline-offset-0 bg-white">
                                Page {pagination.pageIndex + 1} of {table.getPageCount()}
                            </span>
                            <button
                                onClick={() => table.nextPage()}
                                disabled={!table.getCanNextPage()}
                                className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 transition-colors"
                            >
                                <span className="sr-only">Next</span>
                                <ChevronRight className="h-5 w-5" aria-hidden="true" />
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  )
}
