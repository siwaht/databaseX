import fs from 'fs';
import path from 'path';

const ENV_PATH = path.join(process.cwd(), '.env');

/**
 * Reads environment variables directly from the .env file.
 * This ensures we get the latest values even if they were updated at runtime
 * and process.env is stale (which requires a restart to update).
 */
export function getDynamicEnvRaw(): Record<string, string> {
    try {
        if (!fs.existsSync(ENV_PATH)) {
            return {};
        }
        const content = fs.readFileSync(ENV_PATH, 'utf-8');
        const env: Record<string, string> = {};
        content.split('\n').forEach((line) => {
            const [key, ...value] = line.split('=');
            if (key && value) {
                const trimmedKey = key.trim();
                let trimmedValue = value.join('=').trim();

                // Remove quotes if present
                if (trimmedValue.startsWith('"') && trimmedValue.endsWith('"')) {
                    trimmedValue = trimmedValue.slice(1, -1);
                } else if (trimmedValue.startsWith("'") && trimmedValue.endsWith("'")) {
                    trimmedValue = trimmedValue.slice(1, -1);
                }

                env[trimmedKey] = trimmedValue;
            }
        });
        return env;
    } catch (error) {
        // In environments where fs is restricted (Vercel edge, etc.), fallback to empty
        return {};
    }
}

/**
 * Gets an environment variable, preferring the .env file content over process.env.
 * This allows for runtime updates via the UI.
 */
export function getDynamicEnv(key: string): string | undefined {
    // 1. Try reading from .env file (most up-to-date for local dev/runtime edits)
    const fileEnv = getDynamicEnvRaw();
    if (fileEnv[key]) {
        return fileEnv[key];
    }

    // 2. Fallback to process.env (for production/CI where .env might not exist or be used)
    return process.env[key];
}

// Helpers for specific Pica keys
export const dynamicPicaConfig = {
    get secretKey() { return getDynamicEnv('PICA_SECRET_KEY') || ''; },
    get weaviateKey() { return getDynamicEnv('PICA_WEAVIATE_CONNECTION_KEY') || ''; },
    get supabaseKey() { return getDynamicEnv('PICA_SUPABASE_CONNECTION_KEY') || ''; },
    get mongoKey() { return getDynamicEnv('PICA_MONGO_DB_ATLAS_CONNECTION_KEY') || ''; },
};
