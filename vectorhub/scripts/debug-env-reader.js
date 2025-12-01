const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(process.cwd(), ".env");

console.log("ENV_PATH:", ENV_PATH);

function readEnvFile() {
    if (!fs.existsSync(ENV_PATH)) {
        console.log("File does not exist");
        return {};
    }
    const content = fs.readFileSync(ENV_PATH, "utf-8");
    console.log("Raw Content Length:", content.length);
    console.log("Raw Content Preview:", content.substring(0, 50));

    const env = {};
    content.split("\n").forEach((line, index) => {
        const [key, ...value] = line.split("=");
        if (key && value.length > 0) {
            env[key.trim()] = value.join("=").trim();
            console.log(`Line ${index}: Parsed key '${key.trim()}'`);
        } else {
            console.log(`Line ${index}: Skipped (key='${key}', valueLen=${value.length})`);
        }
    });
    return env;
}

const KNOWN_KEYS = {
    OPENAI_API_KEY: { name: "OpenAI API Key", type: "llm", provider: "openai" },
    FIRECRAWL_API_KEY: { name: "Firecrawl API Key", type: "scraper", provider: "firecrawl" },
};

const env = readEnvFile();
const keys = Object.entries(env)
    .filter(([key]) => KNOWN_KEYS[key] || key.endsWith("_API_KEY"))
    .map(([key, value]) => {
        const known = KNOWN_KEYS[key];
        return {
            id: key,
            name: known?.name || key,
            type: known?.type || "other",
            provider: known?.provider || "custom",
            key: value,
        };
    });

console.log("Found Keys:", JSON.stringify(keys, null, 2));
