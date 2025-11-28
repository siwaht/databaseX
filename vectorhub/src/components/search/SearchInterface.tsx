"use client";

import { useState } from "react";
import { SearchResult } from "@/lib/db/adapters/base";
import { SearchResults } from "@/components/search/SearchResults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

interface SearchInterfaceProps {
    onSearch: (query: string, filters: any) => Promise<SearchResult[]>;
}

export function SearchInterface({ onSearch }: SearchInterfaceProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Filters
    const [limit, setLimit] = useState([10]);
    const [threshold, setThreshold] = useState([0.7]);
    const [includeMetadata, setIncludeMetadata] = useState(true);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        try {
            const searchResults = await onSearch(query, {
                limit: limit[0],
                threshold: threshold[0],
                includeMetadata,
            });
            setResults(searchResults);
        } catch (error) {
            console.error("Search failed:", error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search your vector database..."
                        className="pl-8"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="outline" size="icon">
                            <SlidersHorizontal className="h-4 w-4" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Search Configuration</SheetTitle>
                            <SheetDescription>
                                Adjust search parameters and filters.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-4 py-4">
                            <div className="space-y-2">
                                <Label>Result Limit: {limit[0]}</Label>
                                <Slider
                                    value={limit}
                                    onValueChange={setLimit}
                                    max={50}
                                    step={1}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Similarity Threshold: {threshold[0]}</Label>
                                <Slider
                                    value={threshold}
                                    onValueChange={setThreshold}
                                    max={1}
                                    step={0.05}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <Label htmlFor="metadata">Include Metadata</Label>
                                <Switch
                                    id="metadata"
                                    checked={includeMetadata}
                                    onCheckedChange={setIncludeMetadata}
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>
                <Button type="submit" disabled={isSearching}>
                    {isSearching ? "Searching..." : "Search"}
                </Button>
            </form>

            <SearchResults results={results} />
        </div>
    );
}
