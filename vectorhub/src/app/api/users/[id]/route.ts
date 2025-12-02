import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { updateUser, deleteUser, getUserById } from "@/lib/users";
import bcrypt from "bcryptjs";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { email, password, name, role, permissions, status } = body;

        const updates: any = {};
        if (email) updates.email = email;
        if (name) updates.name = name;
        if (role) updates.role = role;
        if (permissions) updates.permissions = permissions;
        if (status) updates.status = status;
        if (password) {
            updates.passwordHash = await bcrypt.hash(password, 10);
        }

        await updateUser(params.id, updates);

        return NextResponse.json({ message: "User updated successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        // Prevent deleting yourself
        if (session.user.id === params.id) {
            return NextResponse.json({ message: "Cannot delete your own account" }, { status: 400 });
        }

        await deleteUser(params.id);
        return NextResponse.json({ message: "User deleted successfully" });
    } catch (error) {
        return NextResponse.json({ message: "Failed to delete user" }, { status: 500 });
    }
}
