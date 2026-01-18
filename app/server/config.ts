import 'dotenv/config'

// Required environment variables
const requiredEnvVars = [
  'MONGODB_URI',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET'
]

// Validate required variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Invalid/Missing environment variable: "${envVar}"`)
  }
}

export const serverConfig = {
    mongodbUri: process.env.MONGODB_URI!,
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID!,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
        privateKey: process.env.FIREBASE_PRIVATE_KEY!,
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET!
    },
    isDevelopment: process.env.NODE_ENV === 'development',
}
