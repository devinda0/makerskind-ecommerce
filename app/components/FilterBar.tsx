import { useNavigate } from '@tanstack/react-router'
import { useState, useEffect, useCallback } from 'react'
import type { ProductStatus } from '../server/product-utils'

interface FilterBarProps {
    currentSearch?: string
    currentStatus?: ProductStatus | ''
}

export function FilterBar({ currentSearch = '', currentStatus = '' }: FilterBarProps) {
    const navigate = useNavigate()
    const [search, setSearch] = useState(currentSearch)

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== currentSearch) {
                updateFilters({ search: search || undefined })
            }
        }, 300)
        return () => clearTimeout(timer)
    }, [search, currentSearch])

    const updateFilters = useCallback((updates: { search?: string; status?: ProductStatus | '' }) => {
        navigate({
            to: '/products',
            search: (prev) => ({
                ...prev,
                search: updates.search !== undefined ? updates.search : prev.search,
                status: updates.status !== undefined 
                    ? (updates.status as ProductStatus | undefined) 
                    : prev.status,
                page: 1, // Reset to page 1 when filters change
            }),
            replace: true,
        })
    }, [navigate])

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as ProductStatus | ''
        updateFilters({ status: value || undefined })
    }

    const clearFilters = () => {
        setSearch('')
        navigate({
            to: '/products',
            search: {},
            replace: true,
        })
    }

    const hasFilters = currentSearch || currentStatus

    return (
        <div className="filter-bar">
            <div className="filter-bar-inputs">
                <div className="filter-search">
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="filter-search-input"
                    />
                    <span className="filter-search-icon">🔍</span>
                </div>
                <select
                    value={currentStatus}
                    onChange={handleStatusChange}
                    className="filter-select"
                >
                    <option value="">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                </select>
            </div>
            {hasFilters && (
                <button onClick={clearFilters} className="filter-clear">
                    Clear Filters
                </button>
            )}
        </div>
    )
}
