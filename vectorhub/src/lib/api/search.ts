import type { SearchQuery, SearchResult } from "@/lib/db/adapters/base";

const BASE_URL = "/api/search";

export async function searchApi(collection: string, query: SearchQuery): Promise<SearchResult[]> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, query }),
    });
    if (!res.ok) throw new Error("Failed to run search");
    return res.json();
}
