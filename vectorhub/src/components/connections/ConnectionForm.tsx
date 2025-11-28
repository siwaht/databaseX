"use client";

import { useState } from "react";
import { ConnectionConfig, VectorDBType } from "@/types/connections";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface ConnectionFormProps {
    onSubmit: (data: Partial<ConnectionConfig>) => void;
    onCancel: () => void;
}

export function ConnectionForm({ onSubmit, onCancel }: ConnectionFormProps) {
    const [name, setName] = useState("");
    const [type, setType] = useState<VectorDBType>("chromadb");

    // Mock config fields based on type
    const [host, setHost] = useState("localhost");
    const [port, setPort] = useState("8000");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            type,
            status: "connected", // Mock success
            lastSync: new Date(),
            config: {
                host,
                port: parseInt(port),
            } as any // Simplified for mock
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Connection Name</Label>
                <Input
                    id="name"
                    placeholder="My Vector DB"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="type">Database Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as VectorDBType)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="chromadb">ChromaDB</SelectItem>
                        <SelectItem value="mongodb_atlas">MongoDB Atlas</SelectItem>
                        <SelectItem value="pinecone">Pinecone</SelectItem>
                        <SelectItem value="weaviate">Weaviate</SelectItem>
                        <SelectItem value="qdrant">Qdrant</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="host">Host</Label>
                    <Input
                        id="host"
                        value={host}
                        onChange={(e) => setHost(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input
                        id="port"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Connect</Button>
            </div>
        </form>
    );
}
