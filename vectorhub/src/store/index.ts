import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionsSlice, createConnectionsSlice } from './slices/connections';
import { CollectionsSlice, createCollectionsSlice } from './slices/collections';
import { DocumentsSlice, createDocumentsSlice } from './slices/documents';

export interface StoreState extends ConnectionsSlice, CollectionsSlice, DocumentsSlice {}

export const useStore = create<StoreState>()(
    persist(
        (...a) => ({
            ...createConnectionsSlice(...a),
            ...createCollectionsSlice(...a),
            ...createDocumentsSlice(...a),
        }),
        {
            name: 'vectorhub-storage',
            version: 1,
            // Only persist serializable domain data, not any future derived values or helpers
            partialize: (state: StoreState) => ({
                connections: state.connections,
                collections: state.collections,
                documents: state.documents,
            }),
        }
    )
);
