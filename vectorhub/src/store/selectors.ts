import type { StoreState } from "./index";

export const selectConnections = (state: StoreState) => state.connections;
export const selectCollections = (state: StoreState) => state.collections;
export const selectDocuments = (state: StoreState) => state.documents;

export const selectConnectionActions = (state: StoreState) => ({
    addConnection: state.addConnection,
    removeConnection: state.removeConnection,
    updateConnection: state.updateConnection,
    getConnection: state.getConnection,
});

export const selectCollectionActions = (state: StoreState) => ({
    setCollections: state.setCollections,
    addCollection: state.addCollection,
    removeCollection: state.removeCollection,
});

export const selectDocumentActions = (state: StoreState) => ({
    addDocument: state.addDocument,
    removeDocument: state.removeDocument,
    updateDocument: state.updateDocument,
});
