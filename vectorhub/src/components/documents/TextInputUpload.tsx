"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TextInputUploadProps {
    onUpload: (title: string, content: string) => void;
}

export function TextInputUpload({ onUpload }: TextInputUploadProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title && content) {
            onUpload(title, content);
            setTitle("");
            setContent("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    placeholder="My Notes"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea
                    id="content"
                    placeholder="Enter or paste your text content here..."
                    className="min-h-[200px]"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                />
                <p className="text-xs text-muted-foreground text-right">
                    Word count: {content.split(/\s+/).filter(Boolean).length}
                </p>
            </div>
            <div className="flex justify-end">
                <Button type="submit">Upload Text</Button>
            </div>
        </form>
    );
}
