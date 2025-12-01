import { McpConnection } from "@/types/connections";
import { logger } from "@/lib/logger";

// In-memory MCP connection registry.
// This is a mock implementation suitable for demos and local development.
// For a real production deployment, back this with a persistent data store.
let mcpConnections: McpConnection[] = [];

export interface CreateMcpConnectionInput {
    name: string;
    endpoint: string;
    tags?: string[];
}

export async function listMcpConnections(): Promise<McpConnection[]> {
    return mcpConnections;
}

export async function createMcpConnection(
    input: CreateMcpConnectionInput
): Promise<McpConnection> {
    const connection: McpConnection = {
        id: crypto.randomUUID(),
        name: input.name,
        endpoint: input.endpoint,
        status: "connected",
        lastSync: new Date(),
        tags: input.tags,
    };

    mcpConnections = [...mcpConnections, connection];

    logger.info("MCP connection created", {
        id: connection.id,
        name: connection.name,
        endpoint: connection.endpoint,
    });

    return connection;
}

export async function getMcpConnection(id: string): Promise<McpConnection | undefined> {
    return mcpConnections.find((c) => c.id === id);
}

export async function deleteMcpConnection(id: string): Promise<boolean> {
    const before = mcpConnections.length;
    mcpConnections = mcpConnections.filter((c) => c.id !== id);
    const deleted = mcpConnections.length < before;

    if (deleted) {
        logger.info("MCP connection deleted", { id });
    }

    return deleted;
}
