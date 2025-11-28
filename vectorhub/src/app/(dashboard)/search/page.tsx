"use client";

import { useStore } from "@/store";
import { SearchInterface } from "@/components/search/SearchInterface";
import { SearchResult } from "@/lib/db/adapters/base";

export default function SearchPage() {
    const { documents } = useStore();

    // Mock search implementation
    const handleSearch = async (query: string, filters: any): Promise<SearchResult[]> => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        // Simple keyword matching for mock
        const results = documents
            .filter(doc =>
                doc.content.toLowerCase().includes(query.toLowerCase()) ||
                doc.metadata.source?.toLowerCase().includes(query.toLowerCase())
            )
            .map(doc => ({
                id: Math.random().toString(36).substring(7),
                document: doc,
                score: 0.7 + Math.random() * 0.3, // Mock score
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, filters.limit);

        return results;
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Vector Search</h2>
                <p className="text-muted-foreground">
                    Semantic search across your indexed documents.
                </p>
            </div>

            <SearchInterface onSearch={handleSearch} />
        </div>
    );
}
