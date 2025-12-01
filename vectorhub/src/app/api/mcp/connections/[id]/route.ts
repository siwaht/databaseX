import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { deleteMcpConnection, getMcpConnection } from "@/lib/mcp/store";

interface RouteParams {
    params: { id: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
    const { id } = params;

    try {
        const connection = await getMcpConnection(id);

        if (!connection) {
            return NextResponse.json(
                {
                    code: "NOT_FOUND",
                    message: `MCP connection with id "${id}" was not found`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json(connection);
    } catch (error) {
        logger.error("GET /api/mcp/connections/[id] failed", error as Error, { id });
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to load MCP connection",
            },
            { status: 500 }
        );
    }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
    const { id } = params;

    try {
        const deleted = await deleteMcpConnection(id);

        if (!deleted) {
            return NextResponse.json(
                {
                    code: "NOT_FOUND",
                    message: `MCP connection with id "${id}" was not found`,
                },
                { status: 404 }
            );
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        logger.error("DELETE /api/mcp/connections/[id] failed", error as Error, { id });
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to delete MCP connection",
            },
            { status: 500 }
        );
    }
}
