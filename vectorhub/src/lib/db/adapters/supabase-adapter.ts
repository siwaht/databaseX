import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { ConnectionConfig, SupabaseConfig } from "@/types/connections";
import {
    VectorDBAdapter,
    ConnectionStatus,
    TestConnectionResult,
    CreateCollectionConfig,
    CollectionInfo,
    CollectionStats,
    VectorDocument,
    SearchQuery,
    SearchResult,
    UpdateCollectionConfig,
    MetadataFilter,
} from "./base";

export class SupabaseAdapter implements VectorDBAdapter {
    type = "supabase" as const;
    private client: SupabaseClient | null = null;
    private config: SupabaseConfig | null = null;
    private status: ConnectionStatus = "disconnected";

    async connect(config: ConnectionConfig): Promise<void> {
        this.config = config.config as SupabaseConfig;
        try {
            this.client = createClient(this.config.projectUrl, this.config.anonKey, {
                db: { schema: (this.config.schema || "public") as any },
            });
            this.status = "connected";
        } catch (error) {
            this.status = "error";
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        this.client = null;
        this.status = "disconnected";
    }

    async testConnection(): Promise<TestConnectionResult> {
        try {
            if (!this.client) {
                return { success: false, message: "Client not initialized" };
            }
            // Simple query to test connection
            const { error } = await this.client.from("information_schema.tables").select("count").limit(1);
            if (error) throw error;
            return { success: true, message: "Supabase connection successful" };
        } catch (error) {
            return { success: false, message: `Connection failed: ${(error as Error).message}` };
        }
    }

    getConnectionStatus(): ConnectionStatus {
        return this.status;
    }

    async listCollections(): Promise<CollectionInfo[]> {
        if (!this.client) throw new Error("Not connected");

        // Query information_schema to find tables with 'vector' columns
        const { data, error } = await this.client
            .from("information_schema.columns")
            .select("table_name, column_name, udt_name")
            .eq("table_schema", this.config?.schema || "public")
            .eq("udt_name", "vector");

        if (error) {
            console.error("Failed to list collections:", error);
            // Fallback: try to list all tables if permission denied on information_schema
            // This is less accurate as we can't be sure they are vector tables
            return [];
        }

        const collections: CollectionInfo[] = [];
        const processedTables = new Set<string>();

        for (const row of data || []) {
            const tableName = row.table_name;
            if (processedTables.has(tableName)) continue;
            processedTables.add(tableName);

            // Get approximate row count
            const { count } = await this.client
                .from(tableName)
                .select("*", { count: "exact", head: true });

            collections.push({
                name: tableName,
                dimensions: 0, // Hard to get without inspecting the column definition string or data
                distanceMetric: "cosine", // Default assumption
                documentCount: count || 0,
            });
        }

        return collections;
    }

    async createCollection(config: CreateCollectionConfig): Promise<CollectionInfo> {
        if (!this.client) throw new Error("Not connected");

        // We can't easily create tables via the JS client unless we use a stored procedure
        // or the user has very high privileges and we use raw SQL (rpc).
        // For now, we'll try to use an RPC call if it exists, or throw a helpful error.

        try {
            // Try to call a helper function 'create_vector_table' if it exists
            const { error } = await this.client.rpc("create_vector_table", {
                table_name: config.name,
                dimensions: config.dimensions,
                distance_metric: config.distanceMetric
            });

            if (error) throw error;

            return {
                name: config.name,
                dimensions: config.dimensions,
                distanceMetric: config.distanceMetric,
                documentCount: 0
            };
        } catch (error) {
            throw new Error("To create collections, please create a table in Supabase with a 'vector' column, or ensure a 'create_vector_table' RPC function exists.");
        }
    }

    async getCollection(name: string): Promise<CollectionInfo> {
        if (!this.client) throw new Error("Not connected");

        // Verify table exists and has vector column
        const { data, error } = await this.client
            .from("information_schema.columns")
            .select("column_name")
            .eq("table_schema", this.config?.schema || "public")
            .eq("table_name", name)
            .eq("udt_name", "vector")
            .single();

        if (error || !data) {
            throw new Error(`Collection '${name}' not found or is not a vector table.`);
        }

        const { count } = await this.client
            .from(name)
            .select("*", { count: "exact", head: true });

        return {
            name,
            dimensions: 0, // Placeholder
            distanceMetric: "cosine",
            documentCount: count || 0,
        };
    }

    async updateCollection(name: string, updates: UpdateCollectionConfig): Promise<void> {
        // No-op for now as we can't easily alter tables via client
        if (!this.client) throw new Error("Not connected");
    }

    async deleteCollection(name: string): Promise<void> {
        if (!this.client) throw new Error("Not connected");

        // Try to use RPC to drop table
        const { error } = await this.client.rpc("drop_table", { table_name: name });

        if (error) {
            // Fallback: try raw SQL if possible (unlikely with standard client)
            throw new Error("Failed to delete collection. Please delete the table '" + name + "' directly in Supabase.");
        }
    }

    async getCollectionStats(name: string): Promise<CollectionStats> {
        if (!this.client) throw new Error("Not connected");

        const { count, error } = await this.client.from(name).select("*", { count: "exact", head: true });

        if (error) throw error;

        return {
            vectorCount: count || 0,
            indexSize: 0,
            lastUpdated: new Date(),
        };
    }

    async addDocuments(collection: string, documents: VectorDocument[]): Promise<string[]> {
        if (!this.client) throw new Error("Not connected");

        const rows = documents.map(doc => ({
            id: doc.id,
            content: doc.content,
            metadata: doc.metadata,
            embedding: doc.embedding,
        }));

        const { data, error } = await this.client.from(collection).upsert(rows).select("id");

        if (error) throw error;
        return (data as any[]).map(d => d.id);
    }

    async getDocuments(collection: string, ids: string[]): Promise<VectorDocument[]> {
        if (!this.client) throw new Error("Not connected");

        const { data, error } = await this.client.from(collection).select("*").in("id", ids);

        if (error) throw error;

        return (data as any[]).map(row => ({
            id: row.id,
            content: row.content,
            metadata: row.metadata,
            embedding: row.embedding,
        }));
    }

    async updateDocuments(collection: string, documents: Partial<VectorDocument>[]): Promise<void> {
        if (!this.client) throw new Error("Not connected");

        await Promise.all(documents.map(async doc => {
            if (!doc.id) return;
            const { id, embedding, ...updates } = doc;
            const rowUpdates: any = { ...updates };
            if (embedding) rowUpdates.embedding = embedding;

            await this.client!.from(collection).update(rowUpdates).eq("id", id);
        }));
    }

    async deleteDocuments(collection: string, ids: string[]): Promise<void> {
        if (!this.client) throw new Error("Not connected");
        await this.client.from(collection).delete().in("id", ids);
    }

    async countDocuments(collection: string, filter?: MetadataFilter): Promise<number> {
        if (!this.client) throw new Error("Not connected");

        let query = this.client.from(collection).select("*", { count: "exact", head: true });

        if (filter) {
            Object.entries(filter).forEach(([key, value]) => {
                query = query.eq(key, value);
            });
        }

        const { count, error } = await query;
        if (error) throw error;
        return count || 0;
    }

    async search(collection: string, query: SearchQuery): Promise<SearchResult[]> {
        if (!this.client) throw new Error("Not connected");

        const { data, error } = await this.client.rpc("match_documents", {
            query_embedding: query.vector,
            match_threshold: query.minScore || 0.5,
            match_count: query.topK || 10,
        });

        if (error) throw error;

        return (data as any[]).map(row => ({
            id: row.id,
            score: row.similarity,
            content: row.content,
            metadata: row.metadata,
        }));
    }
}
