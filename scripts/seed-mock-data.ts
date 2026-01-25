
import { MongoClient } from 'mongodb'
import { config } from 'dotenv'
import path from 'path'

// Load environment variables from .env file
config({ path: path.resolve(process.cwd(), '.env') })

const MONGODB_URI = process.env.MONGODB_URI

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env')
    process.exit(1)
}

const mockProducts = [
    {
        name: "Handwoven Bamboo Basket",
        description: "A versatile and eco-friendly bamboo basket, perfect for storage or as a decorative piece. Handwoven by skilled artisans using traditional techniques.",
        pricing: { cost: 15.00, selling: 35.00 },
        inventory: { onHand: 50 },
        images: { original: ["https://placehold.co/600x600?text=Bamboo+Basket"], enhanced: [] },
        status: "active",
        supplierId: "mock_supplier_1",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Ceramic Flower Vase",
        description: "Elegant ceramic vase with a unique glaze finish. Adds a touch of sophistication to any room. Each piece is hand-thrown and distinct.",
        pricing: { cost: 22.00, selling: 55.00 },
        inventory: { onHand: 25 },
        images: { original: ["https://placehold.co/600x600?text=Ceramic+Vase"], enhanced: [] },
        status: "active",
        supplierId: "mock_supplier_2",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Embroidered Cotton Table Runner",
        description: "Beautifully embroidered table runner made from 100% organic cotton. Features intricate floral patterns inspired by nature.",
        pricing: { cost: 18.00, selling: 42.00 },
        inventory: { onHand: 30 },
        images: { original: ["https://placehold.co/600x600?text=Table+Runner"], enhanced: [] },
        status: "active",
        supplierId: "mock_supplier_1",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Carved Wooden Elephant",
        description: "Intricately carved wooden elephant sculpture. A symbol of wisdom and strength. Made from sustainably sourced wood.",
        pricing: { cost: 30.00, selling: 75.00 },
        inventory: { onHand: 15 },
        images: { original: ["https://placehold.co/600x600?text=Wooden+Elephant"], enhanced: [] },
        status: "active",
        supplierId: "mock_supplier_3",
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: "Handmade Soy Wax Candle",
        description: "Aromatic soy wax candle with essential oils. Burns clean and long, filling your home with a relaxing scent.",
        pricing: { cost: 8.00, selling: 22.00 },
        inventory: { onHand: 100 },
        images: { original: ["https://placehold.co/600x600?text=Soy+Candle"], enhanced: [] },
        status: "active",
        supplierId: "mock_supplier_2",
        createdAt: new Date(),
        updatedAt: new Date()
    }
]

async function seed() {
    console.log('Connecting to MongoDB...')
    const client = new MongoClient(MONGODB_URI!)

    try {
        await client.connect()
        const db = client.db()
        const collection = db.collection('products')

        console.log('Clearing existing products...')
        await collection.deleteMany({})

        console.log(`Seeding ${mockProducts.length} products...`)
        const result = await collection.insertMany(mockProducts)

        console.log(`Successfully seeded ${result.insertedCount} products.`)
        
        // Log inserted IDs for verification/testing routes
        const firstId = Object.values(result.insertedIds)[0]
        console.log(`First product ID for testing: ${firstId}`)

    } catch (error) {
        console.error('Error seeding database:', error)
    } finally {
        await client.close()
    }
}

seed()
