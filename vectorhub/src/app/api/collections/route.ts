import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { ConnectionConfig, MongoDBAtlasConfig } from "@/types/connections";
import {
    createCollectionSchema,
    validateRequestBody,
} from "@/lib/validations/api";
import type { CreateCollectionConfig, CollectionInfo } from "@/lib/db/adapters/base";
import { logger } from "@/lib/logger";

async function createMongoDBCollection(config: MongoDBAtlasConfig, collectionConfig: CreateCollectionConfig): Promise<CollectionInfo> {
    const client = new MongoClient(config.connectionString);
    try {
        await client.connect();
        const db = client.db(config.database);
        await db.createCollection(collectionConfig.name);

        return {
            name: collectionConfig.name,
            documentCount: 0,
            dimensions: collectionConfig.dimensions,
            distanceMetric: collectionConfig.distanceMetric,
        };
    } finally {
        await client.close();
    }
}

const getConnectionConfig = (request: Request): ConnectionConfig => {
    const configHeader = request.headers.get("x-connection-config");
    if (!configHeader) {
        throw new Error("Missing connection configuration");
    }
    return JSON.parse(configHeader) as ConnectionConfig;
};

// Direct MongoDB connection for listing collections
async function listMongoDBCollections(config: MongoDBAtlasConfig): Promise<CollectionInfo[]> {
    logger.info("Connecting to MongoDB with config:", {
        database: config.database,
        hasConnectionString: !!config.connectionString,
    });

    if (!config.connectionString) {
        throw new Error("Missing MongoDB connection string. Please check your connection settings.");
    }

    const client = new MongoClient(config.connectionString);

    try {
        await client.connect();
        logger.info("Connected to MongoDB successfully");

        // If no database specified, list available databases for debugging
        if (!config.database) {
            const adminDb = client.db().admin();
            const dbList = await adminDb.listDatabases();
            const dbNames = dbList.databases.map(d => d.name).join(", ");
            logger.info(`No database specified. Available databases: ${dbNames}`);
            throw new Error(`No database name specified. Available databases: ${dbNames}`);
        }

        const db = client.db(config.database);
        const collections = await db.listCollections().toArray();

        logger.info(`Found ${collections.length} collections in database "${config.database}"`);

        // If no collections found, list available databases for debugging
        if (collections.length === 0) {
            try {
                const adminDb = client.db().admin();
                const dbList = await adminDb.listDatabases();
                const dbNames = dbList.databases.map(d => d.name).join(", ");
                logger.info(`Database "${config.database}" has 0 collections. Available databases: ${dbNames}`);
            } catch {
                // Ignore if we can't list databases
            }
        }

        const collectionInfos = await Promise.all(
            collections.map(async (col) => {
                const stats = await db.command({ collStats: col.name });
                return {
                    name: col.name,
                    documentCount: stats.count,
                    dimensions: 0, // Default for existing collections
                    distanceMetric: "cosine", // Default
                };
            })
        );

        return collectionInfos;
    } catch (error) {
        logger.error("MongoDB connection/query failed:", error);
        throw error;
    } finally {
        await client.close();
    }
}

export async function GET(request: Request) {
    try {
        const connectionConfig = getConnectionConfig(request);

        logger.info("Fetching collections for connection type:", { type: connectionConfig.type });

        // Handle different database types
        if (connectionConfig.type === "mongodb_atlas") {
            const mongoConfig = connectionConfig.config as MongoDBAtlasConfig;
            const collections = await listMongoDBCollections(mongoConfig);
            return NextResponse.json(collections);
        }

        // MCP connections don't have traditional collections
        if (connectionConfig.type === "mcp") {
            return NextResponse.json([{
                name: "MCP Tools",
                documentCount: 0,
                dimensions: 0,
                distanceMetric: "N/A",
            }]);
        }

        // Webhook connections don't have collections
        if (connectionConfig.type === "webhook") {
            return NextResponse.json([{
                name: "Webhook Endpoint",
                documentCount: 0,
                dimensions: 0,
                distanceMetric: "N/A",
            }]);
        }

        // For other database types, return empty array (can be extended)
        logger.info("Connection type not yet implemented for collections:", { type: connectionConfig.type });
        return NextResponse.json([]);
    } catch (error) {
        logger.error("GET /api/collections failed", error);
        return NextResponse.json({ error: "Failed" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const validation = await validateRequestBody(request, createCollectionSchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { data } = validation;

    try {
        const connectionConfig = getConnectionConfig(request);

        const config: CreateCollectionConfig = {
            name: data.name,
            description: data.description,
            dimensions: data.dimensions,
            distanceMetric: data.distanceMetric,
            indexType: data.indexType,
            indexOptions: data.indexOptions,
            metadataSchema: data.metadataSchema,
        };

        let created: CollectionInfo;

        if (connectionConfig.type === "mongodb_atlas") {
            const mongoConfig = connectionConfig.config as MongoDBAtlasConfig;
            created = await createMongoDBCollection(mongoConfig, config);
        } else {
            // For other types, return a mock response
            created = {
                name: config.name,
                dimensions: config.dimensions,
                distanceMetric: config.distanceMetric,
                documentCount: 0,
            };
        }

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        logger.error("POST /api/collections failed", error, { collection: data.name });

        // Check for duplicate collection error
        if (
            error instanceof Error &&
            error.message.toLowerCase().includes("already exists")
        ) {
            return NextResponse.json(
                {
                    code: "DUPLICATE_COLLECTION",
                    message: `Collection "${data.name}" already exists`,
                },
                { status: 409 }
            );
        }

        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: error instanceof Error ? error.message : "Failed to create collection",
            },
            { status: 500 }
        );
    }
}
