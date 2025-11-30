import { NextResponse } from "next/server";
import { mockDbClient } from "@/lib/db/client";
import {
    addDocumentsSchema,
    deleteDocumentsSchema,
    validateRequestBody,
} from "@/lib/validations/api";

export async function POST(request: Request) {
    const validation = await validateRequestBody(request, addDocumentsSchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { collection, documents } = validation.data;

    try {
        const ids = await mockDbClient.addDocuments(collection, documents);
        return NextResponse.json({ ids }, { status: 201 });
    } catch (error) {
        console.error("POST /api/documents failed:", error);

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
                message: "Failed to add documents",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    const validation = await validateRequestBody(request, deleteDocumentsSchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { collection, ids } = validation.data;

    try {
        await mockDbClient.deleteDocuments(collection, ids);
        return NextResponse.json({ ok: true, deleted: ids.length });
    } catch (error) {
        console.error("DELETE /api/documents failed:", error);

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
                message: "Failed to delete documents",
            },
            { status: 500 }
        );
    }
}
