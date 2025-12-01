"use client";

import { McpConnection } from "@/types/connections";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Zap, Trash2, Edit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface McpConnectionCardProps {
    connection: McpConnection;
    onDelete?: (id: string) => void;
    onEdit?: (id: string) => void;
}

const statusConfig = {
    connected: {
        variant: "default" as const,
        dotClass: "bg-emerald-500",
        label: "Connected",
    },
    disconnected: {
        variant: "secondary" as const,
        dotClass: "bg-zinc-400",
        label: "Disconnected",
    },
    error: {
        variant: "destructive" as const,
        dotClass: "bg-red-500",
        label: "Error",
    },
} as const;

export function McpConnectionCard({ connection, onDelete, onEdit }: McpConnectionCardProps) {
    const status = statusConfig[connection.status] || statusConfig.disconnected;

    return (
        <Card className="card-hover">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="truncate">{connection.name}</span>
                    </div>
                </CardTitle>
                <Badge variant={status.variant} className="flex items-center gap-1.5">
                    <span className={cn("h-1.5 w-1.5 rounded-full", status.dotClass)} />
                    {status.label}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="text-xs font-mono break-all text-muted-foreground">
                    {connection.endpoint}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                    Last sync{" "}
                    {formatDistanceToNow(new Date(connection.lastSync), {
                        addSuffix: true,
                    })}
                </p>
                {connection.tags && connection.tags.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground truncate">
                        Tags: {connection.tags.join(", ")}
                    </p>
                )}
            </CardContent>
            {(onDelete || onEdit) && (
                <CardFooter className="flex justify-end space-x-1">
                    {onEdit && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(connection.id)}
                        >
                            <Edit className="h-4 w-4" />
                        </Button>
                    )}
                    {onDelete && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => onDelete(connection.id)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                </CardFooter>
            )}
        </Card>
    );
}
