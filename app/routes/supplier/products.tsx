import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/supplier/products')({
  component: ProductsLayout,
})

function ProductsLayout() {
  return <Outlet />
}
