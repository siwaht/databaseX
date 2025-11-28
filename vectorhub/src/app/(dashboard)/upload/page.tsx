"use client";

import { useState } from "react";
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

export default function UploadPage() {
    const { connections, collections, addDocument } = useStore();
    const [selectedConnection, setSelectedConnection] = useState<string>("");
    const [selectedCollection, setSelectedCollection] = useState<string>("");

    const handleFileUpload = (files: File[]) => {
        // Mock processing
        files.forEach(file => {
            addDocument({
                id: Math.random().toString(36).substring(7),
                content: `Content of ${file.name}`,
                metadata: {
                    source: file.name,
                    type: file.type,
                    size: file.size,
                    created_at: new Date(),
                    connectionId: selectedConnection,
                    collectionName: selectedCollection,
                }
            });
        });
        alert(`Uploaded ${files.length} files to ${selectedCollection}`);
    };

    const handleTextUpload = (title: string, content: string) => {
        addDocument({
            id: Math.random().toString(36).substring(7),
            content: content,
            metadata: {
                source: title,
                type: 'text/plain',
                size: content.length,
                created_at: new Date(),
                connectionId: selectedConnection,
                collectionName: selectedCollection,
            }
        });
        alert(`Uploaded text "${title}" to ${selectedCollection}`);
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Upload Data</h2>
                <p className="text-muted-foreground">
                    Import files or text into your vector database.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Target Connection</Label>
                    <Select value={selectedConnection} onValueChange={setSelectedConnection}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select connection" />
                        </SelectTrigger>
                        <SelectContent>
                            {connections.map((c) => (
                                <SelectItem key={c.id} value={c.id}>
                                    {c.name} ({c.type})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Target Collection</Label>
                    <Select value={selectedCollection} onValueChange={setSelectedCollection}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select collection" />
                        </SelectTrigger>
                        <SelectContent>
                            {collections.map((c) => (
                                <SelectItem key={c.name} value={c.name}>
                                    {c.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Tabs defaultValue="files" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="files">File Upload</TabsTrigger>
                    <TabsTrigger value="text">Text Input</TabsTrigger>
                </TabsList>
                <TabsContent value="files" className="mt-4">
                    <div className="rounded-md border p-6">
                        <UploadZone onUpload={handleFileUpload} />
                    </div>
                </TabsContent>
                <TabsContent value="text" className="mt-4">
                    <div className="rounded-md border p-6">
                        <TextInputUpload onUpload={handleTextUpload} />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
