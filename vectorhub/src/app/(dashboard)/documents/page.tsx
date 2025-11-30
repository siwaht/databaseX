"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useStore } from "@/store";
import { DocumentList } from "@/components/documents/DocumentList";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import Link from "next/link";

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
    const removeDocument = useStore((state) => state.removeDocument);

    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

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
                    <Link href="/upload">
                        <Button>
                            <Upload className="mr-2 h-4 w-4" />
                            Upload New
                        </Button>
                    </Link>
                </motion.div>

                <motion.div variants={itemVariants}>
                    {documents.length > 0 ? (
                        <DocumentList
                            documents={documents}
                            onDelete={(id) => setDeleteTarget(id)}
                        />
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
