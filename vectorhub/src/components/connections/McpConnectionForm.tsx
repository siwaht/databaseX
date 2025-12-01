"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface McpConnectionFormValues {
    name: string;
    endpoint: string;
    tags: string[];
}

interface McpConnectionFormProps {
    onSubmit: (data: McpConnectionFormValues) => void;
    onCancel: () => void;
}

export function McpConnectionForm({ onSubmit, onCancel }: McpConnectionFormProps) {
    const [name, setName] = useState("");
    const [endpoint, setEndpoint] = useState("");
    const [tagsInput, setTagsInput] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const tags = tagsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        onSubmit({
            name,
            endpoint,
            tags,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="mcp-name">Connection Name</Label>
                <Input
                    id="mcp-name"
                    placeholder="Docs MCP"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="mcp-endpoint">Endpoint URL</Label>
                <Input
                    id="mcp-endpoint"
                    placeholder="https://your-mcp-endpoint.com/api"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="mcp-tags">Tags (optional)</Label>
                <Textarea
                    id="mcp-tags"
                    placeholder="analytics,internal,staging"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    rows={2}
                />
                <p className="text-xs text-muted-foreground">
                    Comma-separated list used for organizing MCP connections.
                </p>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Connect MCP</Button>
            </div>
        </form>
    );
}
