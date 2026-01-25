import { createFileRoute } from '@tanstack/react-router'
import AddProductWizard from '../../../components/supplier/AddProductWizard'

export const Route = createFileRoute('/supplier/products/new')({
  component: AddProductPage,
})

function AddProductPage() {
  return (
    <div className="add-product-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem 0' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.875rem', fontWeight: 'bold', color: 'var(--gray-900)', marginBottom: '0.5rem' }}>Add New Product</h1>
        <p style={{ color: 'var(--gray-500)' }}>Create a new product listing with AI assistance</p>
      </div>
      <AddProductWizard />
    </div>
  )
}
