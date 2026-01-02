import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUser, deleteUser, getUserById } from "@/lib/users";
import bcrypt from "bcryptjs";

export const runtime = 'edge';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, password, name, role, permissions, status, granularPermissions } = body;

        const updates: any = {};
        if (email) updates.email = email;
        if (name) updates.name = name;
        if (role) updates.role = role;
        if (permissions) updates.permissions = permissions;
        if (status) updates.status = status;
        if (granularPermissions !== undefined) updates.granularPermissions = granularPermissions;
        if (password) {
            updates.passwordHash = await bcrypt.hash(password, 10);
        }

        await updateUser(id, updates);

        return NextResponse.json({ message: "User updated successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Prevent deleting yourself
        if (session.user.id === id) {
            return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 });
        }

        await deleteUser(id);
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
    }
}
