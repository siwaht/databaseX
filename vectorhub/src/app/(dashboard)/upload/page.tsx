"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useStore } from "@/store";
import { UploadZone } from "@/components/documents/UploadZone";
import { TextInputUpload } from "@/components/documents/TextInputUpload";
import { ScrapeUpload, ScrapedDocument } from "@/components/documents/ScrapeUpload";
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
import { Upload, FileText, AlertCircle, Webhook, Cpu, Database, CheckCircle2, Globe, RefreshCw, ChevronDown, Settings2 } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { VectorDocument } from "@/lib/db/adapters/base";
import { addDocumentsApi } from "@/lib/api/documents";
import { listCollectionsApi } from "@/lib/api/collections";
import { splitText } from "@/lib/chunking";



export default function UploadPage() {
    // Session for granular permissions
    const { data: session } = useSession();
    
    const connections = useStore((state) => state.connections);
    const collections = useStore((state) => state.collections);
    const addDocument = useStore((state) => state.addDocument);
    const setCollections = useStore((state) => state.setCollections);
    const uploadPreferences = useStore((state) => state.uploadPreferences);
    const setUploadPreferences = useStore((state) => state.setUploadPreferences);

    // Filter collections based on granular permissions
    const filteredCollections = useMemo(() => {
        // Admins see all collections
        if (session?.user?.role === 'admin') return collections;
        
        // If no granular permissions or empty allowedCollections, show all
        const allowedCollections = session?.user?.granularPermissions?.allowedCollections;
        if (!allowedCollections || allowedCollections.length === 0) return collections;
        
        // Filter to only allowed collections
        return collections.filter(col => allowedCollections.includes(col.name));
    }, [collections, session?.user?.role, session?.user?.granularPermissions?.allowedCollections]);

    // Use persisted preferences from store
    const selectedConnection = uploadPreferences.selectedConnection;
    const selectedCollection = uploadPreferences.selectedCollection;
    const syncToConnections = uploadPreferences.syncToConnections;

    const setSelectedConnection = useCallback((id: string) => {
        setUploadPreferences({ selectedConnection: id });
    }, [setUploadPreferences]);

    const setSelectedCollection = useCallback((name: string) => {
        setUploadPreferences({ selectedCollection: name });
    }, [setUploadPreferences]);

    const setSyncToConnections = useCallback((syncMap: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => {
        if (typeof syncMap === 'function') {
            setUploadPreferences({ syncToConnections: syncMap(uploadPreferences.syncToConnections) });
        } else {
            setUploadPreferences({ syncToConnections: syncMap });
        }
    }, [setUploadPreferences, uploadPreferences.syncToConnections]);

    const [isUploading, setIsUploading] = useState(false);
    const [isLoadingCollections, setIsLoadingCollections] = useState(false);

    // Chunking settings
    const [chunkSize, setChunkSize] = useState([1000]);
    const [chunkOverlap, setChunkOverlap] = useState([200]);
    const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

    // Fetch collections when connection changes
    useEffect(() => {
        if (!selectedConnection) {
            setCollections([]);
            return;
        }

        const connection = connections.find((c) => c.id === selectedConnection);
        if (!connection) return;

        // Don't fetch for webhook/mcp connections
        if (connection.type === "webhook" || connection.type === "mcp") {
            return;
        }

        setIsLoadingCollections(true);
        listCollectionsApi(connection)
            .then((data) => {
                setCollections(data);
                // Auto-select first collection if none selected
                if (data.length > 0 && !selectedCollection) {
                    setSelectedCollection(data[0].name);
                }
            })
            .catch((err) => {
                console.error("Failed to fetch collections:", err);
                toast.error("Failed to load collections", {
                    description: "Could not fetch collections from the database.",
                });
            })
            .finally(() => setIsLoadingCollections(false));
    }, [selectedConnection, connections, setCollections, selectedCollection, setSelectedCollection]);

    const webhookConnections = useMemo(
        () => connections.filter((c) => c.type === "webhook"),
        [connections]
    );

    const mcpConnections = useMemo(
        () => connections.filter((c) => c.type === "mcp"),
        [connections]
    );

    const hasSyncConnections = webhookConnections.length > 0 || mcpConnections.length > 0;
    const selectedSyncConnections = Object.entries(syncToConnections)
        .filter(([, enabled]) => enabled)
        .map(([id]) => id);

    const toggleSyncConnection = (id: string) => {
        setSyncToConnections((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const getConnectionIcon = (type: string) => {
        switch (type) {
            case "webhook":
                return <Webhook className="h-4 w-4" />;
            case "mcp":
                return <Cpu className="h-4 w-4" />;
            default:
                return <Database className="h-4 w-4" />;
        }
    };

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
        if (!selectedConnection) return;
        const connection = connections.find((c) => c.id === selectedConnection);
        if (!connection) return;

        try {
            const latest = await listCollectionsApi(connection);
            setCollections(latest);
        } catch {
            // Silent fail - use existing data
        }
    }, [selectedConnection, connections, setCollections]);

    const syncToExternalConnections = useCallback(
        async (docs: VectorDocument[], collection: string) => {
            if (selectedSyncConnections.length === 0) return;

            const syncPromises = selectedSyncConnections.map(async (connId) => {
                const conn = connections.find((c) => c.id === connId);
                if (!conn) return { connId, success: false, error: "Connection not found" };

                try {
                    const response = await fetch("/api/documents/sync", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            connectionId: connId,
                            collection,
                            documents: docs,
                        }),
                    });

                    if (!response.ok) {
                        throw new Error(`Sync failed: ${response.statusText}`);
                    }

                    return { connId, success: true, name: conn.name };
                } catch (error) {
                    return { connId, success: false, name: conn.name, error: (error as Error).message };
                }
            });

            const results = await Promise.all(syncPromises);
            const successful = results.filter((r) => r.success);
            const failed = results.filter((r) => !r.success);

            if (successful.length > 0) {
                toast.success(`Synced to ${successful.length} connection(s)`, {
                    description: successful.map((r) => r.name).join(", "),
                });
            }

            if (failed.length > 0) {
                toast.error(`Failed to sync to ${failed.length} connection(s)`, {
                    description: failed.map((r) => r.name).join(", "),
                });
            }
        },
        [selectedSyncConnections, connections]
    );



    const handleFileUpload = useCallback(
        async (files: File[], options?: { chunkSize: number; chunkOverlap: number }) => {
            if (!ensureTargetsSelected()) return;

            setIsUploading(true);
            const toastId = toast.loading(`Processing ${files.length} file(s)...`);

            try {
                let successCount = 0;
                let failCount = 0;

                for (const file of files) {
                    try {
                        // 1. Parse File
                        const formData = new FormData();
                        formData.append("file", file);

                        const parseRes = await fetch("/api/parse", {
                            method: "POST",
                            body: formData,
                        });

                        if (!parseRes.ok) {
                            throw new Error(`Failed to parse ${file.name}`);
                        }

                        const { text, ...metadata } = await parseRes.json();

                        if (!text) {
                            throw new Error(`No text extracted from ${file.name}`);
                        }

                        // 2. Upload with Chunking Options (Server handles Chunk -> Embed -> Upload)
                        const docs: VectorDocument[] = [{
                            id: crypto.randomUUID(),
                            content: text,
                            metadata: {
                                source: file.name,
                                type: file.type,
                                size: file.size,
                                created_at: new Date(),
                                connectionId: selectedConnection,
                                collectionName: selectedCollection,
                                ...metadata
                            },
                        }];

                        const connection = connections.find((c) => c.id === selectedConnection);
                        const returnedIds = await addDocumentsApi(selectedCollection, docs, connection, options);

                        // Update local store with returned IDs (chunks or single doc)
                        // Note: If server chunks, we might not get individual chunk details back here perfectly without a refetch,
                        // but we get IDs. For now, we add the main doc logic or we could refetch.
                        // Ideally, we refetch collections.

                        successCount++;
                    } catch (error) {
                        console.error(`Error processing ${file.name}:`, error);
                        failCount++;
                        toast.error(`Failed to process ${file.name}`);
                    }
                }

                await syncCollectionsFromDb();
                // Note: Syncing to external connections might need refactoring if we want to sync the *chunks*
                // generated by the server. For now, we skip manual sync here as the server *could* handle it,
                // or we accept we sync the raw text document.
                // await syncToExternalConnections(allDocs, selectedCollection); 

                if (successCount > 0) {
                    toast.success(`Uploaded ${successCount} file(s)`, {
                        id: toastId,
                        description: failCount > 0 ? `${failCount} failed.` : "All files processed successfully.",
                    });
                } else {
                    toast.error("Upload failed", { id: toastId });
                }

            } catch (error) {
                toast.error("Upload failed", {
                    id: toastId,
                    description: error instanceof Error ? error.message : "Unknown error",
                });
            } finally {
                setIsUploading(false);
            }
        },
        [
            ensureTargetsSelected,
            selectedConnection,
            selectedCollection,
            syncCollectionsFromDb,
            connections,
        ]
    );

    const handleTextUpload = useCallback(
        async (title: string, content: string, options?: { chunkSize: number; chunkOverlap: number }) => {
            if (!ensureTargetsSelected()) return;

            setIsUploading(true);
            const toastId = toast.loading("Processing text...");

            try {
                // Send raw text to server for Chunk -> Embed -> Upload
                const docs: VectorDocument[] = [{
                    id: crypto.randomUUID(),
                    content: content,
                    metadata: {
                        source: title,
                        type: "text/plain",
                        size: content.length,
                        created_at: new Date(),
                        connectionId: selectedConnection,
                        collectionName: selectedCollection,
                    },
                }];

                const connection = connections.find((c) => c.id === selectedConnection);
                const returnedIds = await addDocumentsApi(selectedCollection, docs, connection, options);

                await syncCollectionsFromDb();
                // await syncToExternalConnections(docs, selectedCollection);

                toast.success("Text uploaded", {
                    id: toastId,
                    description: `Added "${title}" to "${selectedCollection}".`,
                });
            } catch (error) {
                toast.error("Upload failed", {
                    id: toastId,
                    description: error instanceof Error ? error.message : "Could not upload text. Please try again.",
                });
            } finally {
                setIsUploading(false);
            }
        },
        [
            ensureTargetsSelected,
            selectedConnection,
            selectedCollection,
            syncCollectionsFromDb,
            // syncToExternalConnections,
            connections,
        ]
    );

    const handleScrapeUpload = useCallback(
        async (scrapedDocs: ScrapedDocument[], options?: { chunkSize: number; chunkOverlap: number }) => {
            if (!ensureTargetsSelected()) return;

            setIsUploading(true);
            const toastId = toast.loading(`Processing ${scrapedDocs.length} scraped document(s)...`);

            try {
                const docs: VectorDocument[] = scrapedDocs.map(doc => ({
                    id: crypto.randomUUID(),
                    content: doc.content,
                    metadata: {
                        source: doc.url,
                        title: doc.title,
                        type: doc.metadata.type,
                        wordCount: doc.metadata.wordCount,
                        scrapedAt: doc.metadata.scrapedAt,
                        documentType: doc.metadata.documentType,
                        created_at: new Date(),
                        connectionId: selectedConnection,
                        collectionName: selectedCollection,
                        originalId: doc.id
                    }
                }));

                const connection = connections.find((c) => c.id === selectedConnection);
                const returnedIds = await addDocumentsApi(selectedCollection, docs, connection, options);

                await syncCollectionsFromDb();
                // await syncToExternalConnections(docs, selectedCollection);

                toast.success(`${scrapedDocs.length} document(s) processed`, {
                    id: toastId,
                    description: `Added to "${selectedCollection}".`,
                });
            } catch (error) {
                toast.error("Upload failed", {
                    id: toastId,
                    description: error instanceof Error ? error.message : "Could not upload scraped content. Please try again.",
                });
            } finally {
                setIsUploading(false);
            }
        },
        [
            ensureTargetsSelected,
            selectedConnection,
            selectedCollection,
            syncCollectionsFromDb,
            // syncToExternalConnections,
            connections,
        ]
    );

    const hasTargetsSelected = selectedConnection && selectedCollection;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tight">Upload Data</h2>
                <p className="text-muted-foreground">
                    Import files or text into your vector database.
                </p>
            </div>

            <div className="space-y-6">
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
                                        {filteredCollections.length === 0 ? (
                                            <SelectItem value="_empty" disabled>
                                                No collections available
                                            </SelectItem>
                                        ) : (
                                            filteredCollections.map((c) => (
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
            </div>

            {hasSyncConnections && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                Sync to External Services
                                {selectedSyncConnections.length > 0 && (
                                    <Badge variant="secondary" className="ml-2">
                                        {selectedSyncConnections.length} selected
                                    </Badge>
                                )}
                            </CardTitle>
                            <CardDescription>
                                Optionally sync uploaded data to webhook and MCP connections
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {webhookConnections.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Webhook className="h-4 w-4" />
                                            Webhook Connections
                                        </Label>
                                        <div className="space-y-2">
                                            {webhookConnections.map((conn) => (
                                                <div
                                                    key={conn.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                                            <Webhook className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{conn.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {conn.status === "connected" ? "Ready to sync" : "Not connected"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={syncToConnections[conn.id] || false}
                                                        onCheckedChange={() => toggleSyncConnection(conn.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {mcpConnections.length > 0 && (
                                    <div className="space-y-3">
                                        <Label className="flex items-center gap-2 text-sm font-medium">
                                            <Cpu className="h-4 w-4" />
                                            MCP Connections
                                        </Label>
                                        <div className="space-y-2">
                                            {mcpConnections.map((conn) => (
                                                <div
                                                    key={conn.id}
                                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                                                            <Cpu className="h-4 w-4 text-muted-foreground" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-sm">{conn.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {conn.status === "connected" ? "Ready to sync" : "Not connected"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Switch
                                                        checked={syncToConnections[conn.id] || false}
                                                        onCheckedChange={() => toggleSyncConnection(conn.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {selectedSyncConnections.length > 0 && (
                                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 pt-2">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Data will be synced to {selectedSyncConnections.length} connection(s) on upload
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="space-y-6">
                <Collapsible
                    open={isAdvancedOpen}
                    onOpenChange={setIsAdvancedOpen}
                    className="w-full space-y-2"
                >
                    <div className="flex items-center justify-between px-4 py-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Settings2 className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Advanced Settings</span>
                        </div>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-9 p-0">
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isAdvancedOpen ? "rotate-180" : ""}`} />
                                <span className="sr-only">Toggle</span>
                            </Button>
                        </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent className="space-y-2">
                        <Card>
                            <CardContent className="pt-6 space-y-6">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Chunk Size</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Characters per chunk (default: 1000)
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium tabular-nums">
                                            {chunkSize[0]}
                                        </span>
                                    </div>
                                    <Slider
                                        value={chunkSize}
                                        onValueChange={setChunkSize}
                                        min={100}
                                        max={4000}
                                        step={100}
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label>Chunk Overlap</Label>
                                            <p className="text-xs text-muted-foreground">
                                                Overlap between chunks (default: 200)
                                            </p>
                                        </div>
                                        <span className="text-sm font-medium tabular-nums">
                                            {chunkOverlap[0]}
                                        </span>
                                    </div>
                                    <Slider
                                        value={chunkOverlap}
                                        onValueChange={setChunkOverlap}
                                        min={0}
                                        max={1000}
                                        step={50}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </CollapsibleContent>
                </Collapsible>
            </div>

            <div className="space-y-6">
                <Tabs defaultValue="text" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="files" className="flex items-center gap-2">
                            <Upload className="h-4 w-4" />
                            File Upload
                        </TabsTrigger>
                        <TabsTrigger value="text" className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Text Input
                        </TabsTrigger>
                        <TabsTrigger value="scrape" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Scrape & Crawl
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="files" className="mt-4">
                        <Card>
                            <CardContent className="pt-6">
                                <UploadZone
                                    onUpload={(files) => handleFileUpload(files, { chunkSize: chunkSize[0], chunkOverlap: chunkOverlap[0] })}
                                    disabled={!hasTargetsSelected || isUploading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="text" className="mt-4">
                        <Card>
                            <CardContent className="pt-6">
                                <TextInputUpload
                                    onUpload={(title, content) => handleTextUpload(title, content, { chunkSize: chunkSize[0], chunkOverlap: chunkOverlap[0] })}
                                    disabled={!hasTargetsSelected || isUploading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                    <TabsContent value="scrape" className="mt-4">
                        <Card>
                            <CardContent className="pt-6">
                                <ScrapeUpload
                                    onUpload={(docs) => handleScrapeUpload(docs, { chunkSize: chunkSize[0], chunkOverlap: chunkOverlap[0] })}
                                    disabled={!hasTargetsSelected || isUploading}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
