import { generateEmbedding } from "../src/lib/embeddings";
import dotenv from "dotenv";
import path from "path";

// Load env vars manually to simulate what Next.js does (or what my fallback does)
dotenv.config({ path: path.join(process.cwd(), ".env") });

async function test() {
    console.log("Testing embedding generation...");
    console.log("Current working directory:", process.cwd());
    console.log("OPENAI_API_KEY present:", !!process.env.OPENAI_API_KEY);

    if (process.env.OPENAI_API_KEY) {
        console.log("Key length:", process.env.OPENAI_API_KEY.length);
        console.log("Key prefix:", process.env.OPENAI_API_KEY.substring(0, 7));
    }

    try {
        const vector = await generateEmbedding("Test query");
        console.log("Success! Vector length:", vector.length);
        console.log("First 5 dimensions:", vector.slice(0, 5));
    } catch (error) {
        console.error("Failed:", error);
    }
}

test();
