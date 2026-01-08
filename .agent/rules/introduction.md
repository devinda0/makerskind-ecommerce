---
trigger: always_on
---

Technical Design Document: "MakersKind" (TanStack Start + MongoDB + DigitalOcean)1. Introduction & Executive SummaryProject Vision"MakersKind" is a specialized e-commerce platform designed to bridge the gap between skilled craftspeople and discerning buyers who value unique, handmade items. Unlike generic marketplaces, MakersKind focuses on telling the story behind the product, providing a premium, gallery-like shopping experience while offering powerful, modern tools for sellers to manage their inventory.Technical PhilosophyThis technical design outlines a "Type-Safe Full-Stack" architecture. By leveraging the TanStack ecosystem (Start, Router, Query, Table, Form), we eliminate the traditional friction between frontend and backend. The application is built as a unified monolith where the API layer is abstracted into Server Functions, allowing for seamless Remote Procedure Calls (RPC) and end-to-end type safety from the database to the UI component.Key FeaturesUnified Full-Stack Experience: Built on TanStack Start, enabling Server-Side Rendering (SSR) for SEO and instant page loads.AI-Assisted Workflows: Integrated Generative AI to help artisans create professional product mockups and descriptions instantly, reducing the barrier to entry for non-technical sellers.Robust Data Management: A self-hosted MongoDB infrastructure provides the schema flexibility needed for diverse handcrafted product attributes.Infrastructure StrategyThe platform is hosted entirely within the DigitalOcean ecosystem to balance performance, cost, and control. By utilizing a self-managed Droplet for MongoDB and DigitalOcean Spaces for object storage, we maintain full ownership of our data layer while leveraging cloud scalability.2. Technology StackThe "TanStack Start" CoreFullstack Framework: TanStack Start (Built on TanStack Router).Role: Handles SSR, Client-side routing, and API endpoints (Server Functions).Data Fetching: TanStack Query (Integrated via Router Loaders).Forms: TanStack Form (Deep reactivity and validation).Tables: TanStack Table (Headless UI for Admin Dashboards).Runtime: Node.js (via Vinxi/Nitro).Data & Infrastructure (DigitalOcean)Database: MongoDB (Self-Hosted).Host: DigitalOcean Droplet (Ubuntu/Linux).Configuration: Replica Set (optional) or Standalone with Auth enabled.ODM (Object Data Mapper): Prisma (configured with MongoDB provider).AI Service: OpenAI API (DALL-E 3) or Stability AI.Image Storage: DigitalOcean Spaces (S3-compatible object storage).3. System Architecture: The "Server Function" PatternUnlike traditional REST APIs, TanStack Start uses Server Functions. These look like regular JavaScript functions but execute exclusively on the server.3.1 Data Flow (AI Generation Example)Client: Admin fills out product description in AddProductForm.Action: User clicks "Generate Image."RPC Call: The form calls generateProductImageFn({ description }).Note: This function is imported directly into the client component but executes on the Node server.Server: The function connects to OpenAI, gets the URL, and returns it.Client: The promise resolves, and the imageUrl field updates instantly.4. MongoDB Data Model (Schema)We will use a Document-based model. Since we are using TanStack (TypeScript), we define interfaces that map to MongoDB collections.4.1 CollectionsCollection: products{
  "_id": "ObjectId('...')",
  "name": "Hand-carved Wooden Bear",
  "description": "Oak wood, finished with linseed oil.",
  "price": 45.00,
  "stock": 10,
  "tags": ["woodwork", "decor"],
  "imageUrl": "[https://makerskind.nyc3.digitaloceanspaces.com/img.jpg](https://makerskind.nyc3.digitaloceanspaces.com/img.jpg)",
  "isHandmade": true,
  "createdAt": "ISODate('2023-10-27...')"
}
Collection: orders{
  "_id": "ObjectId('...')",
  "customerId": "ObjectId('...')",
  "status": "PENDING", // Enums: PENDING, SHIPPED, DELIVERED
  "totalAmount": 90.00,
  "shippingAddress": {
    "street": "123 Craft Lane",
    "city": "Portland",
    "zip": "97204"
  },
  "items": [
    {
      "productId": "ObjectId('...')",
      "name": "Hand-carved Wooden Bear", // Denormalized for snapshot
      "quantity": 2,
      "priceAtPurchase": 45.00
    }
  ],
  "createdAt": "ISODate('...')"
}
5. Feature Implementation Details5.1 Admin Dashboard: Product ManagementRoute: /admin/productsLoader (Server-Side):Uses createServerFn to fetch products from the Droplet-hosted MongoDB.Passes data to the route component.Component: TanStack TableFeatures: Server-side pagination is handled by passing page and pageSize params to the loader function, which translates to MongoDB .skip() and .limit().5.2 AI Image Generation (Server Function)This is the core logic for the AI feature using TanStack Start's server capabilities.// app/routes/api/ai.ts (Server Function)
import { createServerFn } from '@tanstack/start';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const generateImageFn = createServerFn('POST', async (payload: { prompt: string }) => {
  // 1. This code ONLY runs on the server
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: payload.prompt,
    n: 1,
    size: "1024x1024",
  });

  return { url: response.data[0].url };
});
// app/components/ProductForm.tsx (Client)
import { useForm } from '@tanstack/react-form';
import { generateImageFn } from '../routes/api/ai';

export function ProductForm() {
  const form = useForm({
    defaultValues: { description: '', imageUrl: '' },
    // ...
  });

  const handleGenerate = async () => {
    const desc = form.getFieldValue('description');
    // Call the server function like a normal JS function
    const result = await generateImageFn({ prompt: desc });
    form.setFieldValue('imageUrl', result.url);
  };

  // ... render form
}
5.3 Order ManagementRoute: /admin/ordersOptimization:Use MongoDB Aggregation Pipelines in the loader to calculate total sales dynamically.Optimistic Updates: When the Admin changes status from "Pending" to "Shipped", TanStack Query updates the UI immediately while the server function updates MongoDB in the background.6. Project Structure (TanStack Start)/
├── app/
│   ├── components/       # UI Components (Tables, Forms)
│   ├── routes/
│   │   ├── __root.tsx    # Root layout
│   │   ├── index.tsx     # Public Storefront
│   │   ├── admin.tsx     # Admin Layout (Auth Guard)
│   │   ├── admin/
│   │   │   ├── products.tsx  # Product Management Table
│   │   │   └── orders.tsx    # Order Management Table
│   │   └── api/          
│   │       ├── product.fn.ts # Server Functions for Products
│   │       └── orders.fn.ts  # Server Functions for Orders
│   ├── ssr.tsx           # SSR Entry point
│   └── client.tsx        # Client Entry point
├── server/               # Database connection logic
│   └── db.ts             # Prisma Instance -> DigitalOcean MongoDB URL
├── tsconfig.json
└── package.json
7. Implementation RoadmapInfrastructure Setup (DigitalOcean):Provision Droplet: Launch an Ubuntu Droplet.Install MongoDB: Install mongod, configure bind_ip to allow connection from the App Server (or localhost if monolithic), and enable Authentication (create Admin user).Provision Spaces: Create a DigitalOcean Space for storing product images.Environment: Set DATABASE_URL="mongodb://admin:pass@<DROPLET_IP>:27017/makerskind" in .env.Server Functions:Create getProducts, createProduct, generateImageFn.Ensure strict typing with Zod validation.Admin UI (Tables):Install @tanstack/react-table.Build ProductsTable utilizing the getProducts loader.Admin UI (Forms + AI):Install @tanstack/react-form.Integrate generateImageFn into the form submission flow.Public Storefront:Create a grid layout fetching data from the MongoDB products collection.