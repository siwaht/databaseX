import { NextResponse } from "next/server";
import { mockDbClient } from "@/lib/db/client";
import {
    createCollectionSchema,
    validateRequestBody,
} from "@/lib/validations/api";
import type { CreateCollectionConfig } from "@/lib/db/adapters/base";

export async function GET() {
    try {
        const collections = await mockDbClient.listCollections();
        return NextResponse.json(collections);
    } catch (error) {
        console.error("GET /api/collections failed:", error);
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to list collections",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const validation = await validateRequestBody(request, createCollectionSchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { data } = validation;

    try {
        const config: CreateCollectionConfig = {
            name: data.name,
            description: data.description,
            dimensions: data.dimensions,
            distanceMetric: data.distanceMetric,
            indexType: data.indexType,
            indexOptions: data.indexOptions,
            metadataSchema: data.metadataSchema,
        };

        const created = await mockDbClient.createCollection(config);

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        console.error("POST /api/collections failed:", error);

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
                message: "Failed to create collection",
            },
            { status: 500 }
        );
    }
}
