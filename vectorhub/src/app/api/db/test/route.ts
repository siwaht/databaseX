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
                    { success: false, message: "Missing connection string" },
                    { status: 400 }
                );
            }

            const client = new MongoClient(mongoConfig.connectionString, {
                serverSelectionTimeoutMS: 5000,
                connectTimeoutMS: 5000,
            });

            try {
                await client.connect();

                // Test by listing databases
                const adminDb = client.db().admin();
                const dbList = await adminDb.listDatabases();

                await client.close();

                return NextResponse.json({
                    success: true,
                    message: "MongoDB connection successful",
                    databases: dbList.databases.map((d: { name: string }) => d.name),
                });
            } catch (error) {
                logger.error("MongoDB connection test failed:", error);
                return NextResponse.json({
                    success: false,
                    message: error instanceof Error ? error.message : "Connection failed",
                });
            } finally {
                await client.close().catch(() => { });
            }
        }

        return NextResponse.json(
            { success: false, message: `Unsupported database type: ${type}` },
            { status: 400 }
        );
    } catch (error) {
        logger.error("Test connection error:", error);
        return NextResponse.json(
            { success: false, message: "Invalid request" },
            { status: 400 }
        );
    }
}
