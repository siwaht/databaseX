import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { bookingMcpTools, handleBookingToolCall } from "@/lib/bookings/mcp-tools";

export const runtime = 'edge';

/**
 * MCP-compatible endpoint for AI agents to interact with the booking system
 * Supports JSON-RPC 2.0 protocol with SSE transport for n8n compatibility
 */

interface MCPRequest {
    jsonrpc: "2.0";
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
}

// MCP Error codes
const MCP_ERRORS = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
};

// Helper to create JSON-RPC response
function createResponse(id: string | number, result?: unknown, error?: { code: number; message: string; data?: unknown }) {
    const response: Record<string, unknown> = { jsonrpc: "2.0", id };
    if (error) {
        response.error = error;
    } else {
        response.result = result;
    }
    return response;
}

// Process a single MCP request
async function processMcpRequest(body: MCPRequest) {
    const requestId = body.id ?? 0;

    if (body.jsonrpc !== "2.0" || !body.method) {
        return createResponse(requestId, undefined, {
            code: MCP_ERRORS.INVALID_REQUEST,
            message: "Invalid JSON-RPC 2.0 request",
        });
    }

    logger.info("MCP Booking request", { method: body.method, requestId });

    switch (body.method) {
        case "initialize":
            return createResponse(requestId, {
                protocolVersion: "2024-11-05",
                capabilities: { tools: { listChanged: false } },
                serverInfo: { name: "VectorHub Booking System", version: "1.0.0" },
            });

        case "notifications/initialized":
            return null;

        case "tools/list":
            return createResponse(requestId, { tools: bookingMcpTools });

        case "tools/call": {
            const params = body.params as { name: string; arguments?: Record<string, unknown> };
            if (!params?.name) {
                return createResponse(requestId, undefined, {
                    code: MCP_ERRORS.INVALID_PARAMS,
                    message: "Tool name is required",
                });
            }
            const result = await handleBookingToolCall(params.name, params.arguments || {});
            if (!result.success) {
                return createResponse(requestId, undefined, {
                    code: MCP_ERRORS.INTERNAL_ERROR,
                    message: result.error || "Tool execution failed",
                });
            }
            return createResponse(requestId, {
                content: [{ type: "text", text: JSON.stringify(result.data, null, 2) }],
            });
        }

        case "ping":
            return createResponse(requestId, { pong: true });

        default:
            if (body.method.startsWith("notifications/")) return null;
            return createResponse(requestId, undefined, {
                code: MCP_ERRORS.METHOD_NOT_FOUND,
                message: `Method not found: ${body.method}`,
            });
    }
}


export async function POST(request: Request) {
    const accept = request.headers.get("accept") || "";

    try {
        const body = await request.json();

        // Handle batch requests
        if (Array.isArray(body)) {
            const responses = await Promise.all(body.map((req: MCPRequest) => processMcpRequest(req)));
            const filtered = responses.filter((r) => r !== null);
            if (filtered.length === 0) return new Response(null, { status: 204 });
            return NextResponse.json(filtered, {
                headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
            });
        }

        const response = await processMcpRequest(body as MCPRequest);
        if (response === null) return new Response(null, { status: 204 });

        // SSE response if requested
        if (accept.includes("text/event-stream")) {
            return new Response(`data: ${JSON.stringify(response)}\n\n`, {
                headers: {
                    "Content-Type": "text/event-stream",
                    "Cache-Control": "no-cache",
                    "Connection": "keep-alive",
                    "Access-Control-Allow-Origin": "*",
                },
            });
        }

        return NextResponse.json(response, {
            headers: { "Access-Control-Allow-Origin": "*" },
        });
    } catch (error) {
        logger.error("MCP Booking error", error);
        return NextResponse.json(
            createResponse(0, undefined, {
                code: MCP_ERRORS.PARSE_ERROR,
                message: error instanceof Error ? error.message : "Parse error",
            }),
            { status: 400, headers: { "Access-Control-Allow-Origin": "*" } }
        );
    }
}

export async function GET(request: Request) {
    const accept = request.headers.get("accept") || "";

    // SSE stream connection
    if (accept.includes("text/event-stream")) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            start(controller) {
                const init = { jsonrpc: "2.0", method: "connection/ready", params: { serverInfo: { name: "VectorHub Booking System", version: "1.0.0" } } };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(init)}\n\n`));
                const ping = setInterval(() => {
                    try { controller.enqueue(encoder.encode(`: ping\n\n`)); } catch { clearInterval(ping); }
                }, 30000);
                request.signal.addEventListener("abort", () => { clearInterval(ping); controller.close(); });
            },
        });
        return new Response(stream, {
            headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", "Connection": "keep-alive", "Access-Control-Allow-Origin": "*" },
        });
    }

    return NextResponse.json({
        name: "VectorHub Booking System",
        version: "1.0.0",
        description: "MCP-compatible booking system for AI agents",
        protocol: "JSON-RPC 2.0",
        transport: ["http", "sse"],
        tools: bookingMcpTools,
    }, { headers: { "Access-Control-Allow-Origin": "*" } });
}

export async function OPTIONS() {
    return new Response(null, {
        status: 204,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
            "Access-Control-Max-Age": "86400",
        },
    });
}
