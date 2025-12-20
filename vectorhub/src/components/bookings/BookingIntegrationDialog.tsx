"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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
import { Webhook, RadioTower } from "lucide-react";

interface BookingIntegrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (integration: any) => void;
}

export function BookingIntegrationDialog({
    open,
    onOpenChange,
    onSave,
}: BookingIntegrationDialogProps) {
    const [type, setType] = useState<"webhook" | "mcp">("webhook");
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [events, setEvents] = useState<string[]>([]);

    const handleSave = () => {
        if (!name || !url) return;

        const integration = {
            id: crypto.randomUUID(),
            type,
            name,
            config: {
                url,
                secret,
                events: type === 'webhook' ? events : undefined
            },
            status: 'active'
        };

        onSave(integration);
        onOpenChange(false);
        toast.success(`Connected to ${name}`);

        // Reset form
        setName("");
        setUrl("");
        setSecret("");
        setEvents([]);
    };

    const toggleEvent = (event: string) => {
        setEvents(prev =>
            prev.includes(event)
                ? prev.filter(e => e !== event)
                : [...prev, event]
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Integration</DialogTitle>
                    <DialogDescription>
                        Connect your bookings to external tools via Webhooks or MCP.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${type === 'webhook'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-primary/50'
                                }`}
                            onClick={() => setType('webhook')}
                        >
                            <Webhook className="h-6 w-6" />
                            <span className="font-medium">Webhook</span>
                        </div>
                        <div
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 cursor-pointer transition-all ${type === 'mcp'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-primary/50'
                                }`}
                            onClick={() => setType('mcp')}
                        >
                            <RadioTower className="h-6 w-6" />
                            <span className="font-medium">MCP Server</span>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Name</Label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={type === 'webhook' ? "e.g. Slack Notification" : "e.g. Company Calendar MCP"}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label>{type === 'webhook' ? "Endpoint URL" : "Server URL"}</Label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    {type === 'webhook' && (
                        <div className="grid gap-2">
                            <Label>Secret (Optional)</Label>
                            <Input
                                type="password"
                                value={secret}
                                onChange={(e) => setSecret(e.target.value)}
                                placeholder="Signing secret"
                            />
                        </div>
                    )}

                    {type === 'webhook' && (
                        <div className="space-y-3">
                            <Label>Trigger Events</Label>
                            <div className="grid gap-2">
                                {['listing.created', 'booking.created', 'booking.cancelled', 'booking.rescheduled'].map((evt) => (
                                    <div key={evt} className="flex items-center justify-between p-2 border rounded-md">
                                        <Label htmlFor={evt} className="font-normal cursor-pointer">
                                            {evt}
                                        </Label>
                                        <Switch
                                            id={evt}
                                            checked={events.includes(evt)}
                                            onCheckedChange={() => toggleEvent(evt)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name || !url}>
                        Connect
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
