"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface WebhookConnectionFormValues {
    name: string;
    url: string;
    eventTypes: string[];
    secretConfigured: boolean;
}

interface WebhookConnectionFormProps {
    onSubmit: (data: WebhookConnectionFormValues) => void;
    onCancel: () => void;
}

export function WebhookConnectionForm({ onSubmit, onCancel }: WebhookConnectionFormProps) {
    const [name, setName] = useState("");
    const [url, setUrl] = useState("");
    const [eventsInput, setEventsInput] = useState("collection.created,collection.deleted");
    const [secretConfigured, setSecretConfigured] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const eventTypes = eventsInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean);

        onSubmit({
            name,
            url,
            eventTypes,
            secretConfigured,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input
                    id="webhook-name"
                    placeholder="VectorHub Events"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="webhook-url">Target URL</Label>
                <Input
                    id="webhook-url"
                    placeholder="https://example.com/webhooks/vectorhub"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="webhook-events">Subscribed Events</Label>
                <Input
                    id="webhook-events"
                    placeholder="collection.created,document.added,search.performed"
                    value={eventsInput}
                    onChange={(e) => setEventsInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    Comma-separated list of event identifiers this webhook should receive.
                </p>
            </div>

            <div className="flex items-center justify-between pt-2">
                <div className="space-y-0.5">
                    <Label>Secret Configured</Label>
                    <p className="text-xs text-muted-foreground">
                        Indicates whether the receiving service validates a shared secret.
                    </p>
                </div>
                <Switch
                    checked={secretConfigured}
                    onCheckedChange={setSecretConfigured}
                />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" type="button" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Create Webhook</Button>
            </div>
        </form>
    );
}
