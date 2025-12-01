"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Database,
    Layers,
    FileText,
    Wrench,
    BookOpen,
    MessageSquare,
    Server,
    Clock,
    AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface ConnectionTestData {
    success: boolean;
    connectionName: string;
    connectionType: string;
    latency?: number;
    error?: string;
    
    // For databases
    collections?: {
        name: string;
        documentCount?: number;
        dimensions?: number;
    }[];
    databaseInfo?: {
        version?: string;
        host?: string;
        database?: string;
    };
    
    // For MCP servers
    mcpCapabilities?: {
        tools?: { name: string; description?: string }[];
        resources?: { name: string; uri?: string; description?: string }[];
        prompts?: { name: string; description?: string }[];
    };
    serverInfo?: {
        name?: string;
        version?: string;
        protocolVersion?: string;
    };
}

interface ConnectionTestResultProps {
    data: ConnectionTestData | null;
    isLoading: boolean;
    onConfirm: () => void;
    onRetry: () => void;
    onCancel: () => void;
}

export function ConnectionTestResult({
    data,
    isLoading,
    onConfirm,
    onRetry,
    onCancel,
}: ConnectionTestResultProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                </div>
                <div className="text-center space-y-1">
                    <p className="font-medium">Testing Connection...</p>
                    <p className="text-sm text-muted-foreground">
                        Please wait while we verify your connection
                    </p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const isMcp = data.connectionType === "mcp";
    const isDatabase = !isMcp && data.connectionType !== "webhook";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
        >
            {/* Status Header */}
            <div
                className={cn(
                    "rounded-lg p-4 flex items-start gap-4",
                    data.success
                        ? "bg-emerald-500/10 border border-emerald-500/20"
                        : "bg-destructive/10 border border-destructive/20"
                )}
            >
                {data.success ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500 flex-shrink-0" />
                ) : (
                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            "font-semibold",
                            data.success ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
                        )}
                    >
                        {data.success ? "Connection Successful!" : "Connection Failed"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {data.success
                            ? `Successfully connected to ${data.connectionName}`
                            : data.error || "Failed to establish connection"}
                    </p>
                    {data.latency && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            Response time: {data.latency}ms
                        </div>
                    )}
                </div>
            </div>

            {data.success && (
                <ScrollArea className="h-[300px] pr-4">
                    {/* Database Info */}
                    {isDatabase && data.databaseInfo && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">Database Info</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {data.databaseInfo.host && (
                                    <div className="bg-muted/50 rounded-md p-2">
                                        <p className="text-xs text-muted-foreground">Host</p>
                                        <p className="font-mono text-xs truncate">{data.databaseInfo.host}</p>
                                    </div>
                                )}
                                {data.databaseInfo.database && (
                                    <div className="bg-muted/50 rounded-md p-2">
                                        <p className="text-xs text-muted-foreground">Database</p>
                                        <p className="font-mono text-xs">{data.databaseInfo.database}</p>
                                    </div>
                                )}
                                {data.databaseInfo.version && (
                                    <div className="bg-muted/50 rounded-md p-2">
                                        <p className="text-xs text-muted-foreground">Version</p>
                                        <p className="font-mono text-xs">{data.databaseInfo.version}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Collections */}
                    {isDatabase && data.collections && data.collections.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Layers className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">Collections Found</span>
                                </div>
                                <Badge variant="secondary">{data.collections.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {data.collections.map((collection, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center justify-between bg-muted/50 rounded-md p-3"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Database className="h-4 w-4 text-primary" />
                                            <span className="font-medium text-sm">{collection.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                            {collection.documentCount !== undefined && (
                                                <span className="flex items-center gap-1">
                                                    <FileText className="h-3 w-3" />
                                                    {collection.documentCount.toLocaleString()} docs
                                                </span>
                                            )}
                                            {collection.dimensions && (
                                                <Badge variant="outline" className="text-[10px]">
                                                    {collection.dimensions}d
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MCP Server Info */}
                    {isMcp && data.serverInfo && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Server className="h-4 w-4 text-muted-foreground" />
                                <span className="font-medium text-sm">Server Info</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                {data.serverInfo.name && (
                                    <div className="bg-muted/50 rounded-md p-2">
                                        <p className="text-xs text-muted-foreground">Server Name</p>
                                        <p className="font-mono text-xs">{data.serverInfo.name}</p>
                                    </div>
                                )}
                                {data.serverInfo.version && (
                                    <div className="bg-muted/50 rounded-md p-2">
                                        <p className="text-xs text-muted-foreground">Version</p>
                                        <p className="font-mono text-xs">{data.serverInfo.version}</p>
                                    </div>
                                )}
                                {data.serverInfo.protocolVersion && (
                                    <div className="bg-muted/50 rounded-md p-2 col-span-2">
                                        <p className="text-xs text-muted-foreground">Protocol Version</p>
                                        <p className="font-mono text-xs">{data.serverInfo.protocolVersion}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* MCP Tools */}
                    {isMcp && data.mcpCapabilities?.tools && data.mcpCapabilities.tools.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Wrench className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">Available Tools</span>
                                </div>
                                <Badge variant="secondary">{data.mcpCapabilities.tools.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {data.mcpCapabilities.tools.map((tool, i) => (
                                    <div key={i} className="bg-muted/50 rounded-md p-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm font-medium text-primary">
                                                {tool.name}
                                            </span>
                                        </div>
                                        {tool.description && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                {tool.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MCP Resources */}
                    {isMcp && data.mcpCapabilities?.resources && data.mcpCapabilities.resources.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">Resources</span>
                                </div>
                                <Badge variant="secondary">{data.mcpCapabilities.resources.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {data.mcpCapabilities.resources.map((resource, i) => (
                                    <div key={i} className="bg-muted/50 rounded-md p-3">
                                        <span className="font-medium text-sm">{resource.name}</span>
                                        {resource.uri && (
                                            <p className="font-mono text-xs text-muted-foreground truncate">
                                                {resource.uri}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* MCP Prompts */}
                    {isMcp && data.mcpCapabilities?.prompts && data.mcpCapabilities.prompts.length > 0 && (
                        <div className="space-y-3 mt-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                    <span className="font-medium text-sm">Prompts</span>
                                </div>
                                <Badge variant="secondary">{data.mcpCapabilities.prompts.length}</Badge>
                            </div>
                            <div className="space-y-2">
                                {data.mcpCapabilities.prompts.map((prompt, i) => (
                                    <div key={i} className="bg-muted/50 rounded-md p-3">
                                        <span className="font-medium text-sm">{prompt.name}</span>
                                        {prompt.description && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {prompt.description}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state for MCP with no capabilities */}
                    {isMcp &&
                        (!data.mcpCapabilities?.tools?.length &&
                            !data.mcpCapabilities?.resources?.length &&
                            !data.mcpCapabilities?.prompts?.length) && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <AlertTriangle className="h-8 w-8 text-amber-500 mb-2" />
                                <p className="text-sm text-muted-foreground">
                                    Server connected but no tools, resources, or prompts were found.
                                </p>
                            </div>
                        )}
                </ScrollArea>
            )}

            <Separator />

            {/* Actions */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                {!data.success ? (
                    <Button variant="outline" onClick={onRetry}>
                        <Loader2 className="mr-2 h-4 w-4" />
                        Retry
                    </Button>
                ) : (
                    <Button onClick={onConfirm}>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Save Connection
                    </Button>
                )}
            </div>
        </motion.div>
    );
}

