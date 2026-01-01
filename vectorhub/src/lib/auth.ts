import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import { User } from "@/types/user";

if (!process.env.NEXTAUTH_SECRET) {
    console.warn("NEXTAUTH_SECRET is not set");
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                try {
                    const result = await pool.query(
                        `SELECT id, email, password_hash as "passwordHash", name, role, status, permissions, granular_permissions as "granularPermissions" FROM users WHERE email = $1`,
                        [credentials.email]
                    );

                    const user = result.rows[0] as User | undefined;

                    if (!user) {
                        return null;
                    }

                    if (user.status === 'disabled') {
                        throw new Error("Account is disabled");
                    }

                    const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

                    if (!isValid) {
                        return null;
                    }

                    await pool.query(
                        `UPDATE users SET last_login = NOW() WHERE id = $1`,
                        [user.id]
                    );

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        permissions: user.permissions,
                        granularPermissions: user.granularPermissions
                    };
                } catch (error) {
                    console.error("Auth error:", error);
                    throw error;
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.permissions = user.permissions;
                token.id = user.id;
                token.granularPermissions = user.granularPermissions;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.role = token.role;
                session.user.permissions = token.permissions;
                session.user.id = token.id;
                session.user.granularPermissions = token.granularPermissions;
            }
            return session;
        }
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: "jwt",
    },
};
