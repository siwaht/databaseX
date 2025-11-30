"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SearchResult } from "@/lib/db/adapters/base";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchResultsProps {
    results: SearchResult[];
    isLoading?: boolean;
}

function ResultSkeleton() {
    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-5 w-20" />
                </div>
            </CardHeader>
            <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex gap-4">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-3 w-16" />
                </div>
            </CardContent>
        </Card>
    );
}

export function SearchResults({ results, isLoading = false }: SearchResultsProps) {
    if (isLoading) {
        return (
            <div className="space-y-4">
                <ResultSkeleton />
                <ResultSkeleton />
                <ResultSkeleton />
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold">No results found</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                    Try adjusting your query or lowering the similarity threshold in the search configuration.
                </p>
            </div>
        );
    }

    const getScoreColor = (score: number) => {
        if (score >= 0.9) return "text-emerald-500 bg-emerald-500/10";
        if (score >= 0.8) return "text-blue-500 bg-blue-500/10";
        if (score >= 0.7) return "text-amber-500 bg-amber-500/10";
        return "text-zinc-500 bg-zinc-500/10";
    };

    const getScoreLabel = (score: number) => {
        if (score >= 0.9) return "Excellent";
        if (score >= 0.8) return "Good";
        if (score >= 0.7) return "Fair";
        return "Low";
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{results.length} result{results.length !== 1 ? "s" : ""} found</span>
                <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Sorted by relevance
                </span>
            </div>

            <AnimatePresence mode="popLayout">
                {results.map((result, index) => {
                    const metadata = result.metadata ?? {};
                    const title = (metadata.source as string) || "Untitled Document";
                    const collectionName = (metadata.collectionName as string) || "-";
                    const type = (metadata.type as string) || "text";
                    const scorePercent = (result.score * 100).toFixed(1);

                    return (
                        <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="card-hover cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <CardTitle className="text-base font-medium truncate">
                                                {title}
                                            </CardTitle>
                                        </div>
                                        <Badge
                                            variant="secondary"
                                            className={cn(
                                                "flex-shrink-0",
                                                getScoreColor(result.score)
                                            )}
                                        >
                                            {scorePercent}% • {getScoreLabel(result.score)}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                                        {result.content || "No content preview available"}
                                    </p>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className="flex items-center gap-1">
                                            <span className="text-foreground/50">Collection:</span>
                                            {collectionName}
                                        </span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <span className="text-foreground/50">Type:</span>
                                            {type}
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
