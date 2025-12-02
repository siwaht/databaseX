"use client";

import { useState, useEffect } from "react";
import { UserSafe } from "@/types/user";
import { UserList } from "@/components/users/UserList";
import { UserDialog } from "@/components/users/UserDialog";
import { Button } from "@/components/ui/button";
import { Plus, Users as UsersIcon } from "lucide-react";
import { toast } from "sonner";

export default function UsersPage() {
    const [users, setUsers] = useState<UserSafe[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserSafe | null>(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/users");
            if (!res.ok) {
                if (res.status === 401) {
                    throw new Error("Unauthorized");
                }
                throw new Error("Failed to fetch users");
            }
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to load users");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleCreate = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEdit = (user: UserSafe) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        <UsersIcon className="h-6 w-6" />
                        User Management
                    </h2>
                    <p className="text-muted-foreground">
                        Manage system users, roles, and permissions.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <UserList users={users} onEdit={handleEdit} onRefresh={fetchUsers} />
            )}

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
                onSuccess={fetchUsers}
            />
        </div>
    );
}
