import type { CollectionInfo, CreateCollectionConfig, CollectionStats } from "@/lib/db/adapters/base";
import { ConnectionConfig } from "@/types/connections";
import { handleResponse, getHeaders } from "./utils";

const BASE_URL = "/api/collections";

export async function listCollectionsApi(config?: ConnectionConfig): Promise<CollectionInfo[]> {
    const res = await fetch(BASE_URL, {
        method: "GET",
        headers: getHeaders(config),
    });
    return handleResponse<CollectionInfo[]>(res);
}

export async function getCollectionApi(name: string, config?: ConnectionConfig): Promise<CollectionInfo> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(name)}`, {
        method: "GET",
        headers: getHeaders(config),
    });
    return handleResponse<CollectionInfo>(res);
}

export async function createCollectionApi(config: CreateCollectionConfig, connectionConfig?: ConnectionConfig): Promise<CollectionInfo> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: getHeaders(connectionConfig),
        body: JSON.stringify(config),
    });
    return handleResponse<CollectionInfo>(res);
}

export async function deleteCollectionApi(name: string, cascade = true, config?: ConnectionConfig): Promise<void> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(name)}?cascade=${cascade}`, {
        method: "DELETE",
        headers: getHeaders(config),
    });
    await handleResponse<{ ok: boolean }>(res);
}

export async function getCollectionStatsApi(name: string, config?: ConnectionConfig): Promise<CollectionStats> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(name)}/stats`, {
        method: "GET",
        headers: getHeaders(config),
    });
    return handleResponse<CollectionStats>(res);
}

export async function updateCollectionApi(name: string, updates: Partial<CollectionInfo>, config?: ConnectionConfig): Promise<void> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(name)}`, {
        method: "PATCH",
        headers: getHeaders(config),
        body: JSON.stringify(updates),
    });
    await handleResponse<{ ok: boolean }>(res);
}
