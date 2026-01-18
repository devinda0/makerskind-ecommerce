import admin from 'firebase-admin'
import { getStorage } from 'firebase-admin/storage'

if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY
          ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
          : undefined,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    })
  } catch (error) {
    console.error('Firebase admin initialization error', error)
  }
}

const storage = getStorage()
const bucket = storage.bucket() // Uses the default bucket from options

export { storage, bucket }
