
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { anonymous } from "better-auth/plugins";
import clientPromise from "./db/mongo";
import { mergeGuestCart } from "./cart-utils";

// --- Better Auth Configuration (Server Side Only) ---

// Lazy initialization
let _auth: ReturnType<typeof betterAuth> | null = null;

async function createAuth() {
    const client = await clientPromise;
    const db = client.db();
    
    return betterAuth({
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
                    input: false,
                },
                shippingAddress: {
                    type: "string", 
                    required: false,
                },
            },
        },
        plugins: [
            anonymous({
                emailDomainName: "guest.makerskind.com",
                onLinkAccount: async ({ anonymousUser, newUser }) => {
                    // Merge guest cart into the new user's cart
                    await mergeGuestCart(anonymousUser.user.id, newUser.user.id);
                },
            }),
        ],
    });
}

export async function getAuth() {
    if (!_auth) {
        _auth = await createAuth();
    }
    return _auth;
}

// Helper object for direct API access (server-side only)
export const auth = {
    api: {
        signUpEmail: async (opts: any) => {
            const authInstance = await getAuth();
            return authInstance.api.signUpEmail(opts);
        },
        signInEmail: async (opts: any) => {
            const authInstance = await getAuth();
            return authInstance.api.signInEmail(opts);
        },
        signOut: async (opts: any) => {
            const authInstance = await getAuth();
            return authInstance.api.signOut(opts);
        },
        getSession: async (opts: any) => {
            const authInstance = await getAuth();
            return authInstance.api.getSession(opts);
        },
        signInAnonymous: async (opts: any) => {
            const authInstance = await getAuth();
            // @ts-expect-error - anonymous plugin adds this method
            return authInstance.api.signInAnonymous(opts);
        },
        deleteAnonymousUser: async (opts: any) => {
            const authInstance = await getAuth();
            // @ts-expect-error - anonymous plugin adds this method
            return authInstance.api.deleteAnonymousUser(opts);
        },
    },
};
