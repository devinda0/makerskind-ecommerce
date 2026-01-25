import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { getMyProductsFn } from '../../../server/product'
import { Plus, Package, Edit } from 'lucide-react'
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.number().optional(),
})

interface ProductPublicSerializable {
    _id: string
    supplierId: string
    name: string
    description: string
    pricing: {
        selling: number
    }
    inventory: {
        onHand: number
    }
    images: {
        original: string[]
        enhanced: string[]
    }
    status: 'active' | 'draft' | 'archived'
}

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
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inventory</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {(products as ProductPublicSerializable[]).map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-12 w-12 rounded-md border border-gray-200 overflow-hidden" style={{ height: '48px', width: '48px' }}>
                                                    {product.images.original[0] ? (
                                                        <img 
                                                            src={product.images.enhanced[0] || product.images.original[0]} 
                                                            alt={product.name}
                                                            className="h-full w-full object-cover"
                                                            style={{ height: '100%', width: '100%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        <div className="h-full w-full flex items-center justify-center bg-gray-100 text-gray-400">
                                                            <Package size={20} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                                    <div className="text-sm text-gray-500 truncate max-w-[200px]">{product.description}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                product.status === 'active' 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {product.inventory.onHand} units
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            ${product.pricing.selling.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button className="text-indigo-600 hover:text-indigo-900 transition-colors p-1" title="Edit">
                                                <Edit size={18} />
                                            </button>
                                        </td>
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
