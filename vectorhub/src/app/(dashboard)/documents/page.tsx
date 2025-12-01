"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useStore } from "@/store";
import { DocumentList } from "@/components/documents/DocumentList";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, Search, RefreshCw, Loader2, Filter, Trash2 } from "lucide-react";
import Link from "next/link";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

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

export default function DocumentsPage() {
    // Access store state and actions separately
    const documents = useStore((state) => state.documents);
    const collections = useStore((state) => state.collections);
    const removeDocument = useStore((state) => state.removeDocument);

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterCollection, setFilterCollection] = useState<string>("all");
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Filter documents based on search and collection filter
    const filteredDocuments = documents.filter((doc) => {
        const matchesSearch = searchQuery === "" || 
            doc.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.metadata?.source as string)?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (doc.metadata?.title as string)?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesCollection = filterCollection === "all" || 
            doc.metadata?.collectionName === filterCollection;
        
        return matchesSearch && matchesCollection;
    });

    // Get unique collections from documents
    const documentCollections = Array.from(
        new Set(documents.map((d) => d.metadata?.collectionName as string).filter(Boolean))
    );

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        // Simulate refresh - in a real app this would fetch from API
        await new Promise((resolve) => setTimeout(resolve, 500));
        toast.success("Documents refreshed", {
            description: `${documents.length} documents in sync.`,
        });
        setIsRefreshing(false);
    }, [documents.length]);

    const handleDeleteConfirm = useCallback(() => {
        if (!deleteTarget) return;

        const doc = documents.find((d) => d.id === deleteTarget);
        removeDocument(deleteTarget);
        toast.success("Document deleted", {
            description: `"${doc?.metadata?.source || "Document"}" has been removed.`,
        });
        setDeleteTarget(null);
    }, [deleteTarget, documents, removeDocument]);

    return (
        <>
            <motion.div
                className="space-y-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.div
                    variants={itemVariants}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
                        <p className="text-muted-foreground">
                            View and manage your uploaded documents and vectors.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
                            {isRefreshing ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Refresh
                        </Button>
                        <Link href="/upload">
                            <Button>
                                <Upload className="mr-2 h-4 w-4" />
                                Upload New
                            </Button>
                        </Link>
                    </div>
                </motion.div>

                {/* Stats and Filters */}
                {documents.length > 0 && (
                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-4">
                        <div className="flex items-center gap-2 flex-1">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search documents..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                            <Select value={filterCollection} onValueChange={setFilterCollection}>
                                <SelectTrigger className="w-[180px]">
                                    <Filter className="mr-2 h-4 w-4" />
                                    <SelectValue placeholder="All Collections" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Collections</SelectItem>
                                    {documentCollections.map((col) => (
                                        <SelectItem key={col} value={col}>
                                            {col}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-sm">
                                {filteredDocuments.length} of {documents.length} documents
                            </Badge>
                            {filterCollection !== "all" && (
                                <Badge variant="outline" className="text-sm">
                                    {filterCollection}
                                </Badge>
                            )}
                        </div>
                    </motion.div>
                )}

                <motion.div variants={itemVariants}>
                    {documents.length > 0 ? (
                        filteredDocuments.length > 0 ? (
                            <DocumentList
                                documents={filteredDocuments}
                                onDelete={(id) => setDeleteTarget(id)}
                            />
                        ) : (
                            <div className="flex h-[300px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold">No matching documents</h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    Try adjusting your search or filter criteria.
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setFilterCollection("all");
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        )
                    ) : (
                        <div className="flex h-[450px] flex-col items-center justify-center rounded-lg border border-dashed text-center">
                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                <FileText className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold">No documents found</h3>
                            <p className="mb-6 text-sm text-muted-foreground max-w-sm">
                                Upload documents to start indexing and searching your data.
                            </p>
                            <Link href="/upload">
                                <Button>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Documents
                                </Button>
                            </Link>
                        </div>
                    )}
                </motion.div>
            </motion.div>

            <ConfirmDialog
                open={!!deleteTarget}
                onOpenChange={(open) => !open && setDeleteTarget(null)}
                title="Delete Document"
                description="Are you sure you want to delete this document? This action cannot be undone."
                confirmText="Delete"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
