import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createMcpConnectionSchema, validateRequestBody } from "@/lib/validations/api";
import {
    createMcpConnection,
    listMcpConnections,
} from "@/lib/mcp/store";

export const runtime = 'edge';

export async function GET() {
    try {
        const connections = await listMcpConnections();
        return NextResponse.json(connections);
    } catch (error) {
        logger.error("GET /api/mcp/connections failed", error as Error);
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to list MCP connections",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const validation = await validateRequestBody(request, createMcpConnectionSchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { data } = validation;

    try {
        const created = await createMcpConnection({
            name: data.name,
            endpoint: data.endpoint,
            tags: data.tags,
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        logger.error("POST /api/mcp/connections failed", error as Error, {
            name: data.name,
            endpoint: data.endpoint,
        });

        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to create MCP connection",
            },
            { status: 500 }
        );
    }
}
