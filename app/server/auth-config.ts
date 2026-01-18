
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import clientPromise from "./db/mongo";

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
        signUpEmail: async (opts: { body: any; headers: Headers }) => {
            const authInstance = await getAuth();
            return authInstance.api.signUpEmail(opts);
        },
        signInEmail: async (opts: { body: any; headers: Headers }) => {
            const authInstance = await getAuth();
            return authInstance.api.signInEmail(opts);
        },
        signOut: async (opts: { headers: Headers }) => {
            const authInstance = await getAuth();
            return authInstance.api.signOut(opts);
        },
        getSession: async (opts: { headers: Headers }) => {
            const authInstance = await getAuth();
            return authInstance.api.getSession(opts);
        },
    },
};
