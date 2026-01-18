import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { makeQueryClient } from './utils/queryClient'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
  const queryClient = makeQueryClient()

  return createTanStackRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  })
}
