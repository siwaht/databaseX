import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ConnectionsSlice, createConnectionsSlice } from './slices/connections';
import { CollectionsSlice, createCollectionsSlice } from './slices/collections';
import { DocumentsSlice, createDocumentsSlice } from './slices/documents';

interface StoreState extends ConnectionsSlice, CollectionsSlice, DocumentsSlice { }

export const useStore = create<StoreState>()(
    persist(
        (...a) => ({
            ...createConnectionsSlice(...a),
            ...createCollectionsSlice(...a),
            ...createDocumentsSlice(...a),
        }),
        {
            name: 'vectorhub-storage',
        }
    )
);
