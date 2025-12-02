import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";
import { User } from "@/types/user";

if (!process.env.NEXTAUTH_SECRET) {
    console.warn("NEXTAUTH_SECRET is not set");
}

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

                const connectionString = process.env.MONGODB_URI;
                if (!connectionString) {
                    throw new Error("MONGODB_URI is not set");
                }

                const client = new MongoClient(connectionString);

                try {
                    await client.connect();
                    const db = client.db(); // Uses default DB from URI
                    const user = await db.collection<User>("users").findOne({ email: credentials.email });

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

                    // Update last login
                    await db.collection("users").updateOne(
                        { id: user.id },
                        { $set: { lastLogin: new Date() } }
                    );

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        role: user.role,
                        permissions: user.permissions
                    };
                } finally {
                    await client.close();
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
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).role = token.role;
                (session.user as any).permissions = token.permissions;
                (session.user as any).id = token.id;
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
