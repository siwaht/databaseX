"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";

interface TextInputUploadProps {
    onUpload: (title: string, content: string) => void;
    disabled?: boolean;
}

export function TextInputUpload({ onUpload, disabled }: TextInputUploadProps) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (title.trim() && content.trim()) {
            onUpload(title, content);
            setTitle("");
            setContent("");
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                        id="title"
                        placeholder="e.g., Meeting Notes 2024-03-20"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        disabled={disabled}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                        id="content"
                        placeholder="Paste your text content here..."
                        className="min-h-[200px]"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        disabled={disabled}
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button
                    type="submit"
                    disabled={disabled || !title.trim() || !content.trim()}
                >
                    <FileText className="mr-2 h-4 w-4" />
                    Upload Text
                </Button>
            </div>
        </form>
    );
}
