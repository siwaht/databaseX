// Environment configuration with type safety

export const env = {
    // App
    appName: process.env.NEXT_PUBLIC_APP_NAME || 'VectorHub',
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',

    // API
    apiTimeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
    apiMaxRetries: parseInt(process.env.API_MAX_RETRIES || '3', 10),

    // Feature Flags
    enableAnalytics: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    enableDebugMode: process.env.NEXT_PUBLIC_ENABLE_DEBUG_MODE === 'true',

    // Runtime checks
    isProduction: process.env.NODE_ENV === 'production',
    isDevelopment: process.env.NODE_ENV === 'development',

    // Pica / Weaviate
    picaSecretKey: process.env.PICA_SECRET_KEY || '',
    picaWeaviateConnectionKey: process.env.PICA_WEAVIATE_CONNECTION_KEY || '',
} as const;

// Type-safe environment access
export type Env = typeof env;

