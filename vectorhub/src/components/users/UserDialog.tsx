"use client";

import { useState, useEffect } from "react";
import { UserSafe } from "@/types/user";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user?: UserSafe | null;
    onSuccess: () => void;
}

const AVAILABLE_PERMISSIONS = [
    { id: "manage_users", label: "Manage Users" },
    { id: "manage_documents", label: "Manage Documents" },
    { id: "manage_connections", label: "Manage Connections" },
    { id: "view_analytics", label: "View Analytics" },
];

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user" as "admin" | "user",
        status: "active" as "active" | "disabled",
        permissions: [] as string[],
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: "", // Don't populate password on edit
                role: user.role,
                status: user.status,
                permissions: user.permissions || [],
            });
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "user",
                status: "active",
                permissions: [],
            });
        }
    }, [user, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = user ? `/api/users/${user.id}` : "/api/users";
            const method = user ? "PUT" : "POST";

            const body = { ...formData };
            if (!body.password) delete (body as any).password; // Don't send empty password on update

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.message || "Failed to save user");
            }

            toast.success(user ? "User updated successfully" : "User created successfully");
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    const togglePermission = (permissionId: string) => {
        setFormData(prev => {
            const permissions = prev.permissions.includes(permissionId)
                ? prev.permissions.filter(p => p !== permissionId)
                : [...prev.permissions, permissionId];
            return { ...prev, permissions };
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Update user details and permissions." : "Add a new user to the system."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">{user ? "Password (leave blank to keep current)" : "Password"}</Label>
                        <Input
                            id="password"
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required={!user}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="role">Role</Label>
                            <Select
                                value={formData.role}
                                onValueChange={(value: "admin" | "user") => setFormData({ ...formData, role: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={formData.status}
                                onValueChange={(value: "active" | "disabled") => setFormData({ ...formData, status: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="active">Active</SelectItem>
                                    <SelectItem value="disabled">Disabled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Permissions</Label>
                        <div className="grid grid-cols-2 gap-2">
                            {AVAILABLE_PERMISSIONS.map((perm) => (
                                <div key={perm.id} className="flex items-center space-x-2">
                                    <Switch
                                        id={perm.id}
                                        checked={formData.permissions.includes(perm.id)}
                                        onCheckedChange={() => togglePermission(perm.id)}
                                    />
                                    <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer">
                                        {perm.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "Saving..." : "Save"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
