import { getGeminiClient, GEMINI_IMAGE_MODEL } from './client'
import { bucket } from '../firebase/admin'

/**
 * Download an image from Firebase Storage and convert to base64
 * @param imageUrl - Firebase Storage URL or gs:// URL
 * @returns Base64 encoded image data and mime type
 */
export async function downloadImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
    // Handle gs:// URLs by extracting the file path
    let filePath: string
    
    if (imageUrl.startsWith('gs://')) {
        // Format: gs://bucket-name/path/to/file
        const matches = imageUrl.match(/^gs:\/\/[^/]+\/(.+)$/)
        if (!matches) {
            throw new Error('Invalid gs:// URL format')
        }
        filePath = matches[1]
    } else if (imageUrl.includes('firebasestorage.googleapis.com')) {
        // Format: https://firebasestorage.googleapis.com/v0/b/{bucket}/o/{encoded-path}?...
        const matches = imageUrl.match(/\/o\/([^?]+)/)
        if (!matches) {
            throw new Error('Invalid Firebase Storage URL format')
        }
        filePath = decodeURIComponent(matches[1])
    } else if (imageUrl.includes('storage.googleapis.com')) {
        // Format: https://storage.googleapis.com/{bucket}/{path}
        const url = new URL(imageUrl)
        const pathParts = url.pathname.split('/')
        // Remove the bucket name (first segment after leading slash)
        filePath = pathParts.slice(2).join('/')
    } else {
        throw new Error('Unsupported image URL format. Expected Firebase Storage URL.')
    }
    
    // Download the file from Firebase Storage
    const file = bucket.file(filePath)
    const [exists] = await file.exists()
    
    if (!exists) {
        throw new Error(`File not found in Firebase Storage: ${filePath}`)
    }
    
    const [buffer] = await file.download()
    const base64Data = buffer.toString('base64')
    
    // Determine mime type from file extension
    const extension = filePath.split('.').pop()?.toLowerCase() || 'png'
    const mimeTypeMap: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
    }
    const mimeType = mimeTypeMap[extension] || 'image/png'
    
    return { data: base64Data, mimeType }
}

/**
 * Send an image to Gemini for enhancement
 * @param imageData - Base64 encoded image data
 * @param mimeType - MIME type of the image
 * @param userPrompt - Optional custom prompt from the user
 * @returns Enhanced image as base64 data
 */
export async function enhanceWithGemini(
    imageData: string,
    mimeType: string,
    userPrompt?: string
): Promise<{ data: string; mimeType: string }> {
    const defaultPrompt = 'Enhance this product image for e-commerce. ' +
                  'Improve lighting, color balance, and overall quality. ' +
                  'Keep the product as the main focus. ' +
                  'Return only the enhanced image.'
                  
    const promptText = userPrompt ? `${userPrompt} Return only the enhanced image.` : defaultPrompt

    const prompt = [
        { 
            text: promptText
        },
        {
            inlineData: {
                mimeType,
                data: imageData,
            },
        },
    ]
    
    const client = getGeminiClient()
    const response = await client.models.generateContent({
        model: GEMINI_IMAGE_MODEL,
        contents: prompt,
    })
    
    // Extract enhanced image from response
    const parts = response.candidates?.[0]?.content?.parts
    if (!parts) {
        throw new Error('No response from Gemini model')
    }
    
    for (const part of parts) {
        if (part.inlineData) {
            return {
                data: part.inlineData.data as string,
                mimeType: (part.inlineData.mimeType as string) || 'image/png',
            }
        }
    }
    
    throw new Error('Gemini did not return an enhanced image')
}

/**
 * Upload an enhanced image to Firebase Storage
 * @param productId - Product ID to associate the image with
 * @param imageData - Base64 encoded image data
 * @param mimeType - MIME type of the image
 * @returns Public URL of the uploaded image
 */
export async function uploadEnhancedImage(
    productId: string,
    imageData: string,
    mimeType: string
): Promise<string> {
    // Determine file extension from mime type
    const extensionMap: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/webp': 'webp',
    }
    const extension = extensionMap[mimeType] || 'png'
    
    // Create a unique filename
    const timestamp = Date.now()
    const filePath = `products/${productId}/enhanced/${timestamp}.${extension}`
    
    // Upload to Firebase Storage
    const file = bucket.file(filePath)
    const buffer = Buffer.from(imageData, 'base64')
    
    await file.save(buffer, {
        metadata: {
            contentType: mimeType,
        },
    })
    
    // Make the file publicly accessible and get the URL
    await file.makePublic()
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`
    
    return publicUrl
}

/**
 * Complete image enhancement pipeline:
 * 1. Download original image from Firebase Storage
 * 2. Send to Gemini for enhancement
 * 3. Upload enhanced image to Firebase Storage
 * 4. Return the enhanced image URL
 */
export async function enhanceProductImage(
    productId: string,
    originalImageUrl: string,
    prompt?: string
): Promise<string> {
    // Step 1: Download and convert to base64
    const { data: originalData, mimeType } = await downloadImageAsBase64(originalImageUrl)
    
    // Step 2: Enhance with Gemini
    const { data: enhancedData, mimeType: enhancedMimeType } = await enhanceWithGemini(originalData, mimeType, prompt)
    
    // Step 3: Upload enhanced image
    const enhancedUrl = await uploadEnhancedImage(productId, enhancedData, enhancedMimeType)
    
    return enhancedUrl
}
