import { createFileRoute } from '@tanstack/react-router'
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { getProductsFn, updateProductFn } from '../../server/product'
import { 
  Loader2, 
  Search, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight,
  Package,
  Eye,
  Edit,
  Trash2,
  Lock,
  Filter,
  Check,
  X
} from 'lucide-react'
import { Link } from '@tanstack/react-router'

// --- Types ---
type Product = {
  _id: string
  name: string
  description: string
  supplierId: string
  pricing: {
    cost?: number
    selling: number
  }
  inventory: {
    onHand: number
  }
  images: {
    original: string[]
    enhanced: string[]
  }
  status: 'active' | 'draft' | 'archived' | 'pending_review' | 'rejected'
  createdAt: string
  updatedAt: string
}

type InventorySearch = {
  status?: Product['status']
}

export const Route = createFileRoute('/admin/inventory')({
  component: InventoryPage,
  validateSearch: (search: Record<string, unknown>): InventorySearch => {
    const validStatuses = ['active', 'draft', 'pending_review', 'rejected', 'archived']
    return {
      status: validStatuses.includes(search.status as string)
        ? (search.status as Product['status'])
        : undefined,
    }
  },
})

function InventoryPage() {
  const search = Route.useSearch()
  
  // --- State ---
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  })
  const [globalFilter, setGlobalFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'active' | 'draft' | 'archived' | 'pending_review' | 'rejected' | ''>(search.status || '')
  
  // Debounce search (simplified for this implementation, ideally use a hook)
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Handle Search Input Change with Debounce
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGlobalFilter(e.target.value)
    // Simple debounce logic
    setTimeout(() => {
      setDebouncedSearch(e.target.value)
    }, 500)
  }

  // --- Data Fetching ---
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin', 'products', pagination.pageIndex, pagination.pageSize, statusFilter, debouncedSearch],
    queryFn: () => getProductsFn({
      data: {
        page: pagination.pageIndex + 1, // API is 1-indexed
        limit: pagination.pageSize,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined
      }
    }),
  })

  // --- Mutations ---
  const queryClient = useQueryClient()
  const updateStatusMutation = useMutation({
    mutationFn: async ({ productId, status }: { productId: string, status: 'active' | 'rejected' }) => {
        await updateProductFn({ data: { productId, status } })
    },
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    }
  })

  // --- Table Configuration ---
  const columnHelper = createColumnHelper<Product>()

  const columns = [
    columnHelper.accessor('images', {
      header: 'Product',
      cell: info => {
        const images = info.getValue()
        const thumbnail = images.enhanced[0] || images.original[0]
        return (
          <div className="flex items-center space-x-4 group">
            <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
                {thumbnail ? (
                <img 
                    src={thumbnail} 
                    alt="Product" 
                    className="h-full w-full object-cover" 
                    loading="lazy"
                />
                ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                    <Package className="h-5 w-5" />
                </div>
                )}
            </div>
          </div>
        )
      },
    }),
    columnHelper.accessor('name', {
      header: 'Details',
      cell: info => (
        <div className="flex flex-col">
            <span className="font-semibold text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                {info.getValue()}
            </span>
            <span className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                {info.row.original.description}
            </span>
        </div>
      ),
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: info => {
            const status = info.getValue();
            const styles = {
                active: 'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
                draft: 'bg-amber-100 text-amber-700 ring-amber-600/20',
                archived: 'bg-slate-100 text-slate-700 ring-slate-600/20',
                pending_review: 'bg-blue-100 text-blue-700 ring-blue-600/20',
                rejected: 'bg-red-100 text-red-700 ring-red-600/20',
            }
            // @ts-ignore
            const style = styles[status] || styles.draft
            return (
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${style}`}>
                    <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status === 'active' ? 'bg-emerald-500' : status === 'pending_review' ? 'bg-blue-500' : 'bg-slate-500'}`}></span>
                    {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </span>
            )
        }
    }),
    columnHelper.accessor('inventory.onHand', {
      header: 'Inventory',
      cell: info => (
        <span className={`font-medium ${info.getValue() < 10 ? 'text-amber-600' : 'text-gray-700'}`}>
            {info.getValue()} units
        </span>
      ),
    }),
    columnHelper.accessor('pricing.cost', {
      header: () => (
          <div className="flex items-center space-x-1">
              <Lock className="h-3 w-3 text-gray-400" />
              <span>Cost</span>
          </div>
      ),
      cell: info => {
        const value = info.getValue()
        return (
          <span className="inline-flex items-center font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
            {value !== undefined ? formatCurrency(value) : '-'}
          </span>
        )
      },
    }),
    columnHelper.accessor('pricing.selling', {
      header: 'Price',
      cell: info => <span className="font-semibold text-gray-900">{formatCurrency(info.getValue())}</span>,
    }),
    columnHelper.accessor('supplierId', {
        header: 'Supplier',
        cell: info => (
            <div className="flex items-center space-x-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium ring-1 ring-inset ring-indigo-700/10">
                    {info.getValue().substring(0, 1).toUpperCase()}
                </span>
                <span className="text-xs text-gray-500 font-mono" title={info.getValue()}>
                    {info.getValue().substring(0, 6)}...
                </span>
            </div>
        )
    }),
    // Actions Column
    columnHelper.display({
      id: 'actions',
      header: '',
      cell: info => {
        const product = info.row.original
        return (
            <div className="flex justify-end items-center gap-2">
                {product.status === 'pending_review' && (
                    <div className="flex items-center gap-1 mr-2">
                        <button
                            onClick={() => updateStatusMutation.mutate({ productId: product._id, status: 'active' })}
                            className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 p-1.5 rounded-md transition-colors"
                            title="Approve"
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={() => updateStatusMutation.mutate({ productId: product._id, status: 'rejected' })}
                            className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 p-1.5 rounded-md transition-colors"
                            title="Reject"
                            disabled={updateStatusMutation.isPending}
                        >
                            {updateStatusMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        </button>
                    </div>
                )}
                
                <div className={`flex space-x-3 transition-opacity duration-200 ${product.status === 'pending_review' ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors p-1 hover:bg-indigo-50 rounded" title="View Details">
                        <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-slate-400 hover:text-amber-600 transition-colors p-1 hover:bg-amber-50 rounded" title="Edit">
                        <Edit className="h-4 w-4" />
                    </button>
                    <button className="text-slate-400 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded" title="Delete">
                        <Trash2 className="h-4 w-4" />
                    </button>
                </div>
            </div>
        )
      }
    })
  ]

  const table = useReactTable({
    data: data?.products || [],
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
              <h3 className="text-sm font-medium text-red-800">Error loading inventory</h3>
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
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Master Inventory</h1>
            <p className="mt-2 text-sm text-gray-500 max-w-2xl">
                Comprehensive overview of all platform products. Monitor stock levels, track costs, and manage supplier inventory from a centralized dashboard.
            </p>
        </div>
        <div className="flex-shrink-0">
            <Link 
                to="/admin" 
                className="inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-5 py-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
                <Package className="mr-2 h-4 w-4" />
                Add New Product
            </Link>
        </div>
      </div>

      {/* Controls Container */}
      <div className="bg-white/80 backdrop-blur-sm p-4 rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10 transition-all">
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name, description..."
                    value={globalFilter}
                    onChange={handleSearchChange}
                    className="block w-full rounded-lg border-0 py-2.5 pl-10 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 bg-gray-50 focus:bg-white transition-all"
                />
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
                <div className="relative">
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
                        <option value="active">Active</option>
                        <option value="draft">Draft</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="rejected">Rejected</option>
                        <option value="archived">Archived</option>
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
                        <h3 className="text-lg font-medium text-gray-900">Loading Inventory</h3>
                        <p className="text-gray-500 mt-1">Fetching the latest product data...</p>
                    </div>
                  </td>
                </tr>
              ) : data?.products.length === 0 ? (
                <tr>
                   <td colSpan={columns.length} className="px-6 py-24 text-center">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                            <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No products found</h3>
                        <p className="text-gray-500 mt-1 text-center">
                            We couldn't find any products matching your search criteria. Try adjusting your filters or search term.
                        </p>
                        <button 
                            onClick={() => {
                                setGlobalFilter('')
                                setDebouncedSearch('')
                                setStatusFilter('')
                            }}
                            className="mt-6 text-sm font-medium text-indigo-600 hover:text-indigo-500"
                        >
                            Clear all filters
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}
