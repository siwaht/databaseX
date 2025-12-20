import { JsonStore } from "@/lib/store/json-store";
import { ConnectionStatus } from "@/types/connections";

export interface Integration {
    id: string;
    type: 'webhook' | 'mcp';
    name: string;
    status: ConnectionStatus;
    config: {
        url: string;
        secret?: string;
        events?: string[]; // For webhooks
    };
    lastDelivery?: string;
    createdAt: string;
}

const store = new JsonStore<Integration>("integrations.json");

export async function listIntegrations() {
    return store.getAll();
}

export async function createIntegration(integration: Omit<Integration, "id" | "createdAt" | "status">) {
    const newIntegration: Integration = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: "connected",
        ...integration
    };
    return store.create(newIntegration);
}

export async function restoreIntegrations(integrations: Integration[]) {
    return store.restore(integrations);
}

export async function updateIntegration(id: string, updates: Partial<Integration>) {
    return store.update(id, updates);
}

export async function deleteIntegration(id: string) {
    return store.delete(id);
}
