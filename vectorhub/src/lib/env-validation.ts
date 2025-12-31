import { z } from "zod";

/**
 * Environment variable validation schema
 * Validates required environment variables at startup
 */
const envSchema = z.object({
    // Required for authentication
    NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
    NEXTAUTH_URL: z.string().url().optional(),

    // Database (optional - app works without it)
    DATABASE_URL: z.string().optional(),
    MONGODB_URI: z.string().optional(),

    // OpenAI for embeddings (optional)
    OPENAI_API_KEY: z.string().optional(),

    // Node environment
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),

    // Logging
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables and returns typed env object
 * Throws error if required variables are missing
 */
export function validateEnv(): Env {
    const result = envSchema.safeParse(process.env);

    if (!result.success) {
        const errors = result.error.errors
            .map((e: { path: (string | number)[]; message: string }) => `  - ${e.path.join(".")}: ${e.message}`)
            .join("\n");

        console.error("❌ Environment validation failed:\n" + errors);

        // In production, throw error to prevent startup with invalid config
        if (process.env.NODE_ENV === "production") {
            throw new Error("Invalid environment configuration");
        }

        // In development, warn but continue
        console.warn("⚠️ Continuing with invalid environment in development mode");
    }

    return result.data || ({} as Env);
}

/**
 * Check if a specific feature is enabled based on env vars
 */
export const features = {
    hasOpenAI: () => !!process.env.OPENAI_API_KEY,
    hasDatabase: () => !!process.env.DATABASE_URL,
    hasMongoDB: () => !!process.env.MONGODB_URI,
    isProduction: () => process.env.NODE_ENV === "production",
};
