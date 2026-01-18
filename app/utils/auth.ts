
// Export user role type for use across the application
export type UserRole = "user" | "admin" | "supplier";

// ShippingAddress interface for type-safe address handling
export interface ShippingAddress {
    street: string;
    city: string;
    zip: string;
    country: string;
}

// Extended user type that includes anonymous users
export interface ExtendedUser {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    shippingAddress: string | null;
    emailVerified: boolean;
    isAnonymous?: boolean;
    createdAt: Date;
    updatedAt: Date;
}
