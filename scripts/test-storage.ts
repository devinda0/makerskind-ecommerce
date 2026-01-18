import 'dotenv/config'
import admin from 'firebase-admin'

async function testStorage() {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY

  if (!projectId || !clientEmail || !privateKey || projectId === 'replace-with-project-id') {
    console.warn('⚠️ Firebase credentials missing or placeholders in .env. Skipping storage test.')
    return
  }

  console.log('Testing Firebase Storage access...')
  
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey: privateKey.replace(/\\n/g, '\n'),
        }),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      })
    }

    const bucket = admin.storage().bucket()
    const [files] = await bucket.getFiles({ maxResults: 1 })
    console.log('✅ Successfully accessed Firebase Storage bucket!')
    console.log(`ℹ️ Found ${files.length} files (listing usage).`)

  } catch (error) {
    console.error('❌ Failed to access Firebase Storage:', error)
     // process.exit(1) // Don't fail the whole flow if firebase isn't set up yet, as it might be manual next step
  }
}

testStorage()
