
// Export user role type for use across the application
export type UserRole = "user" | "admin" | "supplier";

// ShippingAddress interface for type-safe address handling
export interface ShippingAddress {
    street: string;
    city: string;
    zip: string;
    country: string;
}
