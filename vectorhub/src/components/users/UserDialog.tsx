"use client";

import { useState, useEffect } from "react";
import { UserSafe, GranularPermissions } from "@/types/user";
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
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";

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

const AVAILABLE_TABS = [
    { id: "/", label: "Dashboard" },
    { id: "/connections", label: "Connections" },
    { id: "/collections", label: "Collections" },
    { id: "/documents", label: "Documents" },
    { id: "/upload", label: "Upload" },
    { id: "/search", label: "Search" },
    { id: "/bookings", label: "Bookings" },
    { id: "/conversations", label: "Conversations" },
    { id: "/integrations", label: "Integrations" },
    { id: "/settings", label: "Settings" },
];

interface ElevenLabsAgent {
    agent_id: string;
    name: string;
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("basic");
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "user" as "admin" | "user",
        status: "active" as "active" | "disabled",
        permissions: [] as string[],
        granularPermissions: {
            allowedCollections: [] as string[],
            allowedTabs: [] as string[],
            allowedAgents: [] as string[],
        } as GranularPermissions,
    });

    // Data for granular permissions
    const [collections, setCollections] = useState<string[]>([]);
    const [agents, setAgents] = useState<ElevenLabsAgent[]>([]);
    const [loadingCollections, setLoadingCollections] = useState(false);
    const [loadingAgents, setLoadingAgents] = useState(false);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                password: "",
                role: user.role,
                status: user.status,
                permissions: user.permissions || [],
                granularPermissions: user.granularPermissions || {
                    allowedCollections: [],
                    allowedTabs: [],
                    allowedAgents: [],
                },
            });
        } else {
            setFormData({
                name: "",
                email: "",
                password: "",
                role: "user",
                status: "active",
                permissions: [],
                granularPermissions: {
                    allowedCollections: [],
                    allowedTabs: [],
                    allowedAgents: [],
                },
            });
        }
    }, [user, open]);

    // Fetch collections when dialog opens
    useEffect(() => {
        if (open) {
            fetchCollections();
            fetchAgents();
        }
    }, [open]);

    const fetchCollections = async () => {
        setLoadingCollections(true);
        try {
            const res = await fetch('/api/collections');
            if (res.ok) {
                const data = await res.json();
                setCollections(data.map((c: any) => c.name));
            }
        } catch (error) {
            console.error('Failed to fetch collections:', error);
        } finally {
            setLoadingCollections(false);
        }
    };

    const fetchAgents = async () => {
        setLoadingAgents(true);
        try {
            const elApiKey = localStorage.getItem('elevenlabs_api_key');
            const picaSecret = localStorage.getItem('pica_secret_key');
            const elConnectionKey = localStorage.getItem('pica_elevenlabs_connection_key');

            if (elApiKey || (picaSecret && elConnectionKey)) {
                const res = await fetch('/api/elevenlabs?action=agents', {
                    headers: {
                        'x-elevenlabs-api-key': elApiKey || '',
                        'x-pica-secret': picaSecret || '',
                        'x-pica-connection-key': elConnectionKey || '',
                    },
                });
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data.agents || []);
                }
            }
        } catch (error) {
            console.error('Failed to fetch agents:', error);
        } finally {
            setLoadingAgents(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const url = user ? `/api/users/${user.id}` : "/api/users";
            const method = user ? "PUT" : "POST";

            const body = { ...formData };
            if (!body.password) delete (body as any).password;

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

    const toggleCollection = (collectionName: string) => {
        setFormData(prev => {
            const allowedCollections = prev.granularPermissions.allowedCollections.includes(collectionName)
                ? prev.granularPermissions.allowedCollections.filter(c => c !== collectionName)
                : [...prev.granularPermissions.allowedCollections, collectionName];
            return {
                ...prev,
                granularPermissions: { ...prev.granularPermissions, allowedCollections }
            };
        });
    };

    const toggleTab = (tabId: string) => {
        setFormData(prev => {
            const allowedTabs = prev.granularPermissions.allowedTabs.includes(tabId)
                ? prev.granularPermissions.allowedTabs.filter(t => t !== tabId)
                : [...prev.granularPermissions.allowedTabs, tabId];
            return {
                ...prev,
                granularPermissions: { ...prev.granularPermissions, allowedTabs }
            };
        });
    };

    const toggleAgent = (agentId: string) => {
        setFormData(prev => {
            const allowedAgents = prev.granularPermissions.allowedAgents.includes(agentId)
                ? prev.granularPermissions.allowedAgents.filter(a => a !== agentId)
                : [...prev.granularPermissions.allowedAgents, agentId];
            return {
                ...prev,
                granularPermissions: { ...prev.granularPermissions, allowedAgents }
            };
        });
    };

    const selectAllTabs = () => {
        setFormData(prev => ({
            ...prev,
            granularPermissions: {
                ...prev.granularPermissions,
                allowedTabs: AVAILABLE_TABS.map(t => t.id)
            }
        }));
    };

    const clearAllTabs = () => {
        setFormData(prev => ({
            ...prev,
            granularPermissions: { ...prev.granularPermissions, allowedTabs: [] }
        }));
    };

    const selectAllCollections = () => {
        setFormData(prev => ({
            ...prev,
            granularPermissions: {
                ...prev.granularPermissions,
                allowedCollections: collections
            }
        }));
    };

    const clearAllCollections = () => {
        setFormData(prev => ({
            ...prev,
            granularPermissions: { ...prev.granularPermissions, allowedCollections: [] }
        }));
    };

    const selectAllAgents = () => {
        setFormData(prev => ({
            ...prev,
            granularPermissions: {
                ...prev.granularPermissions,
                allowedAgents: agents.map(a => a.agent_id)
            }
        }));
    };

    const clearAllAgents = () => {
        setFormData(prev => ({
            ...prev,
            granularPermissions: { ...prev.granularPermissions, allowedAgents: [] }
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{user ? "Edit User" : "Create User"}</DialogTitle>
                    <DialogDescription>
                        {user ? "Update user details and permissions." : "Add a new user to the system."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex-1 overflow-hidden flex flex-col">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="basic">Basic Info</TabsTrigger>
                            <TabsTrigger value="permissions">Permissions</TabsTrigger>
                            <TabsTrigger value="granular">Access Control</TabsTrigger>
                        </TabsList>

                        <ScrollArea className="flex-1 pr-4">
                            <TabsContent value="basic" className="space-y-4 mt-4">
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
                            </TabsContent>

                            <TabsContent value="permissions" className="space-y-4 mt-4">
                                <div className="space-y-2">
                                    <Label>System Permissions</Label>
                                    <p className="text-sm text-muted-foreground">Control what actions this user can perform.</p>
                                    <div className="grid grid-cols-2 gap-3 mt-2">
                                        {AVAILABLE_PERMISSIONS.map((perm) => (
                                            <div key={perm.id} className="flex items-center space-x-2 p-2 rounded-lg border">
                                                <Switch
                                                    id={perm.id}
                                                    checked={formData.permissions.includes(perm.id)}
                                                    onCheckedChange={() => togglePermission(perm.id)}
                                                />
                                                <Label htmlFor={perm.id} className="text-sm font-normal cursor-pointer flex-1">
                                                    {perm.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="granular" className="space-y-6 mt-4">
                                {/* Allowed Tabs */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Allowed Tabs</Label>
                                            <p className="text-sm text-muted-foreground">Select which tabs this user can access. Empty = all tabs.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={selectAllTabs}>All</Button>
                                            <Button type="button" variant="outline" size="sm" onClick={clearAllTabs}>Clear</Button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {AVAILABLE_TABS.map((tab) => (
                                            <div key={tab.id} className="flex items-center space-x-2 p-2 rounded border">
                                                <Checkbox
                                                    id={`tab-${tab.id}`}
                                                    checked={formData.granularPermissions.allowedTabs.includes(tab.id)}
                                                    onCheckedChange={() => toggleTab(tab.id)}
                                                />
                                                <Label htmlFor={`tab-${tab.id}`} className="text-sm cursor-pointer flex-1">
                                                    {tab.label}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Allowed Collections */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Allowed Collections</Label>
                                            <p className="text-sm text-muted-foreground">Select which collections this user can access. Empty = all collections.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={selectAllCollections} disabled={collections.length === 0}>All</Button>
                                            <Button type="button" variant="outline" size="sm" onClick={clearAllCollections}>Clear</Button>
                                        </div>
                                    </div>
                                    {loadingCollections ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading collections...
                                        </div>
                                    ) : collections.length === 0 ? (
                                        <div className="text-sm text-muted-foreground p-4 border rounded">
                                            No collections found. Connect to a database first.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto">
                                            {collections.map((collection) => (
                                                <div key={collection} className="flex items-center space-x-2 p-2 rounded border">
                                                    <Checkbox
                                                        id={`col-${collection}`}
                                                        checked={formData.granularPermissions.allowedCollections.includes(collection)}
                                                        onCheckedChange={() => toggleCollection(collection)}
                                                    />
                                                    <Label htmlFor={`col-${collection}`} className="text-sm cursor-pointer flex-1 truncate">
                                                        {collection}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Allowed Agents */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <Label>Allowed Agents</Label>
                                            <p className="text-sm text-muted-foreground">Select which agents&apos; conversations this user can view. Empty = all agents.</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button type="button" variant="outline" size="sm" onClick={selectAllAgents} disabled={agents.length === 0}>All</Button>
                                            <Button type="button" variant="outline" size="sm" onClick={clearAllAgents}>Clear</Button>
                                        </div>
                                    </div>
                                    {loadingAgents ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Loading agents...
                                        </div>
                                    ) : agents.length === 0 ? (
                                        <div className="text-sm text-muted-foreground p-4 border rounded">
                                            No agents found. Configure ElevenLabs credentials in Conversations page first.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto">
                                            {agents.map((agent) => (
                                                <div key={agent.agent_id} className="flex items-center space-x-2 p-2 rounded border">
                                                    <Checkbox
                                                        id={`agent-${agent.agent_id}`}
                                                        checked={formData.granularPermissions.allowedAgents.includes(agent.agent_id)}
                                                        onCheckedChange={() => toggleAgent(agent.agent_id)}
                                                    />
                                                    <Label htmlFor={`agent-${agent.agent_id}`} className="text-sm cursor-pointer flex-1">
                                                        {agent.name}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </TabsContent>
                        </ScrollArea>
                    </Tabs>

                    <DialogFooter className="mt-4 pt-4 border-t">
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
