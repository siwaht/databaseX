import { StateCreator } from 'zustand';
import { VectorDocument } from '@/lib/db/adapters/base';

export interface UploadPreferences {
    selectedConnection: string;
    selectedCollection: string;
    syncToConnections: Record<string, boolean>;
}

export interface DocumentsSlice {
    documents: VectorDocument[];
    uploadPreferences: UploadPreferences;
    addDocument: (doc: VectorDocument) => void;
    addDocuments: (docs: VectorDocument[]) => void;
    removeDocument: (id: string) => void;
    updateDocument: (id: string, updates: Partial<VectorDocument>) => void;
    setDocuments: (docs: VectorDocument[]) => void;
    clearDocuments: () => void;
    setUploadPreferences: (prefs: Partial<UploadPreferences>) => void;
}

export const createDocumentsSlice: StateCreator<DocumentsSlice> = (set) => ({
    documents: [],
    uploadPreferences: {
        selectedConnection: '',
        selectedCollection: '',
        syncToConnections: {},
    },
    addDocument: (doc) => set((state) => {
        // Avoid duplicates
        if (state.documents.some(d => d.id === doc.id)) {
            return state;
        }
        return { documents: [...state.documents, doc] };
    }),
    addDocuments: (docs) => set((state) => {
        const existingIds = new Set(state.documents.map(d => d.id));
        const newDocs = docs.filter(d => !existingIds.has(d.id));
        return { documents: [...state.documents, ...newDocs] };
    }),
    removeDocument: (id) => set((state) => ({
        documents: state.documents.filter((d) => d.id !== id)
    })),
    updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map((d) =>
            d.id === id ? { ...d, ...updates } : d
        )
    })),
    setDocuments: (docs) => set({ documents: docs }),
    clearDocuments: () => set({ documents: [] }),
    setUploadPreferences: (prefs) => set((state) => ({
        uploadPreferences: { ...state.uploadPreferences, ...prefs }
    })),
});
