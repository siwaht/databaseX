import type { SearchQuery, SearchResult } from "@/lib/db/adapters/base";
import { handleResponse } from "./utils";

const BASE_URL = "/api/search";

export interface SearchOptions {
    collection: string;
    query: SearchQuery;
}

export async function searchApi(
    collection: string,
    query: SearchQuery
): Promise<SearchResult[]> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collection, query }),
    });
    return handleResponse<SearchResult[]>(res);
}

export async function searchWithOptionsApi(
    options: SearchOptions
): Promise<SearchResult[]> {
    return searchApi(options.collection, options.query);
}
