"use client";

import { useStore } from "@/store";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CreateCollectionModal } from "@/components/collections/CreateCollectionModal";
import { CreateCollectionConfig } from "@/lib/db/adapters/base";

export default function CollectionsPage() {
    const { collections, addCollection, removeCollection } = useStore();

    const handleCreate = (config: CreateCollectionConfig) => {
        addCollection({
            name: config.name,
            dimensions: config.dimensions,
            distanceMetric: config.distanceMetric,
            documentCount: 0,
        });
    };

    const handleEdit = (name: string) => {
        console.log("Edit collection", name);
    };

    const handleViewStats = (name: string) => {
        console.log("View stats", name);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Collections</h2>
                    <p className="text-muted-foreground">
                        Manage your vector collections and indices.
                    </p>
                </div>
                <CreateCollectionModal onSubmit={handleCreate} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {collections.map((collection) => (
                    <CollectionCard
                        key={collection.name}
                        collection={collection}
                        onDelete={removeCollection}
                        onEdit={handleEdit}
                        onViewStats={handleViewStats}
                    />
                ))}
                {collections.length === 0 && (
                    <div className="col-span-full flex h-[450px] flex-col items-center justify-center rounded-md border border-dashed text-center">
                        <h3 className="mt-4 text-lg font-semibold">No collections found</h3>
                        <p className="mb-4 text-sm text-muted-foreground">
                            Create a collection to start storing vectors.
                        </p>
                        <CreateCollectionModal onSubmit={handleCreate} />
                    </div>
                )}
            </div>
        </div>
    );
}
