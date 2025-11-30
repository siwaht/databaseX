"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useStore } from "@/store";
import { UploadZone } from "@/components/documents/UploadZone";
import { TextInputUpload } from "@/components/documents/TextInputUpload";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, AlertCircle } from "lucide-react";
import type { VectorDocument } from "@/lib/db/adapters/base";
import { addDocumentsApi } from "@/lib/api/documents";
import { listCollectionsApi } from "@/lib/api/collections";

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

export default function UploadPage() {
    // Access store state and actions separately
    const connections = useStore((state) => state.connections);
    const collections = useStore((state) => state.collections);
    const addDocument = useStore((state) => state.addDocument);
    const setCollections = useStore((state) => state.setCollections);

    const [selectedConnection, setSelectedConnection] = useState<string>("");
    const [selectedCollection, setSelectedCollection] = useState<string>("");
    const [isUploading, setIsUploading] = useState(false);

    const ensureTargetsSelected = useCallback(() => {
        if (!selectedConnection) {
            toast.error("No connection selected", {
                description: "Please select a target connection first.",
            });
            return false;
        }
        if (!selectedCollection) {
            toast.error("No collection selected", {
                description: "Please select a target collection first.",
            });
            return false;
        }
        return true;
    }, [selectedConnection, selectedCollection]);

    const syncCollectionsFromDb = useCallback(async () => {
        try {
            const latest = await listCollectionsApi();
            setCollections(latest);
        } catch {
            // Silent fail - use existing data
        }
    }, [setCollections]);

    const handleFileUpload = useCallback(
        async (files: File[]) => {
            if (!ensureTargetsSelected()) return;

            setIsUploading(true);
            const toastId = toast.loading(`Uploading ${files.length} file(s)...`);

            const docs: VectorDocument[] = files.map((file) => ({
                id: crypto.randomUUID(),
                content: `Content of ${file.name}`,
                metadata: {
                    source: file.name,
                    type: file.type,
                    size: file.size,
                    created_at: new Date(),
                    connectionId: selectedConnection,
                    collectionName: selectedCollection,
                },
            }));

            try {
                await addDocumentsApi(selectedCollection, docs);
                docs.forEach((doc) => addDocument(doc));
                await syncCollectionsFromDb();
                toast.success(`${files.length} file(s) uploaded`, {
                    id: toastId,
                    description: `Documents added to "${selectedCollection}".`,
                });
            } catch {
                toast.error("Upload failed", {
                    id: toastId,
                    description: "Could not upload files. Please try again.",
                });
            } finally {
                setIsUploading(false);
            }
        },
        [
            ensureTargetsSelected,
            selectedConnection,
            selectedCollection,
            addDocument,
            syncCollectionsFromDb,
        ]
    );

    const handleTextUpload = useCallback(
        async (title: string, content: string) => {
            if (!ensureTargetsSelected()) return;

            setIsUploading(true);
            const toastId = toast.loading("Processing text...");

            const doc: VectorDocument = {
                id: crypto.randomUUID(),
                content,
                metadata: {
                    source: title,
                    type: "text/plain",
                    size: content.length,
                    created_at: new Date(),
                    connectionId: selectedConnection,
                    collectionName: selectedCollection,
                },
            };

            try {
                await addDocumentsApi(selectedCollection, [doc]);
                addDocument(doc);
                await syncCollectionsFromDb();
                toast.success("Text uploaded", {
                    id: toastId,
                    description: `"${title}" added to "${selectedCollection}".`,
                });
            } catch {
                toast.error("Upload failed", {
                    id: toastId,
                    description: "Could not upload text. Please try again.",
                });
            } finally {
                setIsUploading(false);
            }
        },
        [
            ensureTargetsSelected,
            selectedConnection,
            selectedCollection,
            addDocument,
            syncCollectionsFromDb,
        ]
    );

    const hasTargetsSelected = selectedConnection && selectedCollection;

    return (
        <motion.div
            className="space-y-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight">Upload Data</h2>
                <p className="text-muted-foreground">
                    Import files or text into your vector database.
                </p>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Target Destination</CardTitle>
                        <CardDescription>
                            Select where your data should be stored
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Connection</Label>
                                <Select
                                    value={selectedConnection}
                                    onValueChange={setSelectedConnection}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select connection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {connections.length === 0 ? (
                                            <SelectItem value="_empty" disabled>
                                                No connections available
                                            </SelectItem>
                                        ) : (
                                            connections.map((c) => (
                                                <SelectItem key={c.id} value={c.id}>
                                                    {c.name} ({c.type})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Collection</Label>
                                <Select
                                    value={selectedCollection}
                                    onValueChange={setSelectedCollection}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select collection" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {collections.length === 0 ? (
                                            <SelectItem value="_empty" disabled>
                                                No collections available
                                            </SelectItem>
                                        ) : (
                                            collections.map((c) => (
                                                <SelectItem key={c.name} value={c.name}>
                                                    {c.name}
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {!hasTargetsSelected && (
                            <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                                <AlertCircle className="h-4 w-4" />
                                Please select both a connection and collection to upload data
                            </div>
                        )}
                    </CardContent>
                </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
                <Tabs defaultValue="files" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="files" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            File Upload
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Text Input
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="files" className="mt-4">
                        <Card>
                            <CardContent className="pt-6">
                                <UploadZone
                                    onUpload={handleFileUpload}
                                    disabled={!hasTargetsSelected || isUploading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="text" className="mt-4">
                        <Card>
                            <CardContent className="pt-6">
                                <TextInputUpload
                                    onUpload={handleTextUpload}
                                    disabled={!hasTargetsSelected || isUploading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </motion.div>
        </motion.div>
    );
}
