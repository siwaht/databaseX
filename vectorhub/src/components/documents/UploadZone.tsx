"use client";

import { useState, useCallback } from "react";
import { Upload, File, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
    onUpload: (files: File[]) => void;
}

export function UploadZone({ onUpload }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [files, setFiles] = useState<File[]>([]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        setFiles((prev) => [...prev, ...droppedFiles]);
    }, []);

    const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const selectedFiles = Array.from(e.target.files);
            setFiles((prev) => [...prev, ...selectedFiles]);
        }
    }, []);

    const removeFile = (index: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleUpload = () => {
        onUpload(files);
        setFiles([]);
    };

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors",
                    isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/25"
                )}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <Upload className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">Drag & drop files here</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                    Supported: PDF, TXT, MD, DOCX, CSV, JSON
                </p>
                <div className="relative">
                    <Button variant="secondary">Browse Files</Button>
                    <input
                        type="file"
                        multiple
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={handleFileInput}
                    />
                </div>
            </div>

            {files.length > 0 && (
                <div className="space-y-2">
                    {files.map((file, i) => (
                        <div
                            key={i}
                            className="flex items-center justify-between rounded-md border p-2"
                        >
                            <div className="flex items-center space-x-2">
                                <File className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{file.name}</span>
                                <span className="text-xs text-muted-foreground">
                                    ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => removeFile(i)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    <div className="flex justify-end pt-2">
                        <Button onClick={handleUpload}>Upload {files.length} Files</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
