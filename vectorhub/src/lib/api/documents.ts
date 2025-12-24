import type { VectorDocument } from "@/lib/db/adapters/base";
import { ConnectionConfig } from "@/types/connections";
import { handleResponse, getHeaders } from "./utils";

const BASE_URL = "/api/documents";

export interface AddDocumentsResult {
    ids: string[];
}

export interface DeleteDocumentsResult {
    ok: boolean;
    deleted: number;
}

export async function listDocumentsApi(
    collection: string,
    config?: ConnectionConfig,
    limit = 100,
    skip = 0
): Promise<VectorDocument[]> {
    const params = new URLSearchParams({
        collection,
        limit: limit.toString(),
        skip: skip.toString(),
    });

    const res = await fetch(`${BASE_URL}?${params}`, {
        method: "GET",
        headers: getHeaders(config),
    });
    return handleResponse<VectorDocument[]>(res);
}

export async function addDocumentsApi(
    collection: string,
    documents: VectorDocument[],
    config?: ConnectionConfig,
    chunkingOptions?: { chunkSize?: number; chunkOverlap?: number }
): Promise<string[]> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: getHeaders(config),
        body: JSON.stringify({
            collection,
            documents,
            chunkSize: chunkingOptions?.chunkSize,
            chunkOverlap: chunkingOptions?.chunkOverlap
        }),
    });
    const result = await handleResponse<AddDocumentsResult>(res);
    return result.ids;
}

export async function deleteDocumentsApi(
    collection: string,
    ids: string[],
    config?: ConnectionConfig
): Promise<DeleteDocumentsResult> {
    const res = await fetch(BASE_URL, {
        method: "DELETE",
        headers: getHeaders(config),
        body: JSON.stringify({ collection, ids }),
    });
    return handleResponse<DeleteDocumentsResult>(res);
}
