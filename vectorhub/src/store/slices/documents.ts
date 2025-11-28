import { StateCreator } from 'zustand';
import { VectorDocument } from '@/lib/db/adapters/base';

export interface DocumentsSlice {
    documents: VectorDocument[];
    addDocument: (doc: VectorDocument) => void;
    removeDocument: (id: string) => void;
    updateDocument: (id: string, updates: Partial<VectorDocument>) => void;
}

export const createDocumentsSlice: StateCreator<DocumentsSlice> = (set) => ({
    documents: [],
    addDocument: (doc) => set((state) => ({
        documents: [...state.documents, doc]
    })),
    removeDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id)
    })),
    updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
        )
    })),
});
