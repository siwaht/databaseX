import { NextResponse } from "next/server";
import { createUser, getAllUsers } from "@/lib/users";
import bcrypt from "bcryptjs";

export const runtime = 'edge';

export async function POST(request: Request) {
    try {
        const users = await getAllUsers();

        if (users.length > 0) {
            return NextResponse.json({ message: "Users already exist. Setup disabled." }, { status: 400 });
        }

        const body = await request.json();
        const { email, password, name } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const adminUser = await createUser({
            email,
            passwordHash,
            name,
            role: 'admin',
            status: 'active',
            permissions: ['manage_users', 'manage_documents', 'manage_connections', 'view_analytics']
        });

        return NextResponse.json({ message: "Admin user created successfully", user: adminUser }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Setup failed" },
            { status: 500 }
        );
    }
}
