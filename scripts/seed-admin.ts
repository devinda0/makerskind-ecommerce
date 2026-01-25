import 'dotenv/config'
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { MongoClient } from 'mongodb'

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("Missing MONGODB_URI");

    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db();

    // Initialize minimal auth to use hashing/signup logic
    const auth = betterAuth({
        database: mongodbAdapter(db),
        emailAndPassword: { enabled: true },
        user: {
            additionalFields: {
                role: {
                    type: "string",
                    required: false,
                    defaultValue: "user",
                }
            }
        }
    });

    const email = "admin@makerskind.com";
    const password = "password123";
    const name = "System Admin";

    console.log(`Seeding admin account: ${email}`);

    // check if user exists in db directly
    const user = await db.collection("user").findOne({ email });

    if (user) {
        console.log("User already exists. Updating role to 'admin'...");
        await db.collection("user").updateOne(
            { _id: user._id },
            { $set: { role: "admin" } }
        );
    } else {
        console.log("Creating new user...");
        try {
            await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                }
            });
            
            // Now update the role manually
            await db.collection("user").updateOne(
                { email },
                { $set: { role: "admin" } }
            );
            console.log("User created and role set to 'admin'.");
        } catch (error) {
            console.error("Failed to create user:", error);
        }
    }
    
    console.log("Done.");
    console.log(`Credentials: ${email} / ${password}`);

    await client.close();
}

main().catch(console.error);
