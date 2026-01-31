import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProductFn, uploadProductImageFn } from '../../server/product'
import { Loader2, X, Upload, Image as ImageIcon } from 'lucide-react'

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
        imageUrl: '' as string | null
    })
    const [uploading, setUploading] = useState(false)

    // Sync form data when product changes
    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name,
                description: product.description,
                costPrice: product.pricing.cost || 0,
                sellingPrice: product.pricing.selling,
                quantity: product.inventory.onHand,
                imageUrl: product.images.enhanced[0] || product.images.original[0] || null
            })
        }
    }, [product])

    const updateMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            if (!product) return
            
            // Build upgrade object. Note: handling images simplisticly here (replace main image)
            const updateData: any = {
                productId: product._id,
                name: data.name,
                description: data.description,
                pricing: {
                    cost: data.costPrice,
                    selling: data.sellingPrice
                },
                inventory: {
                    onHand: data.quantity
                }
            }

            // Only update images if we have a URL and it's different (or just always send current)
            // Simplified: If we have an image URL, verify if it needs update. 
            // The backend handles images prop as replacement of the array usually?
            // Let's assume we replace the main image or add it.
            if (data.imageUrl) {
                 updateData.images = [data.imageUrl]
            }

            await updateProductFn({ data: updateData })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
            onClose()
        }
    })

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
                    setFormData(prev => ({ ...prev, imageUrl: res.url }))
                }
                setUploading(false)
            }
        } catch (error) {
            console.error('Upload failed', error)
            setUploading(false)
        }
    }

    if (!isOpen || !product) return null

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                    
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
                        {/* Image Section */}
                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="w-full sm:w-1/3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Product Image</label>
                                <div className="relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
                                    {formData.imageUrl ? (
                                        <div className="relative h-full w-full group">
                                            <img src={formData.imageUrl} alt="Preview" className="h-full w-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => document.getElementById('edit-file-upload')?.click()}
                                                    className="text-white bg-white/20 hover:bg-white/30 p-2 rounded-full backdrop-blur-sm"
                                                >
                                                    <Upload className="h-6 w-6" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div 
                                            className="h-full w-full flex flex-col items-center justify-center cursor-pointer text-gray-400"
                                            onClick={() => document.getElementById('edit-file-upload')?.click()}
                                        >
                                            <ImageIcon className="h-10 w-10 mb-2" />
                                            <span className="text-xs">Click to upload</span>
                                        </div>
                                    )}
                                    <input 
                                        id="edit-file-upload" 
                                        type="file" 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    {uploading && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                                            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            <div className="flex-1 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
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

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        <button
                            type="button"
                            onClick={() => updateMutation.mutate(formData)}
                            disabled={updateMutation.isPending || uploading}
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
        </div>
    )
}
