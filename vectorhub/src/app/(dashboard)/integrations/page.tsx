"use client";

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Key,
    Plus,
    Trash2,
    Eye,
    EyeOff,
    Cpu,
    Bot,
    Globe,
    Database,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Settings2,
    Copy,
    Check,
    Cloud,
    ExternalLink,
    RefreshCw,
    Server
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/store";
import { ConnectionConfig, MCPConfig } from "@/types/connections";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

// API Key Types
interface ApiKey {
    id: string;
    name: string;
    type: "llm" | "scraper" | "embedding" | "other";
    provider: string;
    key: string;
    createdAt: Date;
    lastUsed?: Date;
    isActive: boolean;
}

// Provider configurations
const llmProviders = [
    { value: "openai", label: "OpenAI", placeholder: "sk-..." },
    { value: "anthropic", label: "Anthropic", placeholder: "sk-ant-..." },
    { value: "google", label: "Google AI", placeholder: "AIza..." },
    { value: "cohere", label: "Cohere", placeholder: "..." },
    { value: "mistral", label: "Mistral AI", placeholder: "..." },
    { value: "groq", label: "Groq", placeholder: "gsk_..." },
    { value: "together", label: "Together AI", placeholder: "..." },
    { value: "fireworks", label: "Fireworks AI", placeholder: "..." },
    { value: "replicate", label: "Replicate", placeholder: "r8_..." },
    { value: "huggingface", label: "Hugging Face", placeholder: "hf_..." },
];

const scraperProviders = [
    { value: "firecrawl", label: "Firecrawl", placeholder: "fc-..." },
    { value: "browserless", label: "Browserless", placeholder: "..." },
    { value: "scrapingbee", label: "ScrapingBee", placeholder: "..." },
    { value: "apify", label: "Apify", placeholder: "apify_api_..." },
    { value: "diffbot", label: "Diffbot", placeholder: "..." },
];

const embeddingProviders = [
    { value: "openai", label: "OpenAI Embeddings", placeholder: "sk-..." },
    { value: "cohere", label: "Cohere Embeddings", placeholder: "..." },
    { value: "voyageai", label: "Voyage AI", placeholder: "..." },
    { value: "jina", label: "Jina AI", placeholder: "..." },
];

export default function IntegrationsPage() {
    // Store Connection State (Persistent)
    const connections = useStore((state) => state.connections);
    const addConnection = useStore((state) => state.addConnection);
    const removeConnection = useStore((state) => state.removeConnection);
    const updateConnection = useStore((state) => state.updateConnection);

    // Derived MCP State
    const mcpConnections = connections.filter((c) => c.type === 'mcp');

    // API Keys State
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

    // Pica State
    const [picaStatus, setPicaStatus] = useState<Record<string, boolean>>({});
    const [picaLoading, setPicaLoading] = useState(false);

    // Local UI State
    const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
    const [addKeyOpen, setAddKeyOpen] = useState(false);
    const [addMcpOpen, setAddMcpOpen] = useState(false);
    const [copied, setCopied] = useState<string | null>(null);

    // New key form state
    const [newKeyName, setNewKeyName] = useState("");
    const [newKeyType, setNewKeyType] = useState<ApiKey["type"]>("llm");
    const [newKeyProvider, setNewKeyProvider] = useState("");
    const [newKeyValue, setNewKeyValue] = useState("");

    // New MCP form state
    const [newMcpName, setNewMcpName] = useState("");
    const [newMcpType, setNewMcpType] = useState<"stdio" | "sse">("stdio");
    const [newMcpCommand, setNewMcpCommand] = useState("npx");
    const [newMcpArgs, setNewMcpArgs] = useState("");
    const [newMcpEnv, setNewMcpEnv] = useState("");
    const [newMcpUrl, setNewMcpUrl] = useState("");

    const fetchKeys = useCallback(async () => {
        try {
            const res = await fetch("/api/integrations/keys", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                setApiKeys(data);
            }
        } catch (error) {
            console.error("Failed to fetch keys", error);
        }
    }, []);

    const fetchPicaStatus = useCallback(async () => {
        setPicaLoading(true);
        try {
            const res = await fetch("/api/pica/status");
            if (res.ok) {
                const data = await res.json();
                setPicaStatus(data);
            }
        } catch (error) {
            console.error("Failed to fetch Pica status", error);
        } finally {
            setPicaLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchKeys();
        fetchPicaStatus();
    }, [fetchKeys, fetchPicaStatus]);

    const toggleKeyVisibility = (id: string) => {
        setShowKeys((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const copyToClipboard = (id: string, text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(null), 2000);
    };

    const maskKey = (key: string) => {
        if (key.length <= 8) return "••••••••";
        return key.slice(0, 4) + "••••••••" + key.slice(-4);
    };

    const getProvidersList = (type: ApiKey["type"]) => {
        switch (type) {
            case "llm": return llmProviders;
            case "scraper": return scraperProviders;
            case "embedding": return embeddingProviders;
            default: return [];
        }
    };

    const handleAddKey = useCallback(async () => {
        if (!newKeyName || !newKeyProvider || !newKeyValue) {
            toast.error("Please fill in all fields");
            return;
        }

        try {
            // Determine the env key based on provider
            let envKey = newKeyName.toUpperCase().replace(/\s+/g, "_");

            // Allow override for known providers
            if (newKeyProvider === "openai") envKey = "OPENAI_API_KEY";
            if (newKeyProvider === "firecrawl") envKey = "FIRECRAWL_API_KEY";
            if (newKeyProvider === "anthropic") envKey = "ANTHROPIC_API_KEY";
            if (newKeyProvider === "cohere") envKey = "COHERE_API_KEY";

            // If custom, ensure standard format if missing
            if (newKeyProvider === "custom" && !envKey.endsWith("_KEY")) {
                envKey += "_API_KEY";
            }

            const res = await fetch("/api/integrations/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: envKey, value: newKeyValue }),
            });

            if (!res.ok) throw new Error("Failed to save key");

            await fetchKeys();
            setAddKeyOpen(false);
            setNewKeyName("");
            setNewKeyProvider("");
            setNewKeyValue("");
            toast.success("API key added", {
                description: `${newKeyName} has been saved.`,
            });
        } catch (error) {
            toast.error("Failed to save key");
        }
    }, [newKeyName, newKeyType, newKeyProvider, newKeyValue, fetchKeys]);

    const handleAddMcp = useCallback(() => {
        if (!newMcpName) {
            toast.error("Please provide a server name");
            return;
        }

        const config: MCPConfig = {
            type: newMcpType,
            ...(newMcpType === "stdio"
                ? {
                    command: newMcpCommand,
                    args: newMcpArgs.split(" ").filter(Boolean),
                    env: newMcpEnv
                        ? Object.fromEntries(
                            newMcpEnv.split("\n").map((line) => {
                                const [key, ...value] = line.split("=");
                                return [key.trim(), value.join("=").trim()];
                            })
                        )
                        : {},
                }
                : { url: newMcpUrl }),
        };

        const newConnection: ConnectionConfig = {
            id: crypto.randomUUID(),
            name: newMcpName,
            type: "mcp",
            status: "connected", // Assume connected initially, or check
            lastSync: new Date(),
            config: config
        };

        addConnection(newConnection);
        setAddMcpOpen(false);
        setNewMcpName("");
        setNewMcpArgs("");
        setNewMcpEnv("");
        setNewMcpUrl("");
        toast.success("MCP server added", {
            description: `${newMcpName} has been configured.`,
        });
    }, [newMcpName, newMcpType, newMcpCommand, newMcpArgs, newMcpEnv, newMcpUrl, addConnection]);

    const handleDeleteKey = async (id: string) => {
        try {
            const res = await fetch("/api/integrations/keys", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key: id }),
            });

            if (!res.ok) throw new Error("Failed to delete key");

            await fetchKeys();
            toast.success("API key removed");
        } catch (error) {
            toast.error("Failed to delete key");
        }
    };

    const handleDeleteMcp = (id: string) => {
        const conn = connections.find((c) => c.id === id);
        removeConnection(id);
        toast.success("MCP server removed", {
            description: `${conn?.name} has been deleted.`,
        });
    };

    const handleToggleKey = (id: string) => {
        // .env keys are always "active" if present, this is just visual toggle or needs backend update
        // Current implementation in API doesn't support disabling without deleting
        // So we just toggle visual state in local list, but it won't persist unless we update logic
        setApiKeys((prev) =>
            prev.map((k) => (k.id === id ? { ...k, isActive: !k.isActive } : k))
        );
    };

    const handleToggleMcp = (id: string) => {
        const conn = connections.find(c => c.id === id);
        if (conn) {
            updateConnection(id, {
                status: conn.status === 'connected' ? 'disconnected' : 'connected'
            });
        }
    };

    const getTypeIcon = (type: ApiKey["type"]) => {
        switch (type) {
            case "llm": return <Bot className="h-4 w-4" />;
            case "scraper": return <Globe className="h-4 w-4" />;
            case "embedding": return <Sparkles className="h-4 w-4" />;
            default: return <Key className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: ApiKey["type"]) => {
        switch (type) {
            case "llm": return "bg-purple-500/10 text-purple-500";
            case "scraper": return "bg-blue-500/10 text-blue-500";
            case "embedding": return "bg-amber-500/10 text-amber-500";
            default: return "bg-zinc-500/10 text-zinc-500";
        }
    };

    const handleSavePicaKey = useCallback(async (key: string, value: string) => {
        if (!value) return;
        try {
            await fetch("/api/integrations/keys", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ key, value }),
            });
            // Debounce validation? For now just silent save.
        } catch (error) {
            console.error("Failed to save Pica key", error);
        }
    }, []);

    return (
        <motion.div
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings2 className="h-8 w-8 text-muted-foreground" />
                    Integrations
                </h2>
                <p className="text-muted-foreground">
                    Manage your PicaOS integration, API keys, and MCP servers.
                </p>
            </motion.div>

            <Tabs defaultValue="pica" className="space-y-6">
                <TabsList className="grid w-full max-w-xl grid-cols-3">
                    <TabsTrigger value="pica" className="flex items-center gap-2">
                        <Cloud className="h-4 w-4" />
                        PicaOS
                    </TabsTrigger>
                    <TabsTrigger value="api-keys" className="flex items-center gap-2">
                        <Key className="h-4 w-4" />
                        API Keys
                    </TabsTrigger>
                    <TabsTrigger value="mcp-servers" className="flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        MCP Servers
                    </TabsTrigger>
                </TabsList>

                {/* PicaOS Tab */}
                <TabsContent value="pica" className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {/* Weaviate Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Weaviate Integration</CardTitle>
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        Weaviate
                                        {picaStatus.weaviate ? (
                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Connected</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Configured</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Managed by Pica Edge Function
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Supabase Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Supabase Integration</CardTitle>
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        Supabase
                                        {picaStatus.supabase ? (
                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Connected</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Configured</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Access SQL Snippets via Pica
                                    </p>
                                </CardContent>
                            </Card>

                            {/* MongoDB Card */}
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">MongoDB Atlas</CardTitle>
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        MongoDB
                                        {picaStatus.mongodb ? (
                                            <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Connected</Badge>
                                        ) : (
                                            <Badge variant="secondary">Not Configured</Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Manage Online Archives via Pica
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle>PicaOS Configuration</CardTitle>
                                <CardDescription>
                                    Ensure these Environment Variables are set in your .env file
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-2">
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                        <code className="text-sm font-mono">PICA_SECRET_KEY</code>
                                        {picaStatus.weaviate || picaStatus.supabase || picaStatus.mongodb ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                        <code className="text-sm font-mono">PICA_WEAVIATE_CONNECTION_KEY</code>
                                        {picaStatus.weaviate ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-amber-500" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                        <code className="text-sm font-mono">PICA_SUPABASE_CONNECTION_KEY</code>
                                        {picaStatus.supabase ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                        <code className="text-sm font-mono">PICA_MONGO_DB_ATLAS_CONNECTION_KEY</code>
                                        {picaStatus.mongodb ? (
                                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="default" className="gap-2">
                                                <Settings2 className="h-4 w-4" />
                                                Configure Keys
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-md">
                                            <DialogHeader>
                                                <DialogTitle>Configure PicaOS Keys</DialogTitle>
                                                <DialogDescription>
                                                    Set your PicaOS environment variables. Click save when done.
                                                </DialogDescription>
                                            </DialogHeader>
                                            <form
                                                className="space-y-4 pt-4"
                                                onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const updates = [
                                                        { key: "PICA_SECRET_KEY", value: formData.get("pica_secret_key") as string },
                                                        { key: "PICA_WEAVIATE_CONNECTION_KEY", value: formData.get("pica_weaviate_key") as string },
                                                        { key: "PICA_SUPABASE_CONNECTION_KEY", value: formData.get("pica_supabase_key") as string },
                                                        { key: "PICA_MONGO_DB_ATLAS_CONNECTION_KEY", value: formData.get("pica_mongo_key") as string },
                                                    ];

                                                    let saved = 0;
                                                    for (const { key, value } of updates) {
                                                        if (value && value.trim() !== "") {
                                                            await handleSavePicaKey(key, value.trim());
                                                            saved++;
                                                        }
                                                    }

                                                    if (saved > 0) {
                                                        toast.success(`Saved ${saved} PicaOS keys.`);
                                                        fetchPicaStatus();
                                                    } else {
                                                        toast.info("No keys provided to save.");
                                                    }
                                                }}
                                            >
                                                <div className="space-y-2">
                                                    <Label>Pica Secret Key</Label>
                                                    <Input name="pica_secret_key" type="password" placeholder="pica_sk_..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Weaviate Connection Key</Label>
                                                    <Input name="pica_weaviate_key" type="password" placeholder="pica_conn_..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Supabase Connection Key</Label>
                                                    <Input name="pica_supabase_key" type="password" placeholder="pica_conn_..." />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>MongoDB Connection Key</Label>
                                                    <Input name="pica_mongo_key" type="password" placeholder="pica_conn_..." />
                                                </div>
                                                <div className="flex justify-end pt-2">
                                                    <Button type="submit">Save Changes</Button>
                                                </div>
                                            </form>
                                        </DialogContent>
                                    </Dialog>

                                    <Button onClick={fetchPicaStatus} disabled={picaLoading} variant="outline" className="gap-2">
                                        <RefreshCw className={cn("h-4 w-4", picaLoading && "animate-spin")} />
                                        Refresh Status
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* API Keys Tab */}
                <TabsContent value="api-keys" className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>API Keys</CardTitle>
                                    <CardDescription>
                                        Store API keys for LLMs, scrapers, and other services
                                    </CardDescription>
                                </div>
                                <Dialog open={addKeyOpen} onOpenChange={setAddKeyOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add API Key
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add API Key</DialogTitle>
                                            <DialogDescription>
                                                Store a new API key securely
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label>Name</Label>
                                                <Input
                                                    placeholder="e.g., OpenAI Production"
                                                    value={newKeyName}
                                                    onChange={(e) => setNewKeyName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Type</Label>
                                                <Select
                                                    value={newKeyType}
                                                    onValueChange={(v) => {
                                                        setNewKeyType(v as ApiKey["type"]);
                                                        setNewKeyProvider("");
                                                    }}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="llm">LLM Provider</SelectItem>
                                                        <SelectItem value="scraper">Web Scraper</SelectItem>
                                                        <SelectItem value="embedding">Embedding Model</SelectItem>
                                                        <SelectItem value="other">Other</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Provider</Label>
                                                <Select
                                                    value={newKeyProvider}
                                                    onValueChange={setNewKeyProvider}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select provider" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {getProvidersList(newKeyType).map((p) => (
                                                            <SelectItem key={p.value} value={p.value}>
                                                                {p.label}
                                                            </SelectItem>
                                                        ))}
                                                        {newKeyType === "other" && (
                                                            <SelectItem value="custom">Custom</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>API Key</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="Enter API key"
                                                    value={newKeyValue}
                                                    onChange={(e) => setNewKeyValue(e.target.value)}
                                                />
                                            </div>
                                            <div className="flex justify-end gap-2 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAddKeyOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleAddKey}>Save Key</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {apiKeys.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Key className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">No API keys</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Add your first API key to get started
                                        </p>
                                    </div>
                                ) : (
                                    <ScrollArea className="h-[400px]">
                                        <div className="space-y-3">
                                            {apiKeys.map((apiKey) => (
                                                <div
                                                    key={apiKey.id}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 rounded-lg border",
                                                        apiKey.isActive
                                                            ? "bg-card"
                                                            : "bg-muted/50 opacity-60"
                                                    )}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div
                                                            className={cn(
                                                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                                                getTypeColor(apiKey.type)
                                                            )}
                                                        >
                                                            {getTypeIcon(apiKey.type)}
                                                        </div>
                                                        <div>
                                                            <div className="flex items-center gap-2">
                                                                <p className="font-medium">{apiKey.name}</p>
                                                                <Badge variant="secondary" className="text-xs">
                                                                    {apiKey.provider}
                                                                </Badge>
                                                                {apiKey.isActive ? (
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                ) : (
                                                                    <AlertCircle className="h-3 w-3 text-amber-500" />
                                                                )}
                                                            </div>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <code className="text-xs text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded">
                                                                    {showKeys[apiKey.id]
                                                                        ? apiKey.key
                                                                        : maskKey(apiKey.key)}
                                                                </code>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() => toggleKeyVisibility(apiKey.id)}
                                                                >
                                                                    {showKeys[apiKey.id] ? (
                                                                        <EyeOff className="h-3 w-3" />
                                                                    ) : (
                                                                        <Eye className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-6 w-6"
                                                                    onClick={() =>
                                                                        copyToClipboard(apiKey.id, apiKey.key)
                                                                    }
                                                                >
                                                                    {copied === apiKey.id ? (
                                                                        <Check className="h-3 w-3 text-emerald-500" />
                                                                    ) : (
                                                                        <Copy className="h-3 w-3" />
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={apiKey.isActive}
                                                            onCheckedChange={() => handleToggleKey(apiKey.id)}
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() => handleDeleteKey(apiKey.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>

                {/* MCP Servers Tab */}
                <TabsContent value="mcp-servers" className="space-y-6">
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle>MCP Servers</CardTitle>
                                    <CardDescription>
                                        Configure Model Context Protocol servers for AI tools
                                    </CardDescription>
                                </div>
                                <Dialog open={addMcpOpen} onOpenChange={setAddMcpOpen}>
                                    <DialogTrigger asChild>
                                        <Button>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Add MCP Server
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-xl">
                                        <DialogHeader>
                                            <DialogTitle>Add MCP Server</DialogTitle>
                                            <DialogDescription>
                                                Configure a new MCP server connection
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 pt-4">
                                            <div className="space-y-2">
                                                <Label>Server Name</Label>
                                                <Input
                                                    placeholder="e.g., mongodb, filesystem"
                                                    value={newMcpName}
                                                    onChange={(e) => setNewMcpName(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Transport Type</Label>
                                                <Select
                                                    value={newMcpType}
                                                    onValueChange={(v) => setNewMcpType(v as "stdio" | "sse")}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="stdio">stdio (Local Command)</SelectItem>
                                                        <SelectItem value="sse">SSE (Remote Server)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {newMcpType === "stdio" ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label>Command</Label>
                                                        <Select
                                                            value={newMcpCommand}
                                                            onValueChange={setNewMcpCommand}
                                                        >
                                                            <SelectTrigger>
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="npx">npx</SelectItem>
                                                                <SelectItem value="node">node</SelectItem>
                                                                <SelectItem value="python">python</SelectItem>
                                                                <SelectItem value="uvx">uvx</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Arguments (space-separated)</Label>
                                                        <Input
                                                            placeholder="-y mongodb-mcp-server@latest"
                                                            value={newMcpArgs}
                                                            onChange={(e) => setNewMcpArgs(e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label>Environment Variables (KEY=value, one per line)</Label>
                                                        <Textarea
                                                            placeholder="MDB_MCP_CONNECTION_STRING=mongodb+srv://..."
                                                            value={newMcpEnv}
                                                            onChange={(e) => setNewMcpEnv(e.target.value)}
                                                            className="font-mono text-sm"
                                                            rows={3}
                                                        />
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-2">
                                                    <Label>Server URL</Label>
                                                    <Input
                                                        placeholder="http://localhost:3001/sse"
                                                        value={newMcpUrl}
                                                        onChange={(e) => setNewMcpUrl(e.target.value)}
                                                    />
                                                </div>
                                            )}
                                            <div className="flex justify-end gap-2 pt-4">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setAddMcpOpen(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button onClick={handleAddMcp}>Add Server</Button>
                                            </div>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </CardHeader>
                            <CardContent>
                                {mcpConnections.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-center">
                                        <Cpu className="h-12 w-12 text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-medium">No MCP servers</h3>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Add your first MCP server configuration
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {mcpConnections.map((conn) => {
                                            const cfg = conn.config as MCPConfig;
                                            return (
                                                <div
                                                    key={conn.id}
                                                    className={cn(
                                                        "p-4 rounded-lg border",
                                                        conn.status === 'connected' ? "bg-card" : "bg-muted/50 opacity-60"
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                                                <Cpu className="h-5 w-5 text-primary" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-medium">{conn.name}</p>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {cfg.type}
                                                                    </Badge>
                                                                    {conn.status === 'connected' && (
                                                                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                    )}
                                                                </div>
                                                                <code className="text-xs text-muted-foreground font-mono">
                                                                    {cfg.type === "stdio"
                                                                        ? `${cfg.command} ${cfg.args?.join(" ")}`
                                                                        : cfg.url}
                                                                </code>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                checked={conn.status === 'connected'}
                                                                onCheckedChange={() => handleToggleMcp(conn.id)}
                                                            />
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDeleteMcp(conn.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    {cfg.env && Object.keys(cfg.env).length > 0 && (
                                                        <div className="mt-3 pt-3 border-t">
                                                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                                                Environment Variables
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.keys(cfg.env).map((key) => (
                                                                    <Badge
                                                                        key={key}
                                                                        variant="secondary"
                                                                        className="text-xs font-mono"
                                                                    >
                                                                        {key}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* JSON Export */}
                    <motion.div variants={itemVariants}>
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Export Configuration</CardTitle>
                                <CardDescription>
                                    Copy this JSON to use in Claude Desktop or other MCP clients
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-muted p-4 rounded-lg text-xs font-mono overflow-x-auto">
                                    {JSON.stringify(
                                        {
                                            mcpServers: Object.fromEntries(
                                                mcpConnections
                                                    .filter((s) => s.status === 'connected')
                                                    .map((s) => {
                                                        const cfg = s.config as MCPConfig;
                                                        return [
                                                            s.name,
                                                            cfg.type === "stdio"
                                                                ? {
                                                                    type: cfg.type,
                                                                    command: cfg.command,
                                                                    args: cfg.args,
                                                                    env: cfg.env,
                                                                }
                                                                : { type: cfg.type, url: cfg.url },
                                                        ];
                                                    })
                                            ),
                                        },
                                        null,
                                        2
                                    )}
                                </pre>
                                <Button
                                    variant="outline"
                                    className="mt-3"
                                    onClick={() => {
                                        const config = {
                                            mcpServers: Object.fromEntries(
                                                mcpConnections
                                                    .filter((s) => s.status === 'connected')
                                                    .map((s) => {
                                                        const cfg = s.config as MCPConfig;
                                                        return [
                                                            s.name,
                                                            cfg.type === "stdio"
                                                                ? {
                                                                    type: cfg.type,
                                                                    command: cfg.command,
                                                                    args: cfg.args,
                                                                    env: cfg.env,
                                                                }
                                                                : { type: cfg.type, url: cfg.url },
                                                        ];
                                                    })
                                            ),
                                        };
                                        navigator.clipboard.writeText(JSON.stringify(config, null, 2));
                                        toast.success("Configuration copied to clipboard");
                                    }}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy Configuration
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </TabsContent>
            </Tabs>
        </motion.div>
    );
}
