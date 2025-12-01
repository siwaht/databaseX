import { StateCreator } from 'zustand';
import { ConnectionConfig } from '@/types/connections';

export interface ConnectionsSlice {
    // Unified connections (Database, MCP, Webhook)
    connections: ConnectionConfig[];
    addConnection: (connection: ConnectionConfig) => void;
    removeConnection: (id: string) => void;
    updateConnection: (id: string, updates: Partial<ConnectionConfig>) => void;
    getConnection: (id: string) => ConnectionConfig | undefined;
}

export const createConnectionsSlice: StateCreator<ConnectionsSlice> = (set, get) => ({
    // Unified connections
    connections: [],
    addConnection: (connection) => set((state) => ({
        connections: [...state.connections, connection]
    })),
    removeConnection: (id) => set((state) => ({
        connections: state.connections.filter((c) => c.id !== id)
    })),
    updateConnection: (id, updates) => set((state) => ({
        connections: state.connections.map((c) =>
            c.id === id ? { ...c, ...updates } : c
        )
    })),
    getConnection: (id) => get().connections.find((c) => c.id === id),
});
