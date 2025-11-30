"use client";

import { VectorDocument } from "@/lib/db/adapters/base";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface DocumentListProps {
    documents: VectorDocument[];
    onDelete: (id: string) => void;
}

export function DocumentList({ documents, onDelete }: DocumentListProps) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[400px]">Document</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Collection</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {documents.map((doc) => (
                        <TableRow key={doc.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center space-x-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span>{doc.metadata.source || "Untitled"}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant="secondary">{doc.metadata.type || "text"}</Badge>
                            </TableCell>
                            <TableCell>{doc.metadata.collectionName || "-"}</TableCell>
                            <TableCell>
                                {doc.metadata.created_at
                                    ? formatDistanceToNow(new Date(doc.metadata.created_at), { addSuffix: true })
                                    : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive"
                                    onClick={() => doc.id && onDelete(doc.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {documents.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                No documents found.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
