"use client";

import { SearchResult } from "@/lib/db/adapters/base";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResultsProps {
    results: SearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
    if (results.length === 0) {
        return (
            <div className="text-center text-muted-foreground py-8">
                No results found. Try adjusting your query or filters.
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {results.map((result) => (
                <Card key={result.id}>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-medium truncate">
                                {result.document.metadata.source || "Untitled Document"}
                            </CardTitle>
                            <Badge variant={result.score > 0.8 ? "default" : "secondary"}>
                                {(result.score * 100).toFixed(1)}% Match
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground line-clamp-3">
                            {result.document.content}
                        </p>
                        <div className="mt-2 flex gap-2 text-xs text-muted-foreground">
                            <span>Collection: {result.document.metadata.collectionName}</span>
                            <span>•</span>
                            <span>Type: {result.document.metadata.type}</span>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
