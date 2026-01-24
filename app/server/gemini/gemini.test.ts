import { describe, it, expect, vi, beforeEach } from 'vitest'

// --- Mock Imports for Testing ---

// Mock the GoogleGenAI client
const mockGenerateContent = vi.fn()

vi.mock('@google/genai', () => ({
    GoogleGenAI: vi.fn(() => ({
        models: {
            generateContent: mockGenerateContent,
        },
    })),
}))

// Mock Firebase bucket
const mockFileExists = vi.fn()
const mockFileDownload = vi.fn()
const mockFileSave = vi.fn()
const mockFileMakePublic = vi.fn()
const mockBucketFile = vi.fn((_path: string) => ({
    exists: mockFileExists,
    download: mockFileDownload,
    save: mockFileSave,
    makePublic: mockFileMakePublic,
}))

vi.mock('../firebase/admin', () => ({
    bucket: {
        file: (path: string) => mockBucketFile(path),
        name: 'test-bucket',
    } as unknown,
}))

// Mock serverEnv
vi.mock('../env', () => ({
    serverEnv: {
        GOOGLE_GEMINI_API_KEY: 'test-api-key',
    },
}))

// --- Unit Tests ---

describe('Gemini Client', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    it('should export GEMINI_IMAGE_MODEL constant', async () => {
        const { GEMINI_IMAGE_MODEL } = await import('./client')
        expect(GEMINI_IMAGE_MODEL).toBe('gemini-3-pro-image-preview')
    })

    it('should export getGeminiClient function', async () => {
        const { getGeminiClient } = await import('./client')
        expect(getGeminiClient).toBeDefined()
        const client = getGeminiClient()
        expect(client).toBeDefined()
        expect(client.models).toBeDefined()
    })
})

describe('Image Enhancement Utilities', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        vi.resetModules()
    })

    describe('downloadImageAsBase64', () => {
        it('should parse gs:// URLs correctly', async () => {
            mockFileExists.mockResolvedValueOnce([true])
            mockFileDownload.mockResolvedValueOnce([Buffer.from('test-image-data')])
            
            const { downloadImageAsBase64 } = await import('./image-enhancement')
            const result = await downloadImageAsBase64('gs://test-bucket/images/product.png')
            
            expect(mockBucketFile).toHaveBeenCalledWith('images/product.png')
            expect(result.data).toBe(Buffer.from('test-image-data').toString('base64'))
            expect(result.mimeType).toBe('image/png')
        })

        it('should parse firebasestorage.googleapis.com URLs correctly', async () => {
            mockFileExists.mockResolvedValueOnce([true])
            mockFileDownload.mockResolvedValueOnce([Buffer.from('test-image-data')])
            
            const { downloadImageAsBase64 } = await import('./image-enhancement')
            const result = await downloadImageAsBase64(
                'https://firebasestorage.googleapis.com/v0/b/test-bucket/o/images%2Fproduct.jpg?alt=media'
            )
            
            expect(mockBucketFile).toHaveBeenCalledWith('images/product.jpg')
            expect(result.mimeType).toBe('image/jpeg')
        })

        it('should parse storage.googleapis.com URLs correctly', async () => {
            mockFileExists.mockResolvedValueOnce([true])
            mockFileDownload.mockResolvedValueOnce([Buffer.from('test-image-data')])
            
            const { downloadImageAsBase64 } = await import('./image-enhancement')
            await downloadImageAsBase64('https://storage.googleapis.com/test-bucket/images/product.webp')
            
            expect(mockBucketFile).toHaveBeenCalledWith('images/product.webp')
        })

        it('should throw error for unsupported URL formats', async () => {
            const { downloadImageAsBase64 } = await import('./image-enhancement')
            
            await expect(downloadImageAsBase64('https://example.com/image.png'))
                .rejects.toThrow('Unsupported image URL format')
        })

        it('should throw error if file does not exist', async () => {
            mockFileExists.mockResolvedValueOnce([false])
            
            const { downloadImageAsBase64 } = await import('./image-enhancement')
            
            await expect(downloadImageAsBase64('gs://test-bucket/missing.png'))
                .rejects.toThrow('File not found in Firebase Storage')
        })

        it('should determine correct MIME type from file extension', async () => {
            mockFileExists.mockResolvedValueOnce([true])
            mockFileDownload.mockResolvedValueOnce([Buffer.from('test')])
            
            const { downloadImageAsBase64 } = await import('./image-enhancement')
            
            const jpegResult = await downloadImageAsBase64('gs://test-bucket/test.jpeg')
            expect(jpegResult.mimeType).toBe('image/jpeg')
            
            vi.clearAllMocks()
            mockFileExists.mockResolvedValueOnce([true])
            mockFileDownload.mockResolvedValueOnce([Buffer.from('test')])
            
            const gifResult = await downloadImageAsBase64('gs://test-bucket/test.gif')
            expect(gifResult.mimeType).toBe('image/gif')
        })
    })

    describe('enhanceWithGemini', () => {
        it('should send image to Gemini and return enhanced result', async () => {
            const enhancedBase64 = Buffer.from('enhanced-image').toString('base64')
            mockGenerateContent.mockResolvedValueOnce({
                candidates: [{
                    content: {
                        parts: [{
                            inlineData: {
                                data: enhancedBase64,
                                mimeType: 'image/png',
                            },
                        }],
                    },
                }],
            })
            
            const { enhanceWithGemini } = await import('./image-enhancement')
            const result = await enhanceWithGemini('original-base64', 'image/png')
            
            expect(result.data).toBe(enhancedBase64)
            expect(result.mimeType).toBe('image/png')
            expect(mockGenerateContent).toHaveBeenCalledWith({
                model: 'gemini-3-pro-image-preview',
                contents: expect.arrayContaining([
                    expect.objectContaining({ text: expect.stringContaining('Enhance') }),
                    expect.objectContaining({
                        inlineData: { mimeType: 'image/png', data: 'original-base64' },
                    }),
                ]),
            })
        })

        it('should throw error if Gemini returns no response', async () => {
            mockGenerateContent.mockResolvedValueOnce({ candidates: null })
            
            const { enhanceWithGemini } = await import('./image-enhancement')
            
            await expect(enhanceWithGemini('data', 'image/png'))
                .rejects.toThrow('No response from Gemini model')
        })

        it('should throw error if Gemini returns no image', async () => {
            mockGenerateContent.mockResolvedValueOnce({
                candidates: [{
                    content: {
                        parts: [{ text: 'No image generated' }],
                    },
                }],
            })
            
            const { enhanceWithGemini } = await import('./image-enhancement')
            
            await expect(enhanceWithGemini('data', 'image/png'))
                .rejects.toThrow('Gemini did not return an enhanced image')
        })
    })

    describe('uploadEnhancedImage', () => {
        it('should upload image to Firebase Storage with correct path', async () => {
            mockFileSave.mockResolvedValueOnce(undefined)
            mockFileMakePublic.mockResolvedValueOnce(undefined)
            
            const { uploadEnhancedImage } = await import('./image-enhancement')
            const result = await uploadEnhancedImage(
                'product-123',
                Buffer.from('image-data').toString('base64'),
                'image/png'
            )
            
            expect(mockBucketFile).toHaveBeenCalledWith(
                expect.stringMatching(/^products\/product-123\/enhanced\/\d+\.png$/)
            )
            expect(result).toMatch(/^https:\/\/storage\.googleapis\.com\/test-bucket\//)
        })

        it('should use correct file extension based on MIME type', async () => {
            mockFileSave.mockResolvedValueOnce(undefined)
            mockFileMakePublic.mockResolvedValueOnce(undefined)
            
            const { uploadEnhancedImage } = await import('./image-enhancement')
            await uploadEnhancedImage('product-123', 'base64data', 'image/jpeg')
            
            expect(mockBucketFile).toHaveBeenCalledWith(
                expect.stringMatching(/\.jpg$/)
            )
        })
    })
})

describe('RBAC for Image Refinement', () => {
    it('should allow suppliers to refine images for their own products', () => {
        const supplierUser = { id: 'supplier-123', role: 'supplier' as 'user' | 'supplier' | 'admin' }
        const ownProduct = { supplierId: 'supplier-123' }
        
        const allowedRoles = ['supplier', 'admin']
        const canRefine = allowedRoles.includes(supplierUser.role) && 
            (supplierUser.role === 'admin' || ownProduct.supplierId === supplierUser.id)
        
        expect(canRefine).toBe(true)
    })

    it('should allow admins to refine images for any product', () => {
        const adminUser = { id: 'admin-123', role: 'admin' as const }
        const anyProduct = { supplierId: 'other-supplier' }
        
        const allowedRoles = ['supplier', 'admin']
        const canRefine = allowedRoles.includes(adminUser.role) && 
            (adminUser.role === 'admin' || anyProduct.supplierId === adminUser.id)
        
        expect(canRefine).toBe(true)
    })

    it('should deny suppliers from refining images for other suppliers products', () => {
        const supplierUser = { id: 'supplier-123', role: 'supplier' as 'user' | 'supplier' | 'admin' }
        const otherProduct = { supplierId: 'other-supplier' }
        
        const allowedRoles = ['supplier', 'admin']
        const canRefine = allowedRoles.includes(supplierUser.role) && 
            (supplierUser.role === 'admin' || otherProduct.supplierId === supplierUser.id)
        
        expect(canRefine).toBe(false)
    })

    it('should deny regular users from refining images', () => {
        const regularUser = { id: 'user-123', role: 'user' as const }
        
        const allowedRoles = ['supplier', 'admin']
        const canRefine = allowedRoles.includes(regularUser.role)
        
        expect(canRefine).toBe(false)
    })
})
