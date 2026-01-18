import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import clientPromise from "./db";

const client = await clientPromise;
const db = client.db();

export const auth = betterAuth({
    database: mongodbAdapter(db),
    emailAndPassword: {
        enabled: true,
    },
    user: {
        additionalFields: {
            role: {
                type: ["user", "admin", "supplier"] as const,
                required: false,
                defaultValue: "user",
                input: false, // Users cannot set their own role during signup
            },
            shippingAddress: {
                type: "string", // JSON string for address object
                required: false,
            },
        },
    },
});

// Export user role type for use across the application
export type UserRole = "user" | "admin" | "supplier";

// ShippingAddress interface for type-safe address handling
export interface ShippingAddress {
    street: string;
    city: string;
    zip: string;
    country: string;
}
