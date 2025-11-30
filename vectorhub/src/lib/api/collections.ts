import type { CollectionInfo, CreateCollectionConfig, CollectionStats } from "@/lib/db/adapters/base";

const BASE_URL = "/api/collections";

export async function listCollectionsApi(): Promise<CollectionInfo[]> {
    const res = await fetch(BASE_URL, { method: "GET" });
    if (!res.ok) throw new Error("Failed to list collections");
    return res.json();
}

export async function createCollectionApi(config: CreateCollectionConfig): Promise<CollectionInfo> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error("Failed to create collection");
    return res.json();
}

export async function deleteCollectionApi(name: string, cascade = true): Promise<void> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(name)}?cascade=${cascade}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete collection");
}

export async function getCollectionStatsApi(name: string): Promise<CollectionStats> {
    const res = await fetch(`${BASE_URL}/${encodeURIComponent(name)}/stats`, { method: "GET" });
    if (!res.ok) throw new Error("Failed to fetch collection stats");
    return res.json();
}
