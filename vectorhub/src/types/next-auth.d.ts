import { DefaultSession, DefaultUser } from "next-auth";
import { GranularPermissions } from "./user";

declare module "next-auth" {
    interface Session {
        user: {
            id: string;
            role: 'admin' | 'user';
            permissions: string[];
            granularPermissions?: GranularPermissions;
        } & DefaultSession["user"];
    }

    interface User extends DefaultUser {
        role: 'admin' | 'user';
        permissions: string[];
        granularPermissions?: GranularPermissions;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        id: string;
        role: 'admin' | 'user';
        permissions: string[];
        granularPermissions?: GranularPermissions;
    }
}
