const fs = require('fs');
const path = require('path');

async function generateEmbedding(text) {
    let apiKey = process.env.OPENAI_API_KEY;

    // Manual .env reading
    if (!apiKey) {
        try {
            const envPath = path.join(process.cwd(), '.env');
            if (fs.existsSync(envPath)) {
                console.log("Reading .env file from:", envPath);
                const envContent = fs.readFileSync(envPath, 'utf-8');
                const match = envContent.match(/OPENAI_API_KEY=(.*)/);
                if (match && match[1]) {
                    apiKey = match[1].trim();
                    console.log("Found API key in .env");
                } else {
                    console.log("OPENAI_API_KEY not found in .env file content");
                }
            } else {
                console.log(".env file not found at:", envPath);
            }
        } catch (error) {
            console.warn("Failed to read .env file manually", error);
        }
    }

    if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not set");
    }

    console.log("Using API Key (last 4 chars):", apiKey.slice(-4));

    try {
        const response = await fetch("https://api.openai.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model: "text-embedding-3-small",
                input: text.replace(/\n/g, " "),
            }),
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.data[0].embedding;
    } catch (error) {
        console.error("Embedding generation failed:", error);
        throw error;
    }
}

async function test() {
    try {
        console.log("Starting test...");
        const vector = await generateEmbedding("Test query");
        console.log("Success! Vector generated.");
        console.log("Vector length:", vector.length);
    } catch (error) {
        console.error("Test failed:", error.message);
    }
}

test();
