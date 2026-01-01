export interface GranularPermissions {
    allowedCollections: string[]; // Collection names user can access
    allowedTabs: string[];        // Tab paths user can view (e.g., "/collections", "/documents")
    allowedAgents: string[];      // Agent IDs whose conversations user can view
}

export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled';
    permissions: string[];
    granularPermissions?: GranularPermissions;
    createdAt: Date;
    lastLogin?: Date;
}

export interface UserSafe {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled';
    permissions: string[];
    granularPermissions?: GranularPermissions;
    createdAt: Date;
    lastLogin?: Date;
}
