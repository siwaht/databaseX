"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SearchResult } from "@/lib/db/adapters/base";
import { SearchResults } from "@/components/search/SearchResults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, Loader2, Sparkles } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export interface SearchFilters {
    limit: number;
    threshold: number;
    includeMetadata: boolean;
}

export interface SearchInterfaceProps {
    onSearch: (query: string, filters: SearchFilters) => Promise<SearchResult[]>;
    disabled?: boolean;
}

export function SearchInterface({ onSearch, disabled = false }: SearchInterfaceProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    // Filters
    const [limit, setLimit] = useState([10]);
    const [threshold, setThreshold] = useState([0.7]);
    const [includeMetadata, setIncludeMetadata] = useState(true);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || disabled) return;

        setIsSearching(true);
        setHasSearched(true);
        try {
            const searchResults = await onSearch(query, {
                limit: limit[0],
                threshold: threshold[0],
                includeMetadata,
            });
            setResults(searchResults);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Describe what you're looking for..."
                        className="pl-10 h-11"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon" className="h-11 w-11">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Search Configuration</SheetTitle>
                            <SheetDescription>
                                Adjust search parameters and filters for better results.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-6 py-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Result Limit</Label>
                                    <span className="text-sm font-medium tabular-nums">
                                        {limit[0]}
                                    </span>
                                </div>
                                <Slider
                                    value={limit}
                                    onValueChange={setLimit}
                                    min={1}
                                    max={50}
                                    step={1}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Maximum number of results to return
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Similarity Threshold</Label>
                                    <span className="text-sm font-medium tabular-nums">
                                        {(threshold[0] * 100).toFixed(0)}%
                                    </span>
                                </div>
                                <Slider
                                    value={threshold}
                                    onValueChange={setThreshold}
                                    min={0}
                                    max={1}
                                    step={0.05}
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum similarity score for results
                                </p>
                            </div>

                            <div className="flex items-center justify-between py-2">
                                <div className="space-y-0.5">
                                    <Label htmlFor="metadata">Include Metadata</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show document metadata in results
                                    </p>
                                </div>
                                <Switch
                                    id="metadata"
                                    checked={includeMetadata}
                                    onCheckedChange={setIncludeMetadata}
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <Button
                    type="submit"
                    disabled={isSearching || disabled || !query.trim()}
                    className="h-11 px-6"
                >
                    {isSearching ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Searching
                        </>
                    ) : (
                        <>
                            <Sparkles className="mr-2 h-4 w-4" />
                            Search
                        </>
                    )}
                </Button>
            </form>

            {hasSearched && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <SearchResults results={results} isLoading={isSearching} />
                </motion.div>
            )}
        </div>
    );
}
