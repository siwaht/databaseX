import {
    VectorDBAdapter,
    TestConnectionResult,
    ConnectionStatus,
    CreateCollectionConfig,
    CollectionInfo,
    UpdateCollectionConfig,
    CollectionStats,
    VectorDocument,
    MetadataFilter,
    SearchQuery,
    SearchResult,
    DatabaseInfo
} from "./base";
import { ConnectionConfig, VectorDBType } from "@/types/connections";

export class MockAdapter implements VectorDBAdapter {
    type: VectorDBType;
    private status: ConnectionStatus = 'disconnected';
    private collections: Map<string, CollectionInfo & { documents: VectorDocument[] }> = new Map();

    constructor(type: VectorDBType = 'chromadb') {
        this.type = type;
    }

    private matchesFilter(metadata: Record<string, any>, filter?: MetadataFilter): boolean {
        if (!filter) return true;

        return Object.entries(filter).every(([key, value]) => {
            const current = (metadata ?? {})[key];

            if (Array.isArray(value)) {
                if (!Array.isArray(current)) return false;
                return value.every((v) => current.includes(v));
            }

            return current === value;
        });
    }

    async connect(config: ConnectionConfig): Promise<void> {
        console.log(`Mock connecting to ${config.name}...`);
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate latency
        this.status = 'connected';
    }

    async disconnect(): Promise<void> {
        this.status = 'disconnected';
    }

    async testConnection(): Promise<TestConnectionResult> {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true, message: 'Connected to Mock DB' };
    }

    getConnectionStatus(): ConnectionStatus {
        return this.status;
    }

    async listDatabases(): Promise<DatabaseInfo[]> {
        return [{ name: 'default' }];
    }

    async createCollection(config: CreateCollectionConfig): Promise<CollectionInfo> {
        const info: CollectionInfo = {
            name: config.name,
            dimensions: config.dimensions,
            distanceMetric: config.distanceMetric,
            documentCount: 0
        };
        this.collections.set(config.name, { ...info, documents: [] });
        return info;
    }

    async listCollections(): Promise<CollectionInfo[]> {
        return Array.from(this.collections.values()).map(({ documents, ...info }) => info);
    }

    async getCollection(name: string): Promise<CollectionInfo> {
        const col = this.collections.get(name);
        if (!col) throw new Error(`Collection ${name} not found`);
        const { documents, ...info } = col;
        return info;
    }

    async updateCollection(name: string, updates: UpdateCollectionConfig): Promise<void> {
        // Mock update
    }

    async deleteCollection(name: string, cascade?: boolean): Promise<void> {
        this.collections.delete(name);
    }

    async getCollectionStats(name: string): Promise<CollectionStats> {
        const col = this.collections.get(name);
        if (!col) throw new Error(`Collection ${name} not found`);
        return {
            vectorCount: col.documents.length,
            indexSize: col.documents.length * 1024, // Mock size
            lastUpdated: new Date()
        };
    }

    async addDocuments(collection: string, documents: VectorDocument[]): Promise<string[]> {
        const col = this.collections.get(collection);
        if (!col) throw new Error(`Collection ${collection} not found`);

        const ids = documents.map(doc => doc.id || Math.random().toString(36).substring(7));
        const newDocs = documents.map((doc, i) => ({ ...doc, id: ids[i] }));

        col.documents.push(...newDocs);
        col.documentCount = col.documents.length;

        return ids;
    }

    async getDocuments(collection: string, ids: string[]): Promise<VectorDocument[]> {
        const col = this.collections.get(collection);
        if (!col) throw new Error(`Collection ${collection} not found`);
        return col.documents.filter(doc => doc.id && ids.includes(doc.id));
    }

    async updateDocuments(collection: string, documents: Partial<VectorDocument>[]): Promise<void> {
        const col = this.collections.get(collection);
        if (!col) throw new Error(`Collection ${collection} not found`);

        const updatesById = new Map(
            documents
                .filter((doc): doc is Partial<VectorDocument> & { id: string } => typeof doc.id === 'string')
                .map((doc) => [doc.id, doc])
        );

        if (updatesById.size === 0) return;

        col.documents = col.documents.map((existing) => {
            if (!existing.id) return existing;
            const update = updatesById.get(existing.id);
            return update ? { ...existing, ...update } : existing;
        });
    }

    async deleteDocuments(collection: string, ids: string[]): Promise<void> {
        const col = this.collections.get(collection);
        if (!col) throw new Error(`Collection ${collection} not found`);
        col.documents = col.documents.filter(doc => doc.id && !ids.includes(doc.id));
        col.documentCount = col.documents.length;
    }

    async countDocuments(collection: string, filter?: MetadataFilter): Promise<number> {
        const col = this.collections.get(collection);
        if (!col) throw new Error(`Collection ${collection} not found`);

        if (!filter) return col.documents.length;

        return col.documents.filter((doc) => this.matchesFilter(doc.metadata, filter)).length;
    }

    async search(collection: string, query: SearchQuery): Promise<SearchResult[]> {
        const col = this.collections.get(collection);
        if (!col) throw new Error(`Collection ${collection} not found`);

        const text = query.text?.toLowerCase().trim();

        const filteredDocuments = col.documents.filter((doc) => {
            if (!this.matchesFilter(doc.metadata, query.filter)) {
                return false;
            }

            if (!text) return true;

            const contentMatch = doc.content.toLowerCase().includes(text);
            const source = (doc.metadata?.source as string | undefined)?.toLowerCase();
            const sourceMatch = source ? source.includes(text) : false;

            return contentMatch || sourceMatch;
        });

        const scored = filteredDocuments.map<SearchResult>((doc) => ({
            id: doc.id!,
            score: 0.7 + Math.random() * 0.3, // Mock score between 0.7 and 1.0
            content: query.includeContent ? doc.content : undefined,
            metadata: query.includeMetadata ? doc.metadata : undefined,
        }));

        const threshold = query.minScore ?? 0;

        return scored
            .filter((result) => result.score >= threshold)
            .sort((a, b) => b.score - a.score)
            .slice(0, query.topK);
    }
}
