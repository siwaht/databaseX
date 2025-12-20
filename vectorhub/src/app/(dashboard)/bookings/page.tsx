"use client";

import { useState } from "react";
import {
    Calendar,
    Clock,
    Plus,
    Settings2,
    ChevronRight,
    Search,
    Filter,
    MoreVertical,
    CheckCircle2,
    XCircle,
    User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { EventEditorDialog } from "@/components/bookings/EventEditorDialog";
import { EventType } from "@/types/booking";

const DEFAULT_EVENTS: EventType[] = [
    { id: "1", name: "Intro Call", duration: 15, slug: "/intro-call", description: "Quick intro call.", isActive: true, color: "bg-blue-500" },
    { id: "2", name: "Product Demo", duration: 45, slug: "/demo", description: "Full product walkthrough.", isActive: true, color: "bg-purple-500" },
    { id: "3", name: "Technical Setup", duration: 60, slug: "/setup", description: "Technical onboarding session.", isActive: true, color: "bg-emerald-500" },
];

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState("bookings");
    const [events, setEvents] = useState<EventType[]>(DEFAULT_EVENTS);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventType | undefined>(undefined);

    const handleCopyLink = (slug: string) => {
        const fullLink = `${window.location.origin}/book${slug}`;
        navigator.clipboard.writeText(fullLink);
        toast.success("Link copied to clipboard!", {
            description: fullLink
        });
    };

    const handleEdit = (event: EventType) => {
        setSelectedEvent(event);
        setIsEditorOpen(true);
    };

    const handleNewEvent = () => {
        setSelectedEvent(undefined);
        setIsEditorOpen(true);
    };

    const handleSaveEvent = (savedEvent: EventType) => {
        setEvents(prev => {
            const exists = prev.find(e => e.id === savedEvent.id);
            if (exists) {
                toast.success("Event type updated successfully");
                return prev.map(e => e.id === savedEvent.id ? savedEvent : e);
            } else {
                toast.success("New event type created");
                return [...prev, savedEvent];
            }
        });
    };

    const handleSettings = () => {
        toast.info("Booking Settings", {
            description: "Booking configuration is currently under development."
        });
    };

    const handleMoreOptions = (name: string) => {
        toast.info(`Options for ${name}`, {
            description: "More actions for this booking will be available soon."
        });
    };

    const handleEditAvailability = (day: string) => {
        toast.info(`Edit ${day} Availability`, {
            description: "Availability management is currently under development."
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
                    <p className="text-muted-foreground">
                        Manage your event types, availability, and scheduled bookings.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSettings}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                    <Button onClick={handleNewEvent}>
                        <Plus className="mr-2 h-4 w-4" />
                        New Event Type
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="bookings" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="events">Event Types</TabsTrigger>
                    <TabsTrigger value="availability">Availability</TabsTrigger>
                </TabsList>

                <TabsContent value="bookings" className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search bookings..." className="pl-9" />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {[
                            { name: "Asif Ahmed", email: "asif@example.com", date: "Dec 20, 2025", time: "10:00 AM - 10:30 AM", type: "Intro Call", status: "confirmed" },
                            { name: "John Doe", email: "john@example.com", date: "Dec 21, 2025", time: "2:00 PM - 2:45 PM", type: "Product Demo", status: "pending" },
                            { name: "Sarah Smith", email: "sarah@example.com", date: "Dec 22, 2025", time: "11:00 AM - 11:30 AM", type: "Intro Call", status: "confirmed" },
                        ].map((booking, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                <Card>
                                    <div className="flex items-center p-4">
                                        <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                                            <User className="h-6 w-6 text-primary" />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium leading-none">{booking.name}</p>
                                                <Badge variant={booking.status === 'confirmed' ? "default" : "outline"}>
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                {booking.date}
                                                <span className="mx-2">•</span>
                                                <Clock className="mr-1 h-3 w-3" />
                                                {booking.time}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Type: <span className="font-semibold text-foreground">{booking.type}</span>
                                            </div>
                                        </div>
                                        <div className="ml-4">
                                            <Button variant="ghost" size="icon" onClick={() => handleMoreOptions(booking.name)}>
                                                <MoreVertical className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {events.map((event) => (
                            <Card key={event.id} className="overflow-hidden border-t-4" style={{ borderColor: 'var(--primary)' }}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl">{event.name}</CardTitle>
                                        <div className={`h-3 w-3 rounded-full ${event.color}`} />
                                    </div>
                                    <CardDescription>{event.duration} min • One-on-One</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            Booking link: <span className="text-primary underline">{event.slug}</span>
                                        </p>
                                        <div className="mt-4 flex gap-2">
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleCopyLink(event.slug)}
                                            >
                                                Copy Link
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => handleEdit(event)}
                                            >
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                        <button
                            className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted p-8 transition-colors hover:bg-muted/50 hover:border-primary"
                            onClick={handleNewEvent}
                        >
                            <Plus className="mb-4 h-12 w-12 text-muted-foreground" />
                            <span className="font-semibold">Add New Event Type</span>
                            <span className="mt-1 text-sm text-muted-foreground text-center">
                                Create a new type of meeting for people to book.
                            </span>
                        </button>
                    </div>
                </TabsContent>

                <TabsContent value="availability" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Working Hours</CardTitle>
                            <CardDescription>
                                Set your default weekly working hours.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, i) => (
                                <div key={day} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 font-medium">{day}</div>
                                        {i < 5 ? (
                                            <div className="flex items-center gap-2">
                                                <Badge>9:00 AM</Badge>
                                                <span className="text-muted-foreground">-</span>
                                                <Badge>5:00 PM</Badge>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">Unavailable</span>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditAvailability(day)}>Edit</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <EventEditorDialog
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                event={selectedEvent}
                onSave={handleSaveEvent}
            />
        </div>
    );
}
