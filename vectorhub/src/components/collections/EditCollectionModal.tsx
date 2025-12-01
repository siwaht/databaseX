"use client";

import { useState, useEffect } from "react";
import { CollectionInfo } from "@/lib/db/adapters/base";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Layers, Save, Loader2 } from "lucide-react";

interface EditCollectionModalProps {
    collection: CollectionInfo | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (name: string, updates: Partial<CollectionInfo>) => Promise<void>;
}

export function EditCollectionModal({
    collection,
    open,
    onOpenChange,
    onSave,
}: EditCollectionModalProps) {
    const [name, setName] = useState("");
    const [distanceMetric, setDistanceMetric] = useState<string>("cosine");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (collection) {
            setName(collection.name);
            setDistanceMetric(collection.distanceMetric);
        }
    }, [collection]);

    const handleSave = async () => {
        if (!collection) return;

        setIsSaving(true);
        try {
            await onSave(collection.name, {
                name,
                distanceMetric: distanceMetric as CollectionInfo["distanceMetric"],
            });
            onOpenChange(false);
        } finally {
            setIsSaving(false);
        }
    };

    if (!collection) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Layers className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <DialogTitle>Edit Collection</DialogTitle>
                            <DialogDescription>
                                Update collection settings
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Collection Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="my_collection"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="metric">Distance Metric</Label>
                        <Select value={distanceMetric} onValueChange={setDistanceMetric}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="cosine">Cosine</SelectItem>
                                <SelectItem value="euclidean">Euclidean</SelectItem>
                                <SelectItem value="dot_product">Dot Product</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            Note: Changing the distance metric may require reindexing.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Dimensions</Label>
                        <Input
                            value={collection.dimensions.toString()}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">
                            Dimensions cannot be changed after creation.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Document Count</Label>
                        <Input
                            value={collection.documentCount.toLocaleString()}
                            disabled
                            className="bg-muted"
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving || !name}>
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

