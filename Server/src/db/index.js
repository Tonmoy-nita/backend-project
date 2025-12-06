import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const baseUri = process.env.MONGODB_URI;

        if (!baseUri) {
            throw new Error(
                "MONGODB_URI is not set. Please add it to your environment (e.g., .env)."
            );
        }

        // Build a proper URI: if the provided URI already contains a pathname (db name), use as-is
        // Otherwise, append DB_NAME as the database segment.
        let mongoUri = baseUri;
        try {
            const url = new URL(baseUri);
            // If URL pathname is just '/' (no db) then append DB_NAME
            if (!url.pathname || url.pathname === "/") {
                url.pathname = `/${DB_NAME}`;
                mongoUri = url.toString();
            }
        } catch {
            // If baseUri isn't a valid URL (e.g., mongodb+srv without protocol parsing issues), fallback
            if (!baseUri.endsWith(`/${DB_NAME}`)) {
                mongoUri = `${baseUri.replace(/\/$/, "")}/${DB_NAME}`;
            }
        }

        const connectionInstance = await mongoose.connect(mongoUri, {
            // Mongoose v7+ generally doesn't require these, but kept minimal for clarity
        });

        console.log(
            `\nMongoDB connected. Host: ${connectionInstance.connection.host}, DB: ${connectionInstance.connection.name}`
        );
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

export default connectDB;