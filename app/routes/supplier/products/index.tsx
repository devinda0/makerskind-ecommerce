import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getMyProductsFn } from '../../../server/product'
import { updateProductStockFn } from '../../../server/supplier'
import { Plus, Package, Edit, Loader2 } from 'lucide-react'
import { z } from 'zod'
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    createColumnHelper,
} from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import type { ProductPublicSerializable } from '../../../server/product-utils'

const productSearchSchema = z.object({
  page: z.number().optional(),
})

export const Route = createFileRoute('/supplier/products/')({
    validateSearch: (search) => productSearchSchema.parse(search),
    loader: async ({ location }) => {
        // Safe casting as validateSearch ensures the shape
        const search = location.search as { page?: number }
        const page = search.page || 1
        return await getMyProductsFn({ data: { page, limit: 10 } })
    },
    component: ProductsIndex,
})

function ProductsIndex() {
    const { products, total, page, totalPages } = Route.useLoaderData()
    const navigate = useNavigate({ from: Route.fullPath })
    const queryClient = useQueryClient()

    // Mutation for updating stock
    const updateStockMutation = useMutation({
        mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
            await updateProductStockFn({ data: { productId, quantity } })
        },
        onMutate: async () => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ['products'] })

            // Snapshot the previous value
            const previousProducts = queryClient.getQueryData(['products'])

            return { previousProducts }
        },
        onError: (_err, _newTodo, context) => {
            // Rollback to previous value
            if (context?.previousProducts) {
                queryClient.setQueryData(['products'], context.previousProducts)
            }
        },
        onSuccess: () => {
            // Invalidate and refetch
            // Using navigate to refresh loader data which manages the state here
             navigate({ search: { page }, replace: true })
        },
    })

    const columnHelper = createColumnHelper<ProductPublicSerializable>()

    const columns = [
        columnHelper.accessor('name', {
            header: 'Product',
            cell: (info) => {
                const product = info.row.original
                const image = product.images.enhanced?.[0] || product.images.original?.[0]
                
                return (
                    <div className="flex items-center">
                        <div className="flex-shrink-0 h-12 w-12 rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                            {image ? (
                                <img 
                                    src={image} 
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="h-full w-full flex items-center justify-center text-gray-400">
                                    <Package size={20} />
                                </div>
                            )}
                        </div>
                        <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">{product.description}</div>
                        </div>
                    </div>
                )
            },
        }),
        columnHelper.accessor('status', {
            header: 'Status',
            cell: (info) => (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    info.getValue() === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                }`}>
                    {info.getValue().charAt(0).toUpperCase() + info.getValue().slice(1)}
                </span>
            ),
        }),
        columnHelper.accessor('inventory.onHand', {
            header: 'Inventory',
            cell: (info) => (
                <InventoryCell 
                    initialStock={info.getValue()} 
                    onUpdate={(quantity) => updateStockMutation.mutate({ productId: info.row.original._id, quantity })}
                    isPending={updateStockMutation.isPending && updateStockMutation.variables?.productId === info.row.original._id}
                />
            ),
        }),
        columnHelper.accessor('pricing.selling', {
            header: 'Price',
            cell: (info) => (
                <span className="text-sm text-gray-900 font-medium">
                    ${info.getValue().toFixed(2)}
                </span>
            ),
        }),
        columnHelper.display({
            id: 'actions',
            cell: () => (
                <div className="text-right">
                     <button className="text-indigo-600 hover:text-indigo-900 transition-colors p-1" title="Edit">
                        <Edit size={18} />
                    </button>
                </div>
            ),
        }),
    ]

    const table = useReactTable({
        data: products as ProductPublicSerializable[],
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualPagination: true,
        pageCount: totalPages,
    })

    const handlePageChange = (newPage: number) => {
        navigate({ search: { page: newPage } })
    }

    return (
        <div className="product-list-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
                    <p className="text-sm text-gray-500 mt-1">Manage your inventory ({total} items)</p>
                </div>
                <Link to="/supplier/products/new" className="btn btn-primary flex items-center gap-2">
                    <Plus size={18} />
                    Add Product
                </Link>
            </div>

            {products.length === 0 ? (
                <div className="bg-white p-12 rounded-lg shadow-sm text-center border border-gray-200">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <Package size={32} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                    <p className="text-gray-500 mb-6">Start building your inventory by adding your first product.</p>
                    <Link to="/supplier/products/new" className="btn btn-primary inline-flex items-center gap-2">
                        <Plus size={18} />
                        Add Product
                    </Link>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th key={header.id} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                            <tbody className="bg-white divide-y divide-gray-200">
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                        {row.getVisibleCells().map(cell => (
                                            <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    {totalPages > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between sm:px-6">
                            <div className="flex-1 flex justify-between sm:justify-end gap-3">
                                <button
                                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                        page === 1 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                    disabled={page === totalPages}
                                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                                        page === totalPages 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-white text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

function InventoryCell({ 
    initialStock, 
    onUpdate, 
    isPending 
}: { 
    initialStock: number
    onUpdate: (val: number) => void
    isPending: boolean
}) {
    const [stock, setStock] = useState(initialStock)
    const [isEditing, setIsEditing] = useState(false)

    useEffect(() => {
        setStock(initialStock)
    }, [initialStock])

    const handleBlur = () => {
        setIsEditing(false)
        if (stock !== initialStock) {
            onUpdate(stock)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleBlur()
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center space-x-2">
                <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Math.max(0, parseInt(e.target.value) || 0))}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    className="w-20 rounded border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1 border"
                />
                {isPending && <Loader2 className="animate-spin h-4 w-4 text-indigo-600" />}
            </div>
        )
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded -ml-2 transition-colors flex items-center group"
        >
            <span className="text-sm text-gray-500">{stock} units</span>
            <div className="ml-2 text-indigo-400 opacity-0 group-hover:opacity-100">
                <Edit size={12} />
            </div>
            {isPending && <Loader2 className="animate-spin h-4 w-4 text-indigo-600 ml-2" />}
        </div>
    )
}
