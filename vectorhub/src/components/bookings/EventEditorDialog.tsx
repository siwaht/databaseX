"use client";

import { useEffect, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { EventType } from "@/types/booking";

interface EventEditorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    event?: EventType;
    onSave: (event: Omit<EventType, "id"> & { id?: string }) => void;
}

const COLORS = [
    { name: "Blue", value: "bg-blue-500" },
    { name: "Purple", value: "bg-purple-500" },
    { name: "Emerald", value: "bg-emerald-500" },
    { name: "Amber", value: "bg-amber-500" },
    { name: "Rose", value: "bg-rose-500" },
    { name: "Indigo", value: "bg-indigo-500" },
];

export function EventEditorDialog({
    open,
    onOpenChange,
    event,
    onSave,
}: EventEditorDialogProps) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [duration, setDuration] = useState("15");
    const [description, setDescription] = useState("");
    const [color, setColor] = useState(COLORS[0].value);

    // Reset or populate form when opening/changing event
    useEffect(() => {
        if (event) {
            setTitle(event.name);
            setSlug(event.slug.replace(/^\//, '')); // Remove leading slash for input
            setDuration(event.duration.toString());
            setDescription(event.description);
            setColor(event.color || COLORS[0].value);
        } else {
            setTitle("");
            setSlug("");
            setDuration("15");
            setDescription("");
            setColor(COLORS[0].value);
        }
    }, [event, open]);

    // Auto-generate slug from title if slug is clean
    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value;
        setTitle(newTitle);
        if (!event) { // Only auto-generate for new events to avoid surprising edits
            const autoSlug = newTitle
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
            setSlug(autoSlug);
        }
    };

    const handleSave = () => {
        if (!title || !slug) return;

        const newEvent = {
            id: event?.id,
            name: title,
            slug: slug.startsWith('/') ? slug : `/${slug}`,
            duration: parseInt(duration),
            description: description,
            isActive: true,
            color: color,
        };

        onSave(newEvent);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>{event ? "Edit Event Type" : "Create Event Type"}</DialogTitle>
                    <DialogDescription>
                        {event
                            ? "Make changes to your event type here. Click save when you're done."
                            : "Add a new meeting type for people to book with you."}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder="e.g. Intro Call"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="slug">URL Slug</Label>
                            <div className="flex items-center">
                                <span className="mr-2 text-muted-foreground text-sm">/</span>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="intro-call"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration</Label>
                            <Select value={duration} onValueChange={setDuration}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 min</SelectItem>
                                    <SelectItem value="30">30 min</SelectItem>
                                    <SelectItem value="45">45 min</SelectItem>
                                    <SelectItem value="60">60 min</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="A brief description of what this meeting is about..."
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label>Color</Label>
                        <div className="flex gap-2">
                            {COLORS.map((c) => (
                                <button
                                    key={c.value}
                                    className={`h-6 w-6 rounded-full transition-all ${c.value} ${color === c.value ? "ring-2 ring-primary ring-offset-2" : ""
                                        }`}
                                    onClick={() => setColor(c.value)}
                                    title={c.name}
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={!title || !slug}>
                        Save
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
