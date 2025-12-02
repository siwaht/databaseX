import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAllUsers, createUser } from "@/lib/users";
import bcrypt from "bcryptjs";

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const users = await getAllUsers();
        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, password, name, role, permissions } = body;

        if (!email || !password || !name) {
            return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = await createUser({
            email,
            passwordHash,
            name,
            role: role || 'user',
            status: 'active',
            permissions: permissions || []
        });

        return NextResponse.json(newUser, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { message: error instanceof Error ? error.message : "Failed to create user" },
            { status: 500 }
        );
    }
}
