```typescript
"use client";

import { useState } from "react";
import { useStore } from "@/store";
import { ConnectionCard } from "@/components/connections/ConnectionCard";
import { ConnectionForm } from "@/components/connections/ConnectionForm";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConnectionConfig } from "@/types/connections";

export default function ConnectionsPage() {
  const { connections, addConnection, removeConnection } = useStore();
  const [open, setOpen] = useState(false);

  const handleEdit = (id: string) => {
    console.log("Edit connection", id);
  };

  const handleSync = (id: string) => {
    console.log("Sync connection", id);
  };

  const handleAddConnection = (data: Partial<ConnectionConfig>) => {
    addConnection({
      id: Math.random().toString(36).substring(7),
      ...data,
    } as ConnectionConfig);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Connections</h2>
          <p className="text-muted-foreground">
            Manage your vector database connections and integrations.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Connection</DialogTitle>
              <DialogDescription>
                Connect to a new vector database instance.
              </DialogDescription>
            </DialogHeader>
            <ConnectionForm onSubmit={handleAddConnection} onCancel={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connections.map((connection) => (
          <ConnectionCard
            key={connection.id}
            connection={connection}
            onDelete={removeConnection}
            onEdit={handleEdit}
            onSync={handleSync}
          />
        ))}
        {connections.length === 0 && (
          <div className="col-span-full flex h-[450px] flex-col items-center justify-center rounded-md border border-dashed text-center">
            <h3 className="mt-4 text-lg font-semibold">No connections found</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Get started by adding your first vector database connection.
            </p>
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Connection
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```
