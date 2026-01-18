import 'dotenv/config'
import { MongoClient } from 'mongodb'

async function testConnection() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('❌ MONGODB_URI is missing in .env')
    process.exit(1)
  }

  console.log('Testing MongoDB connection...')
  const client = new MongoClient(uri)

  try {
    await client.connect()
    console.log('✅ Successfully connected to MongoDB!')
    
    const db = client.db()
    const result = await db.command({ ping: 1 })
    console.log('✅ Database ping successful:', result)
    
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

testConnection()
