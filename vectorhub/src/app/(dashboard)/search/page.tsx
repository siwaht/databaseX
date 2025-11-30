"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useStore } from "@/store";
import { SearchInterface, type SearchFilters } from "@/components/search/SearchInterface";
import { SearchResult, type SearchQuery } from "@/lib/db/adapters/base";
import { searchApi } from "@/lib/api/search";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Sparkles } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function SearchPage() {
    // Access store state separately
    const collections = useStore((state) => state.collections);

    const [selectedCollection, setSelectedCollection] = useState<string>(
        collections[0]?.name || ""
    );

    const handleSearch = useCallback(
        async (query: string, filters: SearchFilters): Promise<SearchResult[]> => {
            if (!selectedCollection) {
                toast.error("No collection selected", {
                    description: "Please select a collection to search.",
                });
                return [];
            }

            const searchQuery: SearchQuery = {
                text: query,
                topK: filters.limit,
                minScore: filters.threshold,
                includeMetadata: filters.includeMetadata,
                includeContent: true,
            };

            try {
                const results = await searchApi(selectedCollection, searchQuery);
                if (results.length === 0) {
                    toast.info("No results found", {
                        description:
                            "Try adjusting your query or lowering the similarity threshold.",
                    });
                }
                return results;
            } catch {
                toast.error("Search failed", {
                    description: "An error occurred while searching. Please try again.",
                });
                return [];
            }
        },
        [selectedCollection]
    );

    return (
        <motion.div
            className="space-y-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Sparkles className="h-8 w-8 text-primary" />
                    Vector Search
                </h2>
                <p className="text-muted-foreground">
                    Semantic search across your indexed documents using vector embeddings.
                </p>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Search className="h-5 w-5 text-muted-foreground" />
                            Search Scope
                        </CardTitle>
                        <CardDescription>
                            Select the collection to search within
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Label>Collection</Label>
                            <Select
                                value={selectedCollection}
                                onValueChange={setSelectedCollection}
                            >
                                <SelectTrigger className="w-full md:w-[300px]">
                                    <SelectValue placeholder="Select a collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    {collections.length === 0 ? (
                                        <SelectItem value="_empty" disabled>
                                            No collections available
                                        </SelectItem>
                                    ) : (
                                        collections.map((c) => (
                                            <SelectItem key={c.name} value={c.name}>
                                                {c.name} ({c.documentCount.toLocaleString()} vectors)
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <SearchInterface
                    onSearch={handleSearch}
                    disabled={!selectedCollection || collections.length === 0}
                />
            </motion.div>
        </motion.div>
    );
}
