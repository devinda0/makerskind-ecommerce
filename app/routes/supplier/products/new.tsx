import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/supplier/products/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/supplier/products/new"!</div>
}
