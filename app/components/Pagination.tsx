import { Link } from '@tanstack/react-router'
import type { ProductStatus } from '../server/product-utils'

interface PaginationProps {
    currentPage: number
    totalPages: number
    search?: string
    status?: ProductStatus
}

export function Pagination({ currentPage, totalPages, search, status }: PaginationProps) {
    if (totalPages <= 1) return null

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = []
        const showEllipsis = totalPages > 7

        if (!showEllipsis) {
            return Array.from({ length: totalPages }, (_, i) => i + 1)
        }

        // Always show first page
        pages.push(1)

        if (currentPage > 3) {
            pages.push('ellipsis')
        }

        // Show pages around current
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
            if (!pages.includes(i)) {
                pages.push(i)
            }
        }

        if (currentPage < totalPages - 2) {
            pages.push('ellipsis')
        }

        // Always show last page
        if (totalPages > 1) {
            pages.push(totalPages)
        }

        return pages
    }

    const buildSearchParams = (page: number) => ({
        page: page > 1 ? page : undefined,
        search: search || undefined,
        status: status || undefined,
    })

    return (
        <nav className="pagination" aria-label="Products pagination">
            <Link
                to="/products"
                search={buildSearchParams(currentPage - 1)}
                className={`pagination-btn pagination-prev ${currentPage === 1 ? 'disabled' : ''}`}
                disabled={currentPage === 1}
            >
                ← Previous
            </Link>

            <div className="pagination-pages">
                {getPageNumbers().map((page, index) =>
                    page === 'ellipsis' ? (
                        <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                            ...
                        </span>
                    ) : (
                        <Link
                            key={page}
                            to="/products"
                            search={buildSearchParams(page)}
                            className={`pagination-page ${currentPage === page ? 'active' : ''}`}
                        >
                            {page}
                        </Link>
                    )
                )}
            </div>

            <Link
                to="/products"
                search={buildSearchParams(currentPage + 1)}
                className={`pagination-btn pagination-next ${currentPage === totalPages ? 'disabled' : ''}`}
                disabled={currentPage === totalPages}
            >
                Next →
            </Link>
        </nav>
    )
}
