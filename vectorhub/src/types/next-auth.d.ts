import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: 'admin' | 'user';
            permissions: string[];
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: 'admin' | 'user';
        permissions: string[];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: 'admin' | 'user';
        permissions: string[];
    }
}
