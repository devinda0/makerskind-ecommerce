import { useForm } from '@tanstack/react-form'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { createProductFn, refineImageFn, updateProductFn, uploadProductImageFn } from '../../server/product'
import { Loader2, Upload, Sparkles, Check, ChevronRight, ChevronLeft } from 'lucide-react'
import './AddProductWizard.css'

export default function AddProductWizard() {
    const navigate = useNavigate()
    const [step, setStep] = useState(1)
    const [productId, setProductId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [refining, setRefining] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)
    const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null)

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
                // If we have an existing product (from refine/draft), update it
                if (productId) {
                     await updateProductFn({
                        data: {
                            productId,
                            ...value,
                            status: 'pending_review',
                             // Ensure images array has what we want logic
                            images: enhancedImageUrl ? [enhancedImageUrl] : (originalImageUrl ? [originalImageUrl] : [])
                        }
                    })
                } else {
                     // Create new product if no draft exists
                    await createProductFn({
                        data: {
                            ...value,
                            status: 'pending_review',
                            images: enhancedImageUrl ? [enhancedImageUrl] : (originalImageUrl ? [originalImageUrl] : [])
                        }
                    })
                }
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
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
            // Convert to base64 for server upload
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = async () => {
                const base64Content = (reader.result as string).split(',')[1]
                
                const res = await uploadProductImageFn({
                    data: {
                        filename: file.name,
                        contentType: file.type,
                        content: base64Content
                    }
                })
                
                if (res.success) {
                    setOriginalImageUrl(res.url)
                    form.setFieldValue('images', [res.url])
                }
                setUploading(false)
            }
            reader.onerror = () => {
                setUploading(false)
                alert('Failed to read file')
            }
        } catch (error) {
            console.error('Upload failed:', error)
            alert('Image upload failed. Please try again.')
            setUploading(false)
        }
    }

    const handleRefineImage = async () => {
        if (!originalImageUrl) return
        
        setRefining(true)
        try {
            let currentId = productId
            
            // If product doesn't exist yet, create a draft
            if (!currentId) {
                const res = await createProductFn({
                    data: {
                        ...form.state.values,
                        status: 'draft',
                        images: [originalImageUrl]
                    }
                })
                currentId = res.product._id
                setProductId(currentId)
            } else {
                // Ensure image is associated
                await updateProductFn({
                    data: {
                        productId: currentId,
                        images: [originalImageUrl]
                    }
                })
            }

            // Call AI Refine
            const res = await refineImageFn({
                data: {
                    productId: currentId!,
                    originalImageUrl: originalImageUrl
                }
            })
            
            if (res.success && res.enhancedImageUrl) {
                setEnhancedImageUrl(res.enhancedImageUrl)
            }
        } catch (error) {
            console.error('Refine failed:', error)
            alert('AI refinement failed. Please try again.')
        } finally {
            setRefining(false)
        }
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
                        <div className="form-group">
                            <label className="form-label">Product Image</label>
                            
                            {!originalImageUrl ? (
                                <div className="image-upload-area" onClick={() => document.getElementById('file-upload')?.click()}>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handleFileUpload}
                                    />
                                    {uploading ? (
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                            <Loader2 className="animate-spin" />
                                            <span>Uploading...</span>
                                        </div>
                                    ) : (
                                        <div>
                                            <Upload className="mx-auto" size={32} style={{ marginBottom: '0.5rem', color: 'var(--gray-400)' }} />
                                            <p>Click to upload an image</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="image-preview-container">
                                    <div className="preview-card">
                                        <div className="preview-label">Original</div>
                                        <img src={originalImageUrl} alt="Original" className="preview-image" />
                                    </div>
                                </div>
                            )}
                            
                            {originalImageUrl && (
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ marginTop: '1rem' }}
                                    onClick={() => {
                                        setOriginalImageUrl(null)
                                        form.setFieldValue('images', [])
                                    }}
                                >
                                    Replace Image
                                </button>
                            )}
                        </div>
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
                        
                        {enhancedImageUrl && (
                             <div style={{ marginTop: '1.5rem' }}>
                                <label className="form-label">Selected Image (AI Enhanced)</label>
                                <img src={enhancedImageUrl} alt="Final" style={{ height: '150px', borderRadius: '8px', border: '1px solid var(--gray-200)' }} />
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
