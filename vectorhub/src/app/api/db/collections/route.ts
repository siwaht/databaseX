import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { MongoDBAtlasConfig } from "@/types/connections";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { type, config } = body;

        if (type === "mongodb_atlas") {
            const mongoConfig = config as MongoDBAtlasConfig;
            
            if (!mongoConfig.connectionString) {
                return NextResponse.json(
                    { error: "Missing connection string" },
                    { status: 400 }
                );
            }

            const client = new MongoClient(mongoConfig.connectionString, {
                serverSelectionTimeoutMS: 10000,
            });

            try {
                await client.connect();
                
                // If database is specified, list collections from that database
                if (mongoConfig.database) {
                    const db = client.db(mongoConfig.database);
                    const collections = await db.listCollections().toArray();
                    
                    const collectionInfos = await Promise.all(
                        collections.map(async (col: { name: string }) => {
                            try {
                                const stats = await db.command({ collStats: col.name });
                                return {
                                    name: col.name,
                                    documentCount: stats.count || 0,
                                    dimensions: 0,
                                    distanceMetric: "cosine",
                                };
                            } catch {
                                return {
                                    name: col.name,
                                    documentCount: 0,
                                    dimensions: 0,
                                    distanceMetric: "cosine",
                                };
                            }
                        })
                    );

                    await client.close();
                    return NextResponse.json(collectionInfos);
                }
                
                // If no database specified, list all databases
                const adminDb = client.db().admin();
                const dbList = await adminDb.listDatabases();
                
                await client.close();
                
                return NextResponse.json(
                    dbList.databases.map((d: { name: string }) => ({
                        name: d.name,
                        documentCount: 0,
                        dimensions: 0,
                        distanceMetric: "database",
                    }))
                );
            } catch (error) {
                logger.error("MongoDB list collections failed:", error);
                return NextResponse.json(
                    { error: error instanceof Error ? error.message : "Failed to list collections" },
                    { status: 500 }
                );
            } finally {
                await client.close().catch(() => {});
            }
        }

        return NextResponse.json(
            { error: `Unsupported database type: ${type}` },
            { status: 400 }
        );
    } catch (error) {
        logger.error("List collections error:", error);
        return NextResponse.json(
            { error: "Invalid request" },
            { status: 400 }
        );
    }
}
