export interface User {
    id: string;
    email: string;
    passwordHash: string;
    name: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled';
    permissions: string[];
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
    createdAt: Date;
    lastLogin?: Date;
}
