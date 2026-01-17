---
trigger: always_on
---

# **System Design Document (SDD) for Makerskind**

Project: Makerskind E-Commerce Platform
Role: Senior System Architect
Date: January 17, 2026
Version: 1.5

## **1\. Executive Summary**

Makerskind is a specialized B2C/B2B e-commerce platform for handicrafts. This document outlines the technical architecture required to support three distinct user roles (Admin, Supplier, User), a seamless guest checkout experience, and an advanced AI-driven inventory management system utilizing Google's Gemini model. The architecture is explicitly designed to leverage **Google Cloud Platform (GCP) Free Tier** resources and the **TanStack** ecosystem to minimize operational costs while delivering high performance.

## **2\. System Architecture**

### **2.1 High-Level Architecture (Unified Full-Stack)**

We will utilize a **Unified Serverless Architecture** where a single TanStack Start application handles both the UI and the API logic (Server Functions).

1. **Full-Stack Service (Presentation & Application Layer):**
   * **Technology:** **TanStack Start** (React Server Components \+ Server Functions).
   * **Infrastructure:** **Google Cloud Run**.
   * **Routing:** **TanStack Router** (Built-in) for type-safe routing.
   * **Backend Logic:** **TanStack Start Server Functions** (replaces standalone Express).
   * **State:** **TanStack Query** for data fetching and caching.
   * **Forms:** **TanStack Form** for validation.
   * **Responsibility:** Handles SSR, Client Interaction, API endpoints (RPC), Auth, and AI orchestration in a single deployable unit.
   * **Cost Strategy:** Scales to zero when idle.
2. **Data Layer:**
   * **Database:** **MongoDB Atlas (M0 Sandbox)** deployed on GCP (Iowa/us-central1).
   * **Object Storage:** **Firebase Storage** for product images and assets.
   * **Responsibility:** Persistent storage of unstructured data, media, and auth sessions.

### **2.2 Component Diagram (GCP Focused)**

\[Client Browsers\]
    |
    v
\[Firebase Hosting (CDN Layer)\]
    | (Rewrites to Cloud Run)
    v
\[Cloud Run: Unified Service\] \<---(Full-Stack)---\> \[TanStack Start\]
    |      (SSR\+ Server Functions)
    |
    \+---\> \[Gemini Flash API\] (AI Processing)
    |
    \+---\> \[MongoDB Atlas\] (Data/Sessions)
    |
    \+---\> \[Firebase Storage\] (Images)

## **3\. Detailed Subsystem Design**

### **3.1 Authentication & Authorization Subsystem**

* **Library:** **BetterAuth** (Integrated directly into TanStack Start).
* **Rationale:** Runs within the TanStack Start server runtime, maintaining the unified architecture.
* **Adapter:** **MongoDB Adapter**. BetterAuth automatically manages user, session, account, and verification collections.
* **Guest Logic:** BetterAuth supports anonymous sessions, allowing guests to build carts. These merge into permanent accounts upon registration.
* **RBAC:** Extended user schema to include a role field ('admin', 'supplier', 'user'). Server Functions enforce access control based on this role.

### **3.2 AI Image Enhancement Pipeline**

**Workflow:**

1. **Client:** Supplier selects an image in the TanStack Start form.
2. **Direct Upload:** Image is uploaded directly to **Firebase Storage** via Client SDK.
3. **Trigger:** Client invokes a **Server Function** (e.g., refineImageFn) with the new Image URL.
4. **Processing:** The Server Function (running on Cloud Run) calls **Gemini 1.5 Flash**.
   * *Prompt:* "Enhance this handicraft image for e-commerce. Return the enhanced image data."
5. **Result:** Server Function saves the enhanced image to Storage and updates the Product record in MongoDB.

### **3.3 Data Fetching & Caching Strategy**

* **TanStack Query:** Utilized for client-side caching and invalidation.
* **Cost Reduction:**
  * **Server Functions:** Allow us to write backend logic that is called directly from the frontend type-safely, reducing the overhead of managing a separate REST API.
  * **SSR:** Initial data is fetched on the server (Cloud Run) and sent as HTML/JSON, ensuring fast initial loads.

## **4\. Data Design (MongoDB Schema)**

### **4.1 Collection: user (Managed by BetterAuth)**

{
  "\_id": "ObjectId",
  "name": "String",
  "email": "String",
  "emailVerified": "Boolean",
  "image": "String",
  "createdAt": "Date",
  "updatedAt": "Date",
  "role": "Enum \['user', 'admin', 'supplier'\]", // Custom Extension
  "shippingAddress": {                           // Custom Extension
    "street": "String",
    "city": "String",
    "zip": "String",
    "country": "String"
  }
}

### **4.2 Collection: products**

{
  "\_id": "ObjectId",
  "supplierId": "ObjectId (Ref: user)",
  "name": "String",
  "description": "String",
  "pricing": {
    "cost": "Decimal",   // Protected: Visible to Admin only
    "selling": "Decimal" // Public
  },
  "inventory": {
    "onHand": "Integer"
  },
  "images": {
    "original": "URL",
    "enhanced": "URL"
  },
  "status": "Enum \['active', 'draft', 'archived'\]"
}

## **5\. Cost Optimization Strategy (GCP Free Tier)**

| Component                  | GCP Service          | Free Tier Limit              | Optimization Tactic                                                    |
| :------------------------- | :------------------- | :--------------------------- | :--------------------------------------------------------------------- |
| **Unified Compute**  | Cloud Run (Gen 2\)   | 2 Million Requests/mo        | Single service for Frontend/Backend. Scale to Zero.                    |
| **Database**         | MongoDB Atlas        | 512 MB Storage               | Store only text data. Use M0 Sandbox (Shared Cluster).                 |
| **Auth**             | **BetterAuth** | **Free (Open Source)** | Self-hosted. No monthly active user (MAU) fees.                        |
| **Content Delivery** | Firebase Hosting     | 10 GB Transfer/mo            | Serves static assets and caches Cloud Run responses at the edge.       |
| **Storage**          | Firebase Storage     | 5 GB Storage                 | Compress images client-side before upload.                             |
| **AI**               | Gemini API           | Free Tier (Rate Limited)     | Use**Gemini Flash**. Queue requests if rate limit is approached. |

## **6\. Implementation Roadmap**

1. **Phase 1: Infrastructure:** Setup MongoDB Atlas M0. Initialize Google Cloud Project with a single Cloud Run service.
2. **Phase 2: Core Stack:** Initialize **TanStack Start** project. Configure **BetterAuth** and MongoDB connection within the server entry point.
3. **Phase 3: Features:** Implement Guest Checkout (TanStack Form), Supplier Upload (Gemini Integration via Server Functions), and Admin Dashboard.