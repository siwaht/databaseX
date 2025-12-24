import type { SearchResult } from "@/lib/db/adapters/base";
import { handleResponse } from "./utils";

const BASE_URL = "/api/rag";

export interface RAGAgentConfig {
    type: "mcp" | "webhook" | "mock";
    endpoint?: string;
    name?: string;
}

export interface RAGQueryInput {
    query: string;
    collection: string;
    topK?: number;
    minScore?: number;
    agent?: RAGAgentConfig;
}

export interface RAGQueryResult {
    response: string;
    context: SearchResult[];
    agentUsed: string;
}

export async function ragQueryApi(input: RAGQueryInput): Promise<RAGQueryResult> {
    const res = await fetch(BASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
    });
    return handleResponse<RAGQueryResult>(res);
}

