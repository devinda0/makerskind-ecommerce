import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/supplier/products')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/supplier/products"!</div>
}
