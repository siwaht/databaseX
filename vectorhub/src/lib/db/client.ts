import { MockAdapter } from "./adapters/mock-adapter";
import { WebhookAdapter } from "./adapters/webhook-adapter";
import { MCPAdapter } from "./adapters/mcp-adapter";
import type {
    VectorDBAdapter,
    CreateCollectionConfig,
    VectorDocument,
    SearchQuery,
    SearchResult,
    CollectionInfo,
    DatabaseInfo,
    CollectionStats,
    UpdateCollectionConfig,
} from "./adapters/base";
import type { ConnectionConfig, VectorDBType } from "@/types/connections";

function createAdapter(type: VectorDBType): VectorDBAdapter {
    switch (type) {
        case "webhook":
            return new WebhookAdapter();
        case "mcp":
            return new MCPAdapter();
        default:
            return new MockAdapter();
    }
}

export class VectorDBClient {
    private adapter: VectorDBAdapter;
    private connectionPromise: Promise<void> | null = null;
    private config: ConnectionConfig | null = null;

    constructor(config?: ConnectionConfig) {
        if (config) {
            this.config = config;
            this.adapter = createAdapter(config.type);
            // Start connection - will be awaited in ensureConnected
            this.connectionPromise = this.adapter.connect(config);
        } else {
            this.adapter = new MockAdapter();
        }
    }

    // Ensure connection is established before operations
    private async ensureConnected(): Promise<void> {
        if (this.connectionPromise) {
            await this.connectionPromise;
            this.connectionPromise = null;
        }
    }

    // Proxy methods to the active adapter

    async connect(config: ConnectionConfig): Promise<void> {
        this.config = config;
        this.adapter = createAdapter(config.type);
        await this.adapter.connect(config);
    }

    async disconnect(): Promise<void> {
        await this.adapter.disconnect();
    }

    getConnectionStatus() {
        return this.adapter.getConnectionStatus();
    }

    async testConnection() {
        await this.ensureConnected();
        return this.adapter.testConnection();
    }

    async listDatabases(): Promise<DatabaseInfo[]> {
        await this.ensureConnected();
        return this.adapter.listDatabases?.() ?? Promise.resolve([]);
    }

    async listCollections(): Promise<CollectionInfo[]> {
        await this.ensureConnected();
        return this.adapter.listCollections();
    }

    async createCollection(config: CreateCollectionConfig): Promise<CollectionInfo> {
        await this.ensureConnected();
        return this.adapter.createCollection(config);
    }

    async getCollection(name: string): Promise<CollectionInfo> {
        await this.ensureConnected();
        return this.adapter.getCollection(name);
    }

    async updateCollection(name: string, updates: UpdateCollectionConfig): Promise<void> {
        await this.ensureConnected();
        return this.adapter.updateCollection(name, updates);
    }

    async deleteCollection(name: string, cascade?: boolean): Promise<void> {
        await this.ensureConnected();
        return this.adapter.deleteCollection(name, cascade);
    }

    async getCollectionStats(name: string): Promise<CollectionStats> {
        await this.ensureConnected();
        return this.adapter.getCollectionStats(name);
    }

    async addDocuments(collection: string, documents: VectorDocument[]): Promise<string[]> {
        await this.ensureConnected();
        return this.adapter.addDocuments(collection, documents);
    }

    async deleteDocuments(collection: string, ids: string[]): Promise<void> {
        await this.ensureConnected();
        return this.adapter.deleteDocuments(collection, ids);
    }

    async search(collection: string, query: SearchQuery): Promise<SearchResult[]> {
        await this.ensureConnected();
        return this.adapter.search(collection, query);
    }
}

export const dbClient = new VectorDBClient();
export const mockDbClient = dbClient;
