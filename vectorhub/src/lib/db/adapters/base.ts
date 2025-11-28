import { ConnectionConfig, VectorDBType } from "@/types/connections";

export interface VectorDBAdapter {
    type: VectorDBType;

    // Connection management
    connect(config: ConnectionConfig): Promise<void>;
    disconnect(): Promise<void>;
    testConnection(): Promise<TestConnectionResult>;
    getConnectionStatus(): ConnectionStatus;

    // Database/Namespace operations
    createDatabase?(name: string, options?: CreateDatabaseOptions): Promise<void>;
    listDatabases?(): Promise<DatabaseInfo[]>;
    deleteDatabase?(name: string): Promise<void>;

    // Collection operations
    createCollection(config: CreateCollectionConfig): Promise<CollectionInfo>;
    listCollections(): Promise<CollectionInfo[]>;
    getCollection(name: string): Promise<CollectionInfo>;
    updateCollection(name: string, updates: UpdateCollectionConfig): Promise<void>;
    deleteCollection(name: string, cascade?: boolean): Promise<void>;
    getCollectionStats(name: string): Promise<CollectionStats>;

    // Document/Vector operations
    addDocuments(collection: string, documents: VectorDocument[]): Promise<string[]>;
    getDocuments(collection: string, ids: string[]): Promise<VectorDocument[]>;
    updateDocuments(collection: string, documents: Partial<VectorDocument>[]): Promise<void>;
    deleteDocuments(collection: string, ids: string[]): Promise<void>;
    countDocuments(collection: string, filter?: MetadataFilter): Promise<number>;

    // Search operations
    search(collection: string, query: SearchQuery): Promise<SearchResult[]>;
    hybridSearch?(collection: string, query: HybridSearchQuery): Promise<SearchResult[]>;
}

export interface TestConnectionResult {
    success: boolean;
    message: string;
}

export type ConnectionStatus = 'connected' | 'disconnected' | 'error';

export interface CreateDatabaseOptions {
    [key: string]: any;
}

export interface DatabaseInfo {
    name: string;
    size?: number;
}

export interface CollectionInfo {
    name: string;
    dimensions: number;
    distanceMetric: string;
    documentCount: number;
}

export interface CreateCollectionConfig {
    name: string;
    description?: string;
    dimensions: number;
    distanceMetric: 'cosine' | 'euclidean' | 'dot_product';
    indexType?: 'hnsw' | 'flat' | 'ivf';
    indexOptions?: Record<string, any>;
    metadataSchema?: MetadataSchema;
}

export interface UpdateCollectionConfig {
    description?: string;
    metadataSchema?: MetadataSchema;
}

export interface CollectionStats {
    vectorCount: number;
    indexSize: number;
    lastUpdated: Date;
}

export interface VectorDocument {
    id?: string;
    content: string;
    embedding?: number[];
    metadata: Record<string, any>;
}

export interface MetadataFilter {
    [key: string]: any;
}

export interface SearchQuery {
    vector?: number[];
    text?: string;
    topK: number;
    minScore?: number;
    filter?: MetadataFilter;
    includeMetadata?: boolean;
    includeContent?: boolean;
}

export interface HybridSearchQuery extends SearchQuery {
    alpha?: number; // Weight between dense and sparse search
}

export interface SearchResult {
    id: string;
    score: number;
    content?: string;
    metadata?: Record<string, any>;
}

export interface MetadataSchema {
    [key: string]: {
        type: 'string' | 'number' | 'boolean' | 'date' | 'string[]';
        index: boolean;
    };
}
