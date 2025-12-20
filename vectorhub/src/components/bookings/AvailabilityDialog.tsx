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

interface AvailabilityDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    day: string;
    currentAvailability: { start: string; end: string } | null;
    onSave: (day: string, availability: { start: string; end: string } | null) => void;
}

export function AvailabilityDialog({
    open,
    onOpenChange,
    day,
    currentAvailability,
    onSave,
}: AvailabilityDialogProps) {
    const [isAvailable, setIsAvailable] = useState(true);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("17:00");

    useEffect(() => {
        if (open) {
            if (currentAvailability) {
                setIsAvailable(true);
                setStartTime(currentAvailability.start);
                setEndTime(currentAvailability.end);
            } else {
                setIsAvailable(false);
                // Default times if re-enabling
                setStartTime("09:00");
                setEndTime("17:00");
            }
        }
    }, [open, currentAvailability]);

    const handleSave = () => {
        if (!isAvailable) {
            onSave(day, null);
        } else {
            onSave(day, { start: startTime, end: endTime });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Availability for {day}</DialogTitle>
                    <DialogDescription>
                        Set your working hours for this day.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="available" className="text-base">Available</Label>
                        <Switch
                            id="available"
                            checked={isAvailable}
                            onCheckedChange={setIsAvailable}
                        />
                    </div>

                    {isAvailable && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="start">Start Time</Label>
                                <Input
                                    id="start"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end">End Time</Label>
                                <Input
                                    id="end"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
