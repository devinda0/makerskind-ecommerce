import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../server/cart'

// Cart query key
const CART_QUERY_KEY = ['cart'] as const

/**
 * React hook for cart state management using TanStack Query
 * Provides cart data fetching and mutation functions
 */
export function useCart() {
    const queryClient = useQueryClient()

    // Fetch cart data
    const cartQuery = useQuery({
        queryKey: CART_QUERY_KEY,
        queryFn: () => getCart(),
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    // Add item mutation
    const addItemMutation = useMutation({
        mutationFn: async ({ productId, quantity = 1 }: { productId: string; quantity?: number }) => {
            return addToCart({ data: { productId, quantity } })
        },
        onSuccess: (data) => {
            queryClient.setQueryData(CART_QUERY_KEY, data)
        },
    })

    // Update item quantity mutation
    const updateQuantityMutation = useMutation({
        mutationFn: async ({ productId, quantity }: { productId: string; quantity: number }) => {
            return updateCartItem({ data: { productId, quantity } })
        },
        onSuccess: (data) => {
            queryClient.setQueryData(CART_QUERY_KEY, data)
        },
    })

    // Remove item mutation
    const removeItemMutation = useMutation({
        mutationFn: async (productId: string) => {
            return removeFromCart({ data: { productId } })
        },
        onSuccess: (data) => {
            queryClient.setQueryData(CART_QUERY_KEY, data)
        },
    })

    // Clear cart mutation
    const clearCartMutation = useMutation({
        mutationFn: () => clearCart(),
        onSuccess: (data) => {
            queryClient.setQueryData(CART_QUERY_KEY, data)
        },
    })

    // Calculate totals
    const itemCount = cartQuery.data?.items?.reduce(
        (total, item) => total + item.quantity, 
        0
    ) ?? 0

    return {
        // Data
        items: cartQuery.data?.items ?? [],
        userId: cartQuery.data?.userId,
        isAnonymous: cartQuery.data?.isAnonymous ?? true,
        itemCount,
        
        // Loading states
        isLoading: cartQuery.isLoading,
        isError: cartQuery.isError,
        error: cartQuery.error,
        
        // Mutations
        addItem: addItemMutation.mutate,
        addItemAsync: addItemMutation.mutateAsync,
        isAddingItem: addItemMutation.isPending,
        
        updateQuantity: updateQuantityMutation.mutate,
        updateQuantityAsync: updateQuantityMutation.mutateAsync,
        isUpdatingQuantity: updateQuantityMutation.isPending,
        
        removeItem: removeItemMutation.mutate,
        removeItemAsync: removeItemMutation.mutateAsync,
        isRemovingItem: removeItemMutation.isPending,
        
        clearCart: clearCartMutation.mutate,
        clearCartAsync: clearCartMutation.mutateAsync,
        isClearingCart: clearCartMutation.isPending,
        
        // Refetch
        refetch: cartQuery.refetch,
    }
}

/**
 * Invalidate cart cache - useful after login/registration
 * to trigger a refetch with the new user's cart
 */
export function useInvalidateCart() {
    const queryClient = useQueryClient()
    
    return () => {
        queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY })
    }
}
