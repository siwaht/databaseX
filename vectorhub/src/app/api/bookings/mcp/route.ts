import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { bookingMcpTools, handleBookingToolCall } from "@/lib/bookings/mcp-tools";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * MCP-compatible endpoint for AI agents to interact with the booking system
 * Supports JSON-RPC 2.0 protocol
 */

interface MCPRequest {
    jsonrpc: "2.0";
    id: string | number;
    method: string;
    params?: Record<string, unknown>;
}

interface MCPResponse {
    jsonrpc: "2.0";
    id: string | number;
    result?: unknown;
    error?: {
        code: number;
        message: string;
        data?: unknown;
    };
}

// MCP Error codes
const MCP_ERRORS = {
    PARSE_ERROR: -32700,
    INVALID_REQUEST: -32600,
    METHOD_NOT_FOUND: -32601,
    INVALID_PARAMS: -32602,
    INTERNAL_ERROR: -32603,
};

export async function POST(request: Request) {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    let requestId: string | number = 0;

    try {
        const body = await request.json() as MCPRequest;
        requestId = body.id;

        // Validate JSON-RPC format
        if (body.jsonrpc !== "2.0" || !body.method) {
            return NextResponse.json({
                jsonrpc: "2.0",
                id: requestId,
                error: {
                    code: MCP_ERRORS.INVALID_REQUEST,
                    message: "Invalid JSON-RPC 2.0 request",
                },
            } as MCPResponse);
        }

        logger.info("MCP Booking request", {
            method: body.method,
            requestId,
        });

        // Handle MCP methods
        switch (body.method) {
            case "initialize": {
                return NextResponse.json({
                    jsonrpc: "2.0",
                    id: requestId,
                    result: {
                        protocolVersion: "2024-11-05",
                        capabilities: {
                            tools: { listChanged: false },
                        },
                        serverInfo: {
                            name: "VectorHub Booking System",
                            version: "1.0.0",
                        },
                    },
                } as MCPResponse);
            }

            case "tools/list": {
                return NextResponse.json({
                    jsonrpc: "2.0",
                    id: requestId,
                    result: {
                        tools: bookingMcpTools,
                    },
                } as MCPResponse);
            }

            case "tools/call": {
                const params = body.params as { name: string; arguments?: Record<string, unknown> };

                if (!params?.name) {
                    return NextResponse.json({
                        jsonrpc: "2.0",
                        id: requestId,
                        error: {
                            code: MCP_ERRORS.INVALID_PARAMS,
                            message: "Tool name is required",
                        },
                    } as MCPResponse);
                }

                const result = await handleBookingToolCall(
                    params.name,
                    params.arguments || {}
                );

                if (!result.success) {
                    return NextResponse.json({
                        jsonrpc: "2.0",
                        id: requestId,
                        error: {
                            code: MCP_ERRORS.INTERNAL_ERROR,
                            message: result.error || "Tool execution failed",
                        },
                    } as MCPResponse);
                }

                return NextResponse.json({
                    jsonrpc: "2.0",
                    id: requestId,
                    result: {
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify(result.data, null, 2),
                            },
                        ],
                    },
                } as MCPResponse);
            }

            case "ping": {
                return NextResponse.json({
                    jsonrpc: "2.0",
                    id: requestId,
                    result: { pong: true },
                } as MCPResponse);
            }

            default: {
                return NextResponse.json({
                    jsonrpc: "2.0",
                    id: requestId,
                    error: {
                        code: MCP_ERRORS.METHOD_NOT_FOUND,
                        message: `Method not found: ${body.method}`,
                    },
                } as MCPResponse);
            }
        }
    } catch (error) {
        logger.error("MCP Booking error", error);

        return NextResponse.json({
            jsonrpc: "2.0",
            id: requestId,
            error: {
                code: MCP_ERRORS.INTERNAL_ERROR,
                message: error instanceof Error ? error.message : "Internal error",
            },
        } as MCPResponse);
    }
}

// GET endpoint to return tool definitions (for discovery)
export async function GET() {
    return NextResponse.json({
        name: "VectorHub Booking System",
        version: "1.0.0",
        description: "MCP-compatible booking system for AI agents",
        tools: bookingMcpTools,
        endpoints: {
            mcp: "/api/bookings/mcp",
            rest: {
                bookings: "/api/bookings",
                eventTypes: "/api/bookings/event-types",
                settings: "/api/bookings/settings",
            },
        },
    });
}
