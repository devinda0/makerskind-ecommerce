import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createProductFn, uploadProductImageFn } from '../../server/product'
import { Loader2, Upload, Check, ChevronRight, ChevronLeft } from 'lucide-react'
import './AddProductWizard.css'

export default function AddProductWizard() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [uploading, setUploading] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
            costPrice: 0,
            sellingPrice: 0,
            quantity: 1,
            images: [] as string[],
        },
        onSubmit: async ({ value }) => {
            setSubmitting(true)
            try {
                // Create new product
                await createProductFn({
                    data: {
                        ...value,
                        status: 'pending_review',
                        images: value.images
                    }
                })
                navigate({ to: '/supplier' })
            } catch (error) {
                console.error('Failed to create product:', error)
                alert('Failed to create product. Please try again.')
            } finally {
                setSubmitting(false)
            }
        },
    })

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setUploading(true)
        try {
            const newImageUrls: string[] = []
            
            // Log currently existing images
            const currentImages = form.state.values.images || []

            for (let i = 0; i < files.length; i++) {
                const file = files[i]
                
                // Convert to base64
                const base64Content = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader()
                    reader.onload = () => resolve((reader.result as string).split(',')[1])
                    reader.onerror = reject
                    reader.readAsDataURL(file)
                })

                const res = await uploadProductImageFn({
                    data: {
                        filename: file.name,
                        contentType: file.type,
                        content: base64Content
                    }
                })
                
                if (res.success) {
                    newImageUrls.push(res.url)
                }
            }
            
            form.setFieldValue('images', [...currentImages, ...newImageUrls])
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Image upload failed. Please try again.')
        } finally {
            setUploading(false)
        }
    }

    const removeImage = (indexToRemove: number) => {
        const currentImages = form.state.values.images
        form.setFieldValue('images', currentImages.filter((_, index) => index !== indexToRemove))
    }

    const nextStep = () => setStep(s => Math.min(s + 1, 4))
    const prevStep = () => setStep(s => Math.max(s - 1, 1))

    return (
        <div className="wizard-container">
            <div className="wizard-steps">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`step-indicator ${step === s ? 'active' : ''} ${step > s ? 'completed' : ''}`}>
                        <div className="step-number">
                            {step > s ? <Check size={16} /> : s}
                        </div>
                        <div className="step-label">
                            {s === 1 && 'Basic Info'}
                            {s === 2 && 'Pricing'}
                            {s === 3 && 'Images'}
                            {s === 4 && 'Review'}
                        </div>
                    </div>
                ))}
            </div>

            <div className="wizard-content">
                {step === 1 && (
                    <div className="step-panel">
                        <form.Field name="name">
                            {(field) => (
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        className="form-input"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Handcrafted Wooden Bowl"
                                    />
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="description">
                            {(field) => (
                                <div className="form-group">
                                    <label className="form-label">Description</label>
                                    <textarea
                                        className="form-textarea"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        placeholder="Describe your product..."
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-panel">
                        <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <form.Field name="costPrice">
                                {(field) => (
                                    <div className="form-group">
                                        <label className="form-label">Cost Price ($)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                )}
                            </form.Field>
                            <form.Field name="sellingPrice">
                                {(field) => (
                                    <div className="form-group">
                                        <label className="form-label">Selling Price ($)</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={field.state.value}
                                            onChange={(e) => field.handleChange(Number(e.target.value))}
                                            min="0"
                                            step="0.01"
                                        />
                                    </div>
                                )}
                            </form.Field>
                        </div>
                        <form.Field name="quantity">
                            {(field) => (
                                <div className="form-group">
                                    <label className="form-label">Available Quantity</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                        min="1"
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-panel">
                        <form.Field name="images">
                            {(field) => (
                                <div className="form-group">
                                    <label className="form-label">Product Images ({field.state.value.length})</label>
                                    
                                    <div className="image-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                                        {field.state.value.map((url, index) => (
                                            <div key={index} className="relative group" style={{ position: 'relative', aspectRatio: '1' }}>
                                                <img 
                                                    src={url} 
                                                    alt={`Product ${index + 1}`} 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--gray-200)' }} 
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ position: 'absolute', top: '4px', right: '4px', cursor: 'pointer' }}
                                                >
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                                </button>
                                            </div>
                                        ))}

                                        <div 
                                            className="image-upload-area" 
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                            style={{ 
                                                border: '2px dashed var(--gray-300)', 
                                                borderRadius: '8px', 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                alignItems: 'center', 
                                                justifyContent: 'center', 
                                                aspectRatio: '1',
                                                cursor: 'pointer',
                                                backgroundColor: 'var(--gray-50)',
                                                minHeight: '100px'
                                            }}
                                        >
                                            <input
                                                id="file-upload"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                style={{ display: 'none' }}
                                                onChange={handleFileUpload}
                                            />
                                            {uploading ? (
                                                <Loader2 className="animate-spin text-gray-400" />
                                            ) : (
                                                <>
                                                    <Upload size={24} style={{ marginBottom: '0.25rem', color: 'var(--gray-400)' }} />
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Add Images</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)' }}>
                                        Upload multiple images to showcase your product from different angles.
                                    </p>
                                </div>
                            )}
                        </form.Field>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-panel">
                        <h3>Review Product Details</h3>
                        <div className="summary-grid" style={{ marginTop: '1.5rem' }}>
                            <div className="summary-item">
                                <label>Name</label>
                                <p>{form.state.values.name}</p>
                            </div>
                            <div className="summary-item">
                                <label>Price</label>
                                <p>Host: ${form.state.values.costPrice} / Sell: ${form.state.values.sellingPrice}</p>
                            </div>
                            <div className="summary-item" style={{ gridColumn: 'span 2' }}>
                                <label>Description</label>
                                <p>{form.state.values.description || 'No description provided'}</p>
                            </div>
                            <div className="summary-item">
                                <label>Stock</label>
                                <p>{form.state.values.quantity} units</p>
                            </div>
                        </div>
                        
                        {form.state.values.images.length > 0 && (
                             <div style={{ marginTop: '1.5rem' }}>
                                <label className="form-label">Product Images</label>
                                <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                    {form.state.values.images.map((url, i) => (
                                        <img key={i} src={url} alt="Review" style={{ height: '80px', borderRadius: '4px', border: '1px solid var(--gray-200)' }} />
                                    ))}
                                </div>
                             </div>
                        )}
                    </div>
                )}
            </div>

            <div className="wizard-actions">
                <button 
                    className="btn btn-secondary" 
                    onClick={prevStep} 
                    disabled={step === 1 || submitting}
                >
                    <ChevronLeft size={16} style={{ display: 'inline', marginRight: '0.25rem', verticalAlign: 'middle' }} /> Back
                </button>
                
                {step < 4 ? (
                    <form.Subscribe
                        selector={(state) => [state.values.name, state.values.images]}
                        children={([name, images]) => (
                            <button 
                                className="btn btn-primary" 
                                onClick={nextStep}
                                disabled={
                                    (step === 1 && !name) ||
                                    (step === 3 && (!images || images.length === 0))
                                }
                            >
                                Next <ChevronRight size={16} style={{ display: 'inline', marginLeft: '0.25rem', verticalAlign: 'middle' }} />
                            </button>
                        )}
                    />
                ) : (
                    <button 
                        className="btn btn-primary" 
                        onClick={(e) => {
                            e.preventDefault()
                            form.handleSubmit()
                        }}
                        disabled={submitting}
                    >
                        {submitting ? (
                            <><Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '0.5rem' }} /> Submitting...</>
                        ) : (
                            'Submit Product'
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
