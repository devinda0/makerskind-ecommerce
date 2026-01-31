import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProductFn, uploadProductImageFn, refineImageFn } from '../../server/product'
import { Loader2, X, Upload, Image as ImageIcon, Sparkles } from 'lucide-react'

type Product = {
    _id: string
    name: string
    description: string
    supplierId: string
    pricing: {
        cost?: number
        selling: number
    }
    inventory: {
        onHand: number
    }
    images: {
        original: string[]
        enhanced: string[]
    }
    status: 'active' | 'draft' | 'archived' | 'pending_review' | 'rejected'
}

interface ProductEditDialogProps {
    product: Product | null
    isOpen: boolean
    onClose: () => void
}

export function ProductEditDialog({ product, isOpen, onClose }: ProductEditDialogProps) {
    const queryClient = useQueryClient()
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        costPrice: 0,
        sellingPrice: 0,
        quantity: 0,
        // Helper state for new uploads
        // We will manage images slightly differently: 
        // We display what's in the product + what's newly uploaded?
        // Actually, let's just edit the product's images directly in the form state
        images: {
            original: [] as string[],
            enhanced: [] as string[]
        }
    })
    const [uploading, setUploading] = useState(false)
    const [refiningImage, setRefiningImage] = useState<string | null>(null)
    const [refinePrompt, setRefinePrompt] = useState('')
    const [isRefining, setIsRefining] = useState(false)

    // Sync form data when product changes
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description,
                costPrice: product.pricing.cost || 0,
                sellingPrice: product.pricing.selling,
                quantity: product.inventory.onHand,
                images: {
                    original: product.images.original || [],
                    enhanced: product.images.enhanced || []
                }
            })
        }
    }, [product])

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!product) return
            
            await updateProductFn({ 
                data: {
                    productId: product._id,
                    name: data.name,
                    description: data.description,
                    costPrice: data.costPrice,
                    sellingPrice: data.sellingPrice,
                    quantity: data.quantity,
                    images: data.images.original
                } 
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
            onClose()
        }
    })

    const handleRefineClick = (imageUrl: string) => {
        setRefiningImage(imageUrl)
        setRefinePrompt('')
    }

    const processRefinement = async () => {
        if (!product || !refiningImage) return
        setIsRefining(true)
        try {
            const res = await refineImageFn({
                data: {
                    productId: product._id,
                    originalImageUrl: refiningImage,
                    prompt: refinePrompt
                }
            })
            if (res.success) {
                // Invalidate to fetch the new enhanced image
                queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
                // Also update local state to show it immediately (optimistic-ish)
                if (res.enhancedImageUrl) {
                    setFormData(prev => ({
                        ...prev,
                        images: {
                            ...prev.images,
                            enhanced: [...prev.images.enhanced, res.enhancedImageUrl!]
                        }
                    }))
                }
                setRefiningImage(null)
            }
        } catch (error) {
            console.error('Refine failed', error)
            alert('Failed to refine image')
        } finally {
            setIsRefining(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploading(true)
        try {
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
                    setFormData(prev => ({ 
                        ...prev, 
                        images: {
                            ...prev.images,
                            original: [...prev.images.original, res.url]
                        }
                    }))
                }
                setUploading(false)
            }
        } catch (error) {
            console.error('Upload failed', error)
            setUploading(false)
        }
    }

    const removeImage = (type: 'original' | 'enhanced', index: number) => {
        setFormData(prev => {
            const newList = [...prev.images[type]]
            newList.splice(index, 1)
            return {
                ...prev,
                images: {
                    ...prev.images,
                    [type]: newList
                }
            }
        })
    }

    if (!isOpen || !product) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl">
                    
                    {/* Header */}
                    <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold leading-6 text-gray-900" id="modal-title">
                                Edit Product
                            </h3>
                            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="px-4 py-5 sm:p-6 space-y-6">
                        {/* Images Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Original Images */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <label className="block text-sm font-medium text-gray-700">Original Images</label>
                                    <button 
                                        type="button"
                                        onClick={() => document.getElementById('edit-file-upload')?.click()}
                                        className="text-indigo-600 hover:text-indigo-500 text-sm font-medium flex items-center gap-1"
                                    >
                                        <Upload className="h-4 w-4" /> Add New
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {formData.images.original.map((url, idx) => (
                                        <div key={`orig-${idx}`} className="relative group aspect-square rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                                            <img src={url} alt={`Original ${idx}`} className="h-full w-full object-cover" />
                                            
                                            {/* Actions */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRefineClick(url)}
                                                    className="p-2 bg-white/90 rounded-full hover:bg-white text-amber-600 shadow-sm"
                                                    title="Refine with AI"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage('original', idx)}
                                                    className="p-2 bg-white/90 rounded-full hover:bg-white text-red-600 shadow-sm"
                                                    title="Remove"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.images.original.length === 0 && (
                                        <div className="col-span-2 py-8 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                                            <ImageIcon className="h-8 w-8 mb-2" />
                                            <span className="text-xs">No images</span>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    id="edit-file-upload" 
                                    type="file" 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                />
                                {uploading && <div className="text-xs text-indigo-600 animate-pulse">Uploading...</div>}
                            </div>

                            {/* Enhanced Images */}
                            <div className="space-y-4 border-l pl-6 border-dashed border-gray-200">
                                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-amber-500" />
                                    AI Enhanced Images
                                </label>
                                <div className="grid grid-cols-2 gap-4">
                                    {formData.images.enhanced.map((url, idx) => (
                                        <div key={`enh-${idx}`} className="relative group aspect-square rounded-lg border border-amber-200 overflow-hidden bg-amber-50">
                                            <img src={url} alt={`Enhanced ${idx}`} className="h-full w-full object-cover" />
                                            
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <button
                                                    type="button"
                                                    onClick={() => removeImage('enhanced', idx)}
                                                    className="p-1 bg-white/90 rounded-full hover:bg-white text-red-600 shadow-sm"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {formData.images.enhanced.length === 0 && (
                                        <div className="col-span-2 py-8 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg">
                                            <Sparkles className="h-8 w-8 mb-2 text-gray-300" />
                                            <span className="text-xs">No enhanced images yet</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cost Price</label>
                                    <div className="relative mt-1 rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.costPrice}
                                            onChange={e => setFormData({...formData, costPrice: Number(e.target.value)})}
                                            className="block w-full rounded-md border-gray-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Selling Price</label>
                                    <div className="relative mt-1 rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <input
                                            type="number"
                                            value={formData.sellingPrice}
                                            onChange={e => setFormData({...formData, sellingPrice: Number(e.target.value)})}
                                            className="block w-full rounded-md border-gray-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Quantity On Hand</label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={e => setFormData({...formData, quantity: Number(e.target.value)})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={e => setFormData({...formData, description: e.target.value})}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            onClick={() => updateMutation.mutate(formData)}
                            disabled={updateMutation.isPending || uploading || isRefining}
                            className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:ml-3 sm:w-auto disabled:opacity-50 items-center gap-2"
                        >
                            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            Save Changes
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>

            {/* Refine Image Dialog - Overlay */}
            {refiningImage && (
                <div className="fixed inset-0 z-[60] overflow-y-auto" aria-labelledby="refine-modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"></div>
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <Sparkles className="h-6 w-6 text-amber-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
                                        <h3 className="text-base font-semibold leading-6 text-gray-900" id="refine-modal-title">
                                            Refine Image with AI
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500 mb-4">
                                                Describe how you want to enhance this image. The AI will generate a new version based on your prompt.
                                            </p>
                                            
                                            <div className="flex justify-center mb-4 bg-gray-50 p-2 rounded-lg border border-gray-100">
                                                <img src={refiningImage} alt="Refining" className="h-40 object-contain rounded" />
                                            </div>

                                            <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-1">
                                                Enhancement Prompt
                                            </label>
                                            <textarea
                                                id="prompt"
                                                rows={3}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500 sm:text-sm border p-2"
                                                placeholder="e.g. Improve lighting, make colors more vibrant, remove background noise..."
                                                value={refinePrompt}
                                                onChange={(e) => setRefinePrompt(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    className="inline-flex w-full justify-center rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 sm:ml-3 sm:w-auto disabled:opacity-50 items-center gap-2"
                                    onClick={processRefinement}
                                    disabled={isRefining}
                                >
                                    {isRefining ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Enhancing...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="h-4 w-4" />
                                            Generate Enhanced Image
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                    onClick={() => setRefiningImage(null)}
                                    disabled={isRefining}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
