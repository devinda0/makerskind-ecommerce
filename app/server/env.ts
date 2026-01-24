import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  MONGODB_URI: z.string().url(),
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string(),
  FIREBASE_PRIVATE_KEY: z.string(),
  FIREBASE_STORAGE_BUCKET: z.string(),
  GOOGLE_GEMINI_API_KEY: z.string().optional(), // Optional - only needed for Gemini image enhancement
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})

export const serverEnv = envSchema.parse(process.env)
