import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env");

// Helper to read .env file
function readEnvFile(): Record<string, string> {
    if (!fs.existsSync(ENV_PATH)) {
        return {};
    }
    const content = fs.readFileSync(ENV_PATH, "utf-8");
    const env: Record<string, string> = {};
    content.split("\n").forEach((line) => {
        const [key, ...value] = line.split("=");
        if (key && value) {
            env[key.trim()] = value.join("=").trim();
        }
    });
    return env;
}

// Helper to write .env file
function writeEnvFile(env: Record<string, string>) {
    const content = Object.entries(env)
        .map(([key, value]) => `${key}=${value}`)
        .join("\n");
    fs.writeFileSync(ENV_PATH, content);
}

// Known keys mapping to friendly names and types
const KNOWN_KEYS: Record<string, { name: string; type: string; provider: string }> = {
    OPENAI_API_KEY: { name: "OpenAI API Key", type: "llm", provider: "openai" },
    AI_INTEGRATIONS_OPENAI_API_KEY: { name: "OpenAI API Key (AI Integrations)", type: "llm", provider: "openai" },
    FIRECRAWL_API_KEY: { name: "Firecrawl API Key", type: "scraper", provider: "firecrawl" },
    ANTHROPIC_API_KEY: { name: "Anthropic API Key", type: "llm", provider: "anthropic" },
    COHERE_API_KEY: { name: "Cohere API Key", type: "llm", provider: "cohere" },
    GOOGLE_API_KEY: { name: "Google AI API Key", type: "llm", provider: "google" },
    MISTRAL_API_KEY: { name: "Mistral AI API Key", type: "llm", provider: "mistral" },
    GROQ_API_KEY: { name: "Groq API Key", type: "llm", provider: "groq" },
    TOGETHER_API_KEY: { name: "Together AI API Key", type: "llm", provider: "together" },
    REPLICATE_API_KEY: { name: "Replicate API Key", type: "llm", provider: "replicate" },
    HUGGINGFACE_API_KEY: { name: "Hugging Face API Key", type: "llm", provider: "huggingface" },
    SERPAPI_API_KEY: { name: "SerpAPI API Key", type: "scraper", provider: "serpapi" },
    BROWSERLESS_API_KEY: { name: "Browserless API Key", type: "scraper", provider: "browserless" },
    SCRAPINGBEE_API_KEY: { name: "ScrapingBee API Key", type: "scraper", provider: "scrapingbee" },
    APIFY_API_KEY: { name: "Apify API Key", type: "scraper", provider: "apify" },
    VOYAGEAI_API_KEY: { name: "Voyage AI API Key", type: "embedding", provider: "voyageai" },
    JINA_API_KEY: { name: "Jina AI API Key", type: "embedding", provider: "jina" },
    // Database keys
    MONGODB_URI: { name: "MongoDB Connection", type: "other", provider: "mongodb" },
    // Pica keys
    PICA_SECRET_KEY: { name: "Pica Secret Key", type: "other", provider: "pica" },
    PICA_WEAVIATE_CONNECTION_KEY: { name: "Pica Weaviate Key", type: "other", provider: "pica" },
    PICA_SUPABASE_CONNECTION_KEY: { name: "Pica Supabase Key", type: "other", provider: "pica" },
    PICA_MONGO_DB_ATLAS_CONNECTION_KEY: { name: "Pica MongoDB Key", type: "other", provider: "pica" },
};

export async function GET() {
    try {
        const env = readEnvFile();
        const keys = Object.entries(env)
            .filter(([key]) => KNOWN_KEYS[key] || key.endsWith("_API_KEY") || key.endsWith("_KEY") || key.includes("KEY"))
            .map(([key, value]) => {
                const known = KNOWN_KEYS[key];
                return {
                    id: key,
                    name: known?.name || key,
                    type: known?.type || "other",
                    provider: known?.provider || "custom",
                    key: value,
                    createdAt: new Date(), // We don't track this in .env
                    isActive: true,
                };
            });
        return NextResponse.json(keys);
    } catch (error) {
        return NextResponse.json({ error: "Failed to read keys" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { key, value } = await request.json();

        // Map provider/type to standard env keys if possible
        let envKey = key;
        
        // Provider name to env key mapping
        const providerToEnvKey: Record<string, string> = {
            openai: "OPENAI_API_KEY",
            firecrawl: "FIRECRAWL_API_KEY",
            anthropic: "ANTHROPIC_API_KEY",
            cohere: "COHERE_API_KEY",
            google: "GOOGLE_API_KEY",
            mistral: "MISTRAL_API_KEY",
            groq: "GROQ_API_KEY",
            together: "TOGETHER_API_KEY",
            replicate: "REPLICATE_API_KEY",
            huggingface: "HUGGINGFACE_API_KEY",
            serpapi: "SERPAPI_API_KEY",
            browserless: "BROWSERLESS_API_KEY",
            scrapingbee: "SCRAPINGBEE_API_KEY",
            apify: "APIFY_API_KEY",
            voyageai: "VOYAGEAI_API_KEY",
            jina: "JINA_API_KEY",
        };
        
        // Check if key is a known provider name (case-insensitive)
        const lowerKey = key.toLowerCase();
        if (providerToEnvKey[lowerKey]) {
            envKey = providerToEnvKey[lowerKey];
        } else if (!key.includes("_")) {
            // If it's a simple name without underscores, convert to env key format
            envKey = key.toUpperCase().replace(/\s+/g, "_") + "_API_KEY";
        }

        const env = readEnvFile();
        env[envKey] = value;
        writeEnvFile(env);

        return NextResponse.json({ success: true, key: envKey });
    } catch (error) {
        return NextResponse.json({ error: "Failed to save key" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { key } = await request.json();
        const env = readEnvFile();
        delete env[key];
        writeEnvFile(env);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete key" }, { status: 500 });
    }
}
