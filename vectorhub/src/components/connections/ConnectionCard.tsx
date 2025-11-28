"use client";

import { ConnectionConfig } from "@/types/connections";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Database, Trash2, Edit, RefreshCw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ConnectionCardProps {
    connection: ConnectionConfig;
    onDelete: (id: string) => void;
    onEdit: (id: string) => void;
    onSync: (id: string) => void;
}

export function ConnectionCard({ connection, onDelete, onEdit, onSync }: ConnectionCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    <div className="flex items-center space-x-2">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <span>{connection.name}</span>
                    </div>
                </CardTitle>
                <Badge variant={connection.status === 'connected' ? 'default' : 'destructive'}>
                    {connection.status}
                </Badge>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold capitalize">{connection.type.replace('_', ' ')}</div>
                <p className="text-xs text-muted-foreground">
                    Last synced {formatDistanceToNow(new Date(connection.lastSync), { addSuffix: true })}
                </p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="ghost" size="sm" onClick={() => onSync(connection.id)}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync
                </Button>
                <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(connection.id)}>
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => onDelete(connection.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
}
