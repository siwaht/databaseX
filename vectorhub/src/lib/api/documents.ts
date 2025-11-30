import type { VectorDocument } from "@/lib/db/adapters/base";

const BASE_URL = "/api/documents";

export async function addDocumentsApi(collection: string, documents: VectorDocument[]): Promise<string[]> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, documents }),
    });
    if (!res.ok) throw new Error("Failed to add documents");
    const json = (await res.json()) as { ids: string[] };
    return json.ids;
}

export async function deleteDocumentsApi(collection: string, ids: string[]): Promise<void> {
    const res = await fetch(BASE_URL, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, ids }),
    });
    if (!res.ok) throw new Error("Failed to delete documents");
}
