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
import { toast } from "sonner";

interface BookingSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BookingSettingsDialog({
    open,
    onOpenChange,
}: BookingSettingsDialogProps) {
    const [timezone, setTimezone] = useState("UTC");
    const [brandColor, setBrandColor] = useState("#000000");

    const [loading, setLoading] = useState(false);

    // Fetch settings on open
    const [fetched, setFetched] = useState(false);

    if (open && !fetched) {
        setFetched(true);
        fetch('/api/bookings/settings')
            .then(res => res.json())
            .then(data => {
                if (data.timezone) setTimezone(data.timezone);
                if (data.brandColor) setBrandColor(data.brandColor);
                // availability handling could be added here
            })
            .catch(console.error);
    }

    const handleSave = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/bookings/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    timezone,
                    brandColor,
                    // availability would go here
                }),
            });

            if (!res.ok) throw new Error("Failed to save");

            toast.success("Booking settings saved");
            onOpenChange(false);
        } catch (error) {
            toast.error("Failed to save settings");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Booking Settings</DialogTitle>
                    <DialogDescription>
                        Configure your global booking preferences.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select value={timezone} onValueChange={setTimezone}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                                <SelectItem value="EST">Eastern Time (GMT-5)</SelectItem>
                                <SelectItem value="PST">Pacific Time (GMT-8)</SelectItem>
                                <SelectItem value="IST">India Standard Time (GMT+5:30)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label>Availability Start</Label>
                            <Input type="time" defaultValue="09:00" />
                        </div>
                        <div className="grid gap-2">
                            <Label>Availability End</Label>
                            <Input type="time" defaultValue="17:00" />
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="brandColor">Brand Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="brandColor"
                                type="color"
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                className="w-12 p-1 h-10"
                            />
                            <Input
                                value={brandColor}
                                onChange={(e) => setBrandColor(e.target.value)}
                                placeholder="#000000"
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
