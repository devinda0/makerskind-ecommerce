import { serverEnv } from './env'

// Re-export for backward compatibility during refactor
export const serverConfig = {
    mongodbUri: serverEnv.MONGODB_URI,
    firebase: {
        projectId: serverEnv.FIREBASE_PROJECT_ID,
        clientEmail: serverEnv.FIREBASE_CLIENT_EMAIL,
        privateKey: serverEnv.FIREBASE_PRIVATE_KEY,
        storageBucket: serverEnv.FIREBASE_STORAGE_BUCKET
    },
    isDevelopment: serverEnv.NODE_ENV === 'development',
}
