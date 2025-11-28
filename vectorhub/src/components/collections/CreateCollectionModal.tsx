"use client";

import { useState } from "react";
import { CreateCollectionConfig } from "@/lib/db/adapters/base";
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface CreateCollectionModalProps {
    onSubmit: (config: CreateCollectionConfig) => void;
}

export function CreateCollectionModal({ onSubmit }: CreateCollectionModalProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [dimensions, setDimensions] = useState("1536");
    const [metric, setMetric] = useState<"cosine" | "euclidean" | "dot_product">("cosine");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            name,
            dimensions: parseInt(dimensions),
            distanceMetric: metric,
        });
        setOpen(false);
        setName("");
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Collection
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Collection</DialogTitle>
                    <DialogDescription>
                        Configure the schema and index settings for your new collection.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Collection Name</Label>
                        <Input
                            id="name"
                            placeholder="my_documents"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="dimensions">Dimensions</Label>
                            <Input
                                id="dimensions"
                                type="number"
                                value={dimensions}
                                onChange={(e) => setDimensions(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="metric">Distance Metric</Label>
                            <Select value={metric} onValueChange={(v: any) => setMetric(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cosine">Cosine</SelectItem>
                                    <SelectItem value="euclidean">Euclidean</SelectItem>
                                    <SelectItem value="dot_product">Dot Product</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit">Create Collection</Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
