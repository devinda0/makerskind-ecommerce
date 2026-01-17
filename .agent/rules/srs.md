---
trigger: always_on
---

# **System Requirements Specification (SRS) for Makerskind**

Version: 1.1
Date: January 17, 2026
Project: Makerskind E-Commerce Platform

## **1\. Introduction**

### **1.1 Purpose**

The purpose of this document is to define the functional and non-functional requirements for "Makerskind," an e-commerce website dedicated to selling handicraft items. This document serves as a guide for developers, designers, and stakeholders.

### **1.2 Scope**

Makerskind is a web-based application that facilitates the buying and selling of handicrafts. The system supports three distinct user roles: Customers (Users), Administrators, and Suppliers. It includes inventory management, order processing, AI-driven image enhancement, and financial reporting features using a MongoDB database.

## **2\. Overall Description**

### **2.1 User Characteristics**

The system interacts with three primary actors:

1. **User (Customer):** The end-buyer of the handicraft items. They can browse and purchase items with or without an account.
2. **Admin:** The super-user responsible for managing the entire platform, including finances, total inventory, and comprehensive statistics.
3. **Supplier:** A vendor who provides products. They have limited management capabilities focused on their own inventory and sales.

### **2.2 Product Perspective**

The application will be a web-based interface accessible via standard browsers. It uses a MongoDB database for data storage and integrates with the Gemini AI model for media processing.

## **3\. Functional Requirements**

### **3.1 Authentication & Authorization Module**

* **FR-AUTH-01: Guest Access:** Users must be able to browse products and complete purchases (checkout) without logging in.
* **FR-AUTH-02: User Registration/Login:** Users can create an account to save personal details.
* **FR-AUTH-03: Role-Based Access Control:** The system must distinguish between User, Admin, and Supplier accounts and restrict access to pages accordingly.

### **3.2 User (Customer) Module**

* **FR-USER-01: Profile Management:** Logged-in users can save and manage their details, specifically the **shipping address**, to speed up future checkouts.
* **FR-USER-02: Purchasing:** Users can add items to a cart and proceed to checkout.
* **FR-USER-03: Cart Interaction:** The shopping cart should be accessible as a **popup** (not a separate page load for viewing).

### **3.3 Admin Module**

* **FR-ADMIN-01: Financial Overview:** Admins must have visibility of:
  * Total Income.
  * Total Revenue.
  * Total Cost.
* **FR-ADMIN-02: Full Inventory Management:** Admins can view the complete item list, including both **Cost Price** and **Selling Price**.
* **FR-ADMIN-03: Global Management:** Admins have full CRUD (Create, Read, Update, Delete) rights over products and system settings ("Everything should be manageable").
* **FR-ADMIN-04: Order Management:** View all orders placed on the system.
* **FR-ADMIN-05: Statistics:** Access to comprehensive system statistics (marked as Optional in initial scope).

### **3.4 Supplier Module**

* **FR-SUPP-01: Inventory Management (Minimal):**
  * Add new items.
  * Update available quantity of existing items.
* **FR-SUPP-02: Order Visibility:** View orders relevant to their products.
* **FR-SUPP-03: Financials:** View their specific income and basic statistics.
* **FR-SUPP-04: AI Image Refinement:** The system must utilize the **Gemini Image Model** to automatically process, refine, and enhance raw images uploaded by suppliers. This ensures consistent, high-quality product visuals across the platform.

## **4\. System Interfaces & Page Structure**

### **4.1 Public Pages**

These pages are accessible to all visitors:

1. **Home Page:** Landing page showcasing featured items.
2. **Products Page:** List view of available handicrafts.
3. **Cart:** Implemented as a Popup.
4. **Checkout Page:** For finalizing purchases.
5. **Profile Page:** For registered users to manage addresses.
6. **Info Pages:**
   * Terms & Conditions.
   * Refund Policies.

### **4.2 Admin Pages**

Accessible only to Admin users:

1. **Inventory (Full):** Comprehensive list including cost/selling prices.
2. **Product Management:** General oversight of products.
3. **Product Customize Page:** For editing product details.
4. **Add Product Page:** Form to create new inventory items.
5. **Orders:** Master list of all customer orders.
6. **Statistics:** (Optional) Visual data representation.

### **4.3 Supplier Pages**

Accessible only to Supplier users:

1. **Inventory (Minimal):** Simplified view for stock management.
2. **Add Product Page:** Interface to list new items. Includes an **AI Refine** step where uploaded images are processed by the Gemini model before final submission.
3. **Orders:** View orders for their specific items.

## **5\. Data Requirements**

### **5.1 Database Schema (MongoDB)**

The system will utilize MongoDB with the following primary collections:

1. **Users:** Stores customer, admin, and supplier authentication and profile data (including saved addresses).
2. **Product:** Stores item details (Name, Cost Price, Selling Price, Quantity, Supplier ID, Description, Image URL).
3. **Orders:** Stores transaction details (User ID, Product IDs, Status, Payment Info).
4. **Logs:** Stores system activity logs for auditing.

## **6\. Non-Functional Requirements**

* **NFR-01: Usability:** The checkout process must be streamlined for both guests and registered users.
* **NFR-02: Security:** Password data must be encrypted. Admin financial data (Cost Price) must be strictly hidden from public and unauthorized supplier views.
* **NFR-03: Performance:** AI image processing should occur asynchronously or with a loading indicator to prevent blocking the user interface during product upload.