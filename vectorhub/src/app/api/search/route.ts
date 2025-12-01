import { NextResponse } from "next/server";
import { mockDbClient } from "@/lib/db/client";
import { searchQuerySchema, validateRequestBody } from "@/lib/validations/api";
import { logger } from "@/lib/logger";

export async function POST(request: Request) {
    const validation = await validateRequestBody(request, searchQuerySchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { collection, query } = validation.data;

    // Ensure at least one search method is provided
    if (!query.vector && !query.text) {
        return NextResponse.json(
            {
                code: "VALIDATION_ERROR",
                message: "Either 'vector' or 'text' must be provided for search",
            },
            { status: 400 }
        );
    }

    try {
        const results = await mockDbClient.search(collection, query);

        return NextResponse.json(results);
    } catch (error) {
        logger.error("POST /api/search failed", error, { collection, hasVector: !!query.vector, hasText: !!query.text });

        // Check for collection not found
        if (
            error instanceof Error &&
            error.message.toLowerCase().includes("not found")
        ) {
            return NextResponse.json(
                {
                    code: "COLLECTION_NOT_FOUND",
                    message: `Collection "${collection}" does not exist`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to execute search",
            },
            { status: 500 }
        );
    }
}
