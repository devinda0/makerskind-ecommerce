import { GoogleGenAI } from '@google/genai'
import { serverEnv } from '../env'

// Initialize Google GenAI client with API key
const ai = new GoogleGenAI({
    apiKey: serverEnv.GOOGLE_GEMINI_API_KEY,
})

// Model for image generation/enhancement
export const GEMINI_IMAGE_MODEL = 'gemini-3-pro-image-preview'

export { ai }
