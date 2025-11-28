"use client";

import { CollectionInfo } from "@/lib/db/adapters/base";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, Trash2, Edit, BarChart3 } from "lucide-react";

interface CollectionCardProps {
    collection: CollectionInfo;
    onDelete: (name: string) => void;
    onEdit: (name: string) => void;
    onViewStats: (name: string) => void;
}

export function CollectionCard({ collection, onDelete, onEdit, onViewStats }: CollectionCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    <div className="flex items-center space-x-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span>{collection.name}</span>
                    </div>
                </CardTitle>
                <Badge variant="outline">{collection.distanceMetric}</Badge>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{collection.documentCount.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                    Vectors • {collection.dimensions} dimensions
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => onViewStats(collection.name)}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Stats
                </Button>
                <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(collection.name)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(collection.name)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
