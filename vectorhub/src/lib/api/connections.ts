import type { McpConnection, WebhookConnection } from "@/types/connections";
import { handleResponse, ApiError, type ApiErrorResponse } from "./utils";

// Re-export for backward compatibility
export { ApiError, type ApiErrorResponse } from "./utils";

// ============================================================================
// MCP Connections API
// ============================================================================

const MCP_BASE_URL = "/api/mcp/connections";

export interface CreateMcpConnectionInput {
    name: string;
    endpoint: string;
    tags?: string[];
}

export interface McpHealthResult {
    healthy: boolean;
    latency?: number;
    error?: string;
    serverInfo?: {
        name?: string;
        version?: string;
        capabilities?: string[];
    };
}

export interface McpSyncResult {
    success: boolean;
    itemsSynced?: number;
    error?: string;
    duration: number;
}

export async function listMcpConnectionsApi(): Promise<McpConnection[]> {
    const res = await fetch(MCP_BASE_URL, { method: "GET" });
    return handleResponse<McpConnection[]>(res);
}

export async function getMcpConnectionApi(id: string): Promise<McpConnection> {
    const res = await fetch(`${MCP_BASE_URL}/${encodeURIComponent(id)}`, {
        method: "GET",
    });
    return handleResponse<McpConnection>(res);
}

export async function createMcpConnectionApi(
    input: CreateMcpConnectionInput
): Promise<McpConnection> {
    const res = await fetch(MCP_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    return handleResponse<McpConnection>(res);
}

export async function deleteMcpConnectionApi(id: string): Promise<void> {
    const res = await fetch(`${MCP_BASE_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    await handleResponse<{ ok: boolean }>(res);
}

export async function checkMcpHealthApi(id: string): Promise<McpHealthResult> {
    const res = await fetch(
        `${MCP_BASE_URL}/${encodeURIComponent(id)}?action=health`,
        { method: "POST" }
    );
    return handleResponse<McpHealthResult>(res);
}

export async function syncMcpConnectionApi(id: string): Promise<McpSyncResult> {
    const res = await fetch(
        `${MCP_BASE_URL}/${encodeURIComponent(id)}?action=sync`,
        { method: "POST" }
    );
    return handleResponse<McpSyncResult>(res);
}

// ============================================================================
// Webhook Connections API
// ============================================================================

const WEBHOOK_BASE_URL = "/api/webhooks";

export interface CreateWebhookConnectionInput {
    name: string;
    url: string;
    eventTypes: string[];
    secretConfigured?: boolean;
}

export interface WebhookTestResult {
    success: boolean;
    statusCode?: number;
    error?: string;
    duration: number;
}

export async function listWebhookConnectionsApi(): Promise<WebhookConnection[]> {
    const res = await fetch(WEBHOOK_BASE_URL, { method: "GET" });
    return handleResponse<WebhookConnection[]>(res);
}

export async function getWebhookConnectionApi(
    id: string
): Promise<WebhookConnection> {
    const res = await fetch(`${WEBHOOK_BASE_URL}/${encodeURIComponent(id)}`, {
        method: "GET",
    });
    return handleResponse<WebhookConnection>(res);
}

export async function createWebhookConnectionApi(
    input: CreateWebhookConnectionInput
): Promise<WebhookConnection> {
    const res = await fetch(WEBHOOK_BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    return handleResponse<WebhookConnection>(res);
}

export async function deleteWebhookConnectionApi(id: string): Promise<void> {
    const res = await fetch(`${WEBHOOK_BASE_URL}/${encodeURIComponent(id)}`, {
        method: "DELETE",
    });
    await handleResponse<{ ok: boolean }>(res);
}

export async function testWebhookConnectionApi(
    id: string
): Promise<WebhookTestResult> {
    const res = await fetch(
        `${WEBHOOK_BASE_URL}/${encodeURIComponent(id)}?action=test`,
        { method: "POST" }
    );
    return handleResponse<WebhookTestResult>(res);
}

