import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getProductsFn } from '../server/product'
import { ProductGrid } from '../components/ProductGrid'
import { FilterBar } from '../components/FilterBar'
import { Pagination } from '../components/Pagination'
import type { ProductStatus } from '../server/product-utils'
import './Products.css'

// Search params type
interface ProductsSearch {
    page?: number
    search?: string
    status?: ProductStatus
}

// Query options factory for reuse
const productsQueryOptions = (params: ProductsSearch) => ({
    queryKey: ['products', params] as const,
    queryFn: () => getProductsFn({
        data: {
            page: params.page || 1,
            limit: 12,
            search: params.search,
            status: params.status,
        }
    }),
    staleTime: 60 * 1000, // 1 minute
})

export const Route = createFileRoute('/products')({
    validateSearch: (search): ProductsSearch => ({
        page: typeof search.page === 'number' ? search.page : undefined,
        search: typeof search.search === 'string' ? search.search : undefined,
        status: ['active', 'draft', 'archived'].includes(search.status as string)
            ? (search.status as ProductStatus)
            : undefined,
    }),
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context, deps }) => {
        const queryClient = context.queryClient
        // Prefetch on the server for SSR
        await queryClient.ensureQueryData(productsQueryOptions(deps.search))
    },
    component: ProductsPage,
    head: () => ({
        meta: [
            {
                title: 'Products | Makerskind',
            },
            {
                name: 'description',
                content: 'Browse our curated collection of handcrafted items from talented artisans around the world.',
            },
        ],
    }),
})

function ProductsPage() {
    const search = Route.useSearch()
    
    const { data } = useSuspenseQuery(productsQueryOptions(search))

    return (
        <div className="products-page">
            <header className="products-header">
                <h1 className="products-title">Our Collection</h1>
                <p className="products-subtitle">
                    Handpicked treasures from talented artisans around the world
                </p>
            </header>

            <FilterBar
                currentSearch={search.search}
                currentStatus={search.status || ''}
            />

            <div className="products-meta">
                <span className="products-count">
                    {data.total} {data.total === 1 ? 'product' : 'products'} found
                </span>
            </div>

            <ProductGrid products={data.products} />

            <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
                search={search.search}
                status={search.status}
            />
        </div>
    )
}
