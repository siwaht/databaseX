export type VectorDBType =
    | 'chromadb'
    | 'mongodb_atlas'
    | 'supabase'
    | 'weaviate'
    | 'pinecone'
    | 'qdrant'
    | 'redis'
    | 'upstash';

export interface ConnectionConfig {
    id: string;
    name: string;
    type: VectorDBType;
    status: 'connected' | 'disconnected' | 'error';
    lastSync: Date;
    config:
    | ChromaDBConfig
    | MongoDBAtlasConfig
    | SupabaseConfig
    | WeaviateConfig
    | PineconeConfig
    | QdrantConfig
    | RedisConfig
    | UpstashConfig;
}

export interface MongoDBAtlasConfig {
    connectionString: string;
    database: string;
    vectorSearchIndexName: string;
    embeddingField: string;
    dimensions: number;
}

export interface SupabaseConfig {
    projectUrl: string;
    anonKey: string;
    serviceRoleKey?: string;
    schema: string;
}

export interface ChromaDBConfig {
    host: string;
    port: number;
    authToken?: string;
    tenant?: string;
    database?: string;
}

export interface WeaviateConfig {
    host: string;
    scheme: 'http' | 'https';
    apiKey?: string;
    headers?: Record<string, string>;
}

export interface PineconeConfig {
    apiKey: string;
    environment: string;
    projectId?: string;
}

export interface QdrantConfig {
    host: string;
    port: number;
    apiKey?: string;
    https: boolean;
}

export interface RedisConfig {
    host: string;
    port: number;
    password?: string;
    username?: string;
    tls: boolean;
}

export interface UpstashConfig {
    url: string;
    token: string;
}
