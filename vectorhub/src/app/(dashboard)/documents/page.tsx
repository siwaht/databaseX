"use client";

import { useStore } from "@/store";
import { DocumentList } from "@/components/documents/DocumentList";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import Link from "next/link";

export default function DocumentsPage() {
    const { documents, removeDocument } = useStore();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
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
            </div>

            <DocumentList documents={documents} onDelete={removeDocument} />
        </div>
    );
}
