import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
})

function CheckoutPage() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Checkout</h1>
      <p>Checkout functionality coming soon...</p>
    </div>
  )
}
