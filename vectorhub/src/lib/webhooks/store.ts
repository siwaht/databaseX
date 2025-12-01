import { WebhookConnection } from "@/types/connections";
import { logger } from "@/lib/logger";

// In-memory Webhook connection registry.
// Suitable for demos and local development.
// For production, replace this with a persistent backing store.
let webhookConnections: WebhookConnection[] = [];

export interface CreateWebhookConnectionInput {
    name: string;
    url: string;
    eventTypes: string[];
    secretConfigured: boolean;
}

export async function listWebhookConnections(): Promise<WebhookConnection[]> {
    return webhookConnections;
}

export async function createWebhookConnection(
    input: CreateWebhookConnectionInput
): Promise<WebhookConnection> {
    const connection: WebhookConnection = {
        id: crypto.randomUUID(),
        name: input.name,
        url: input.url,
        eventTypes: input.eventTypes,
        status: "connected",
        lastDelivery: undefined,
        secretConfigured: input.secretConfigured,
    };

    webhookConnections = [...webhookConnections, connection];

    logger.info("Webhook connection created", {
        id: connection.id,
        name: connection.name,
        url: connection.url,
        eventTypes: connection.eventTypes,
    });

    return connection;
}

export async function getWebhookConnection(id: string): Promise<WebhookConnection | undefined> {
    return webhookConnections.find((c) => c.id === id);
}

export async function deleteWebhookConnection(id: string): Promise<boolean> {
    const before = webhookConnections.length;
    webhookConnections = webhookConnections.filter((c) => c.id !== id);
    const deleted = webhookConnections.length < before;

    if (deleted) {
        logger.info("Webhook connection deleted", { id });
    }

    return deleted;
}
