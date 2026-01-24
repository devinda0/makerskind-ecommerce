import { GoogleGenAI } from '@google/genai'
import { serverEnv } from '../env'

// Model for image generation/enhancement
export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview'

// Lazy-initialized Google GenAI client
let _ai: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
    if (!serverEnv.GOOGLE_GEMINI_API_KEY) {
        throw new Error('GOOGLE_GEMINI_API_KEY is not configured. Set it in your .env file to use Gemini features.')
    }
    if (!_ai) {
        _ai = new GoogleGenAI({
            apiKey: serverEnv.GOOGLE_GEMINI_API_KEY,
        })
    }
    return _ai
}

