import { StateCreator } from 'zustand';
import { CollectionInfo } from '@/lib/db/adapters/base';

export interface CollectionsSlice {
    collections: CollectionInfo[];
    setCollections: (collections: CollectionInfo[]) => void;
    addCollection: (collection: CollectionInfo) => void;
    removeCollection: (name: string) => void;
}

export const createCollectionsSlice: StateCreator<CollectionsSlice> = (set) => ({
    collections: [],
    setCollections: (collections) => set({ collections }),
    addCollection: (collection) => set((state) => ({
        collections: [...state.collections, collection]
    })),
    removeCollection: (name) => set((state) => ({
        collections: state.collections.filter((c) => c.name !== name)
    })),
});
