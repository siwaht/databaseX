"use client";

import { useState, useEffect } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Webhook, Cpu, Copy, Check, Info, Zap, Code } from "lucide-react";

interface BookingIntegrationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    integration?: any;
    onSave: (integration: any) => void;
}

export function BookingIntegrationDialog({
    open,
    onOpenChange,
    integration,
    onSave,
}: BookingIntegrationDialogProps) {
    const [type, setType] = useState<"webhook" | "mcp">("webhook");
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [secret, setSecret] = useState("");
    const [events, setEvents] = useState<string[]>(["booking.created", "booking.cancelled"]);
    const [copied, setCopied] = useState(false);

    // MCP endpoint URL for AI agents
    const mcpEndpoint = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/bookings/mcp`
        : '/api/bookings/mcp';

    useEffect(() => {
        if (integration) {
            setType(integration.type);
            setName(integration.name);
            setUrl(integration.config?.url || "");
            setSecret(integration.config?.secret || "");
            setEvents(integration.config?.events || ["booking.created", "booking.cancelled"]);
        } else {
            setType("webhook");
            setName("");
            setUrl("");
            setSecret("");
            setEvents(["booking.created", "booking.cancelled"]);
        }
    }, [integration, open]);

    const handleSave = () => {
        if (!name) {
            toast.error("Please enter a name");
            return;
        }
        if (type === "webhook" && !url) {
            toast.error("Please enter a webhook URL");
            return;
        }

        const newIntegration = {
            id: integration?.id || crypto.randomUUID(),
            type,
            name,
            config: {
                url: type === "webhook" ? url : mcpEndpoint,
                secret,
                events: type === 'webhook' ? events : undefined
            },
            status: 'active'
        };

        onSave(newIntegration);
        onOpenChange(false);
        toast.success(integration ? `Updated ${name}` : `Connected ${name}`);

        if (!integration) {
            setName("");
            setUrl("");
            setSecret("");
            setEvents(["booking.created", "booking.cancelled"]);
        }
    };

    const toggleEvent = (event: string) => {
        setEvents((prev: string[]) =>
            prev.includes(event)
                ? prev.filter((e: string) => e !== event)
                : [...prev, event]
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast.success("Copied to clipboard");
    };

    const mcpExample = `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "booking_create",
    "arguments": {
      "eventTypeId": "your-event-id",
      "startTime": "2024-01-15T10:00:00Z",
      "guestName": "John Doe",
      "guestEmail": "john@example.com"
    }
  }
}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{integration ? "Edit Integration" : "Add Integration"}</DialogTitle>
                    <DialogDescription>
                        Connect your booking system to external tools and AI agents.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Type Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                                type === 'webhook'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-primary/50'
                            }`}
                            onClick={() => setType('webhook')}
                        >
                            <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Webhook className="h-5 w-5 text-blue-500" />
                            </div>
                            <span className="font-medium">Webhook</span>
                            <span className="text-xs text-muted-foreground text-center">
                                Send events to your server
                            </span>
                        </button>
                        <button
                            type="button"
                            className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all ${
                                type === 'mcp'
                                    ? 'border-primary bg-primary/5'
                                    : 'border-muted hover:border-primary/50'
                            }`}
                            onClick={() => setType('mcp')}
                        >
                            <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                                <Cpu className="h-5 w-5 text-purple-500" />
                            </div>
                            <span className="font-medium">MCP Server</span>
                            <span className="text-xs text-muted-foreground text-center">
                                Let AI agents manage bookings
                            </span>
                        </button>
                    </div>

                    {/* Webhook Configuration */}
                    {type === 'webhook' && (
                        <>
                            <div className="grid gap-2">
                                <Label>Integration Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Slack Notifications, Zapier"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label>Webhook URL</Label>
                                <Input
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                    placeholder="https://your-server.com/webhook"
                                />
                                <p className="text-xs text-muted-foreground">
                                    We'll send a POST request with booking data to this URL
                                </p>
                            </div>

                            <div className="grid gap-2">
                                <Label>Secret Key (Optional)</Label>
                                <Input
                                    type="password"
                                    value={secret}
                                    onChange={(e) => setSecret(e.target.value)}
                                    placeholder="Used to sign webhook payloads"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>Trigger Events</Label>
                                <div className="grid gap-2">
                                    {[
                                        { id: 'booking.created', label: 'Booking Created', desc: 'When a new booking is made' },
                                        { id: 'booking.cancelled', label: 'Booking Cancelled', desc: 'When a booking is cancelled' },
                                        { id: 'booking.updated', label: 'Booking Updated', desc: 'When booking details change' },
                                        { id: 'booking.completed', label: 'Booking Completed', desc: 'When a booking is marked complete' },
                                    ].map((evt) => (
                                        <div key={evt.id} className="flex items-center justify-between p-3 border rounded-lg">
                                            <div>
                                                <Label htmlFor={evt.id} className="font-medium cursor-pointer">
                                                    {evt.label}
                                                </Label>
                                                <p className="text-xs text-muted-foreground">{evt.desc}</p>
                                            </div>
                                            <Switch
                                                id={evt.id}
                                                checked={events.includes(evt.id)}
                                                onCheckedChange={() => toggleEvent(evt.id)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* MCP Server Configuration */}
                    {type === 'mcp' && (
                        <>
                            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Info className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <h4 className="font-medium">What is MCP?</h4>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Model Context Protocol (MCP) allows AI agents like Claude, ChatGPT, or custom bots 
                                            to interact with your booking system programmatically.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label>Integration Name</Label>
                                <Input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Claude Assistant, AI Scheduler"
                                />
                            </div>

                            <div className="space-y-3">
                                <Label>MCP Endpoint</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={mcpEndpoint}
                                        readOnly
                                        className="font-mono text-sm bg-muted"
                                    />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(mcpEndpoint)}
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Use this URL in your AI agent's MCP configuration
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label>Available Tools</Label>
                                    <Badge variant="secondary">{9} tools</Badge>
                                </div>
                                <div className="grid gap-2">
                                    {[
                                        { name: 'booking_list', desc: 'List all bookings with filters' },
                                        { name: 'booking_create', desc: 'Create a new booking' },
                                        { name: 'booking_update', desc: 'Update booking details' },
                                        { name: 'booking_cancel', desc: 'Cancel a booking' },
                                        { name: 'availability_check', desc: 'Check available time slots' },
                                        { name: 'event_types_list', desc: 'List event types' },
                                    ].map((tool) => (
                                        <div key={tool.name} className="flex items-center gap-3 p-2 rounded-md bg-muted/50">
                                            <Code className="h-4 w-4 text-muted-foreground" />
                                            <div className="flex-1 min-w-0">
                                                <code className="text-xs font-mono text-primary">{tool.name}</code>
                                                <p className="text-xs text-muted-foreground truncate">{tool.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Example Request</Label>
                                <div className="relative">
                                    <Textarea
                                        value={mcpExample}
                                        readOnly
                                        className="font-mono text-xs h-40 bg-muted resize-none"
                                    />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2"
                                        onClick={() => copyToClipboard(mcpExample)}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="rounded-lg border p-4 space-y-2">
                                <h4 className="font-medium flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-amber-500" />
                                    Quick Start
                                </h4>
                                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Copy the MCP endpoint URL above</li>
                                    <li>Add it to your AI agent's tool configuration</li>
                                    <li>Call <code className="text-xs bg-muted px-1 rounded">tools/list</code> to discover available tools</li>
                                    <li>Use <code className="text-xs bg-muted px-1 rounded">tools/call</code> to execute booking operations</li>
                                </ol>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!name || (type === 'webhook' && !url)}>
                        {integration ? "Save Changes" : type === 'mcp' ? "Enable MCP" : "Connect Webhook"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
