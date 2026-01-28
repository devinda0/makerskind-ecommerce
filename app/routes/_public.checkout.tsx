import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { createOrderFn } from '../server/order'
import { getCurrentUser } from '../server/auth'
import { useCartStore } from '../hooks/useCartStore'
import type { ShippingAddress } from '../server/order-utils'
import './_public.checkout.css'

export const Route = createFileRoute('/_public/checkout')({
  component: CheckoutPage,
  loader: async () => {
    const user = await getCurrentUser()
    return { user }
  },
})

function CheckoutPage() {
  const { user } = Route.useLoaderData()
  const { items, clearCart } = useCartStore()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  // Parse saved address if it exists
  let defaultAddress = {
    street: '',
    city: '',
    zip: '',
    country: '',
  }

  if (user?.shippingAddress) {
    try {
      // Assuming shippingAddress is stored as JSON string based on auth-utils types
      // If it's stored differently in DB, this might need adjustment
      const parsed = JSON.parse(user.shippingAddress)
      defaultAddress = { ...defaultAddress, ...parsed }
    } catch (e) {
      console.error('Failed to parse shipping address', e)
    }
  }

  const cartTotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost = cartTotal >= 50 ? 0 : 5.99
  const total = cartTotal + shippingCost

  const createOrderMutation = useMutation({
    mutationFn: createOrderFn,
    onSuccess: (data) => {
      if (data.success) {
        clearCart()
        // Improve: Show accessible toast/alert before redirecting
        alert('Order placed successfully!')
        navigate({ to: '/' })
      }
    },
    onError: (error) => {
      setSubmitError(error.message || 'Failed to place order')
    },
  })

  const form = useForm({
    defaultValues: {
      street: defaultAddress.street,
      city: defaultAddress.city,
      zip: defaultAddress.zip,
      country: defaultAddress.country,
    },
    onSubmit: async ({ value }) => {
      if (items.length === 0) {
        setSubmitError('Your cart is empty')
        return
      }

      const shippingAddress: ShippingAddress = {
        street: value.street,
        city: value.city,
        zip: value.zip,
        country: value.country,
      }

      await createOrderMutation.mutateAsync({
        data: {
          items: items.map(item => ({
            productId: item.id,
            quantity: item.quantity
          })),
          shippingAddress
        }
      })
    },
  })

  if (items.length === 0) {
    return (
      <div className="checkout-empty">
        <h1>Your cart is empty</h1>
        <button onClick={() => navigate({ to: '/products' })} className="btn-primary">
          Browse Products
        </button>
      </div>
    )
  }

  return (
    <div className="checkout-container">
      <h1 className="checkout-title">Checkout</h1>
      
      <div className="checkout-grid">
        <div className="checkout-form-section">
          <h2>Shipping Information</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="checkout-form"
          >
            <form.Field
              name="street"
              validators={{
                onChange: ({ value }) => !value ? 'Street address is required' : undefined
              }}
            >
              {(field) => (
                <div className="form-group">
                  <label htmlFor={field.name}>Street Address</label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={field.state.meta.errors.length ? 'error' : ''}
                  />
                  {field.state.meta.errors ? (
                    <span className="error-message">{field.state.meta.errors.join(', ')}</span>
                  ) : null}
                </div>
              )}
            </form.Field>

            <div className="form-row">
              <form.Field
                name="city"
                validators={{
                  onChange: ({ value }) => !value ? 'City is required' : undefined
                }}
              >
                {(field) => (
                  <div className="form-group">
                    <label htmlFor={field.name}>City</label>
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={field.state.meta.errors.length ? 'error' : ''}
                    />
                     {field.state.meta.errors ? (
                    <span className="error-message">{field.state.meta.errors.join(', ')}</span>
                  ) : null}
                  </div>
                )}
              </form.Field>

              <form.Field
                name="zip"
                validators={{
                  onChange: ({ value }) => !value ? 'ZIP Code is required' : undefined
                }}
              >
                {(field) => (
                  <div className="form-group">
                    <label htmlFor={field.name}>ZIP Code</label>
                    <input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className={field.state.meta.errors.length ? 'error' : ''}
                    />
                     {field.state.meta.errors ? (
                    <span className="error-message">{field.state.meta.errors.join(', ')}</span>
                  ) : null}
                  </div>
                )}
              </form.Field>
            </div>

            <form.Field
              name="country"
              validators={{
                onChange: ({ value }) => !value ? 'Country is required' : undefined
              }}
            >
              {(field) => (
                <div className="form-group">
                  <label htmlFor={field.name}>Country</label>
                  <input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    className={field.state.meta.errors.length ? 'error' : ''}
                  />
                   {field.state.meta.errors ? (
                    <span className="error-message">{field.state.meta.errors.join(', ')}</span>
                  ) : null}
                </div>
              )}
            </form.Field>

            {submitError && <div className="form-error-banner">{submitError}</div>}

            <button 
              type="submit" 
              className="btn-primary checkout-submit-btn"
              disabled={createOrderMutation.isPending}
            >
              {createOrderMutation.isPending ? 'Processing...' : `Pay $${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className="checkout-summary-section">
          <h2>Order Summary</h2>
          <div className="summary-items">
            {items.map((item) => (
              <div key={item.id} className="summary-item">
                <div className="summary-item-info">
                  <span className="summary-item-name">{item.name}</span>
                  <span className="summary-item-qty">x{item.quantity}</span>
                </div>
                <span className="summary-item-price">${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          
          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>${cartTotal.toFixed(2)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span>{shippingCost === 0 ? 'Free' : `$${shippingCost.toFixed(2)}`}</span>
            </div>
            <div className="summary-row total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
