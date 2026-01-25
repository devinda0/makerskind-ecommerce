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
                    // We set input false in app, but here we don't care, 
                    // we will update manually anyway.
                }
            }
        }
    });

    const email = "supplier@makerskind.com";
    const password = "password123";
    const name = "Demo Supplier";

    console.log(`Seeding supplier account: ${email}`);

    // check if user exists in db directly
    const user = await db.collection("user").findOne({ email });

    if (user) {
        console.log("User already exists. Updating role to 'supplier'...");
        await db.collection("user").updateOne(
            { _id: user._id },
            { $set: { role: "supplier" } }
        );
    } else {
        console.log("Creating new user...");
        try {
            // Create user via auth to handle hashing
            // We ignore the returned session/user struct diffs
            await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name,
                }
            });
            
            // Now update the role manually because input might be restricted or default is user
            await db.collection("user").updateOne(
                { email },
                { $set: { role: "supplier" } }
            );
            console.log("User created and role set to 'supplier'.");
        } catch (error) {
            console.error("Failed to create user:", error);
        }
    }
    
    console.log("Done.");
    console.log(`Credentials: ${email} / ${password}`);

    await client.close();
}

main().catch(console.error);
