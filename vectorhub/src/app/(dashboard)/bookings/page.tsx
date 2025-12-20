"use client";

import { useState } from "react";
import {
    Calendar,
    Clock,
    Plus,
    Settings2,
    Search,
    Filter,
    MoreVertical,
    User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Webhook, RadioTower, ExternalLink } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EventEditorDialog } from "@/components/bookings/EventEditorDialog";
import { BookingSettingsDialog } from "@/components/bookings/BookingSettingsDialog";
import { BookingIntegrationDialog } from "@/components/bookings/BookingIntegrationDialog";
import { EventType } from "@/types/booking";


import { useEffect } from "react";

// ... imports ...

export default function BookingsPage() {
    const [activeTab, setActiveTab] = useState("bookings");
    const [events, setEvents] = useState<EventType[]>([]);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);

    // Dialog States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventType | undefined>(undefined);

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [eventsRes, integrationsRes, bookingsRes] = await Promise.all([
                    fetch('/api/bookings/event-types'),
                    fetch('/api/integrations'),
                    fetch('/api/bookings')
                ]);

                if (eventsRes.ok) setEvents(await eventsRes.json());
                if (integrationsRes.ok) setIntegrations(await integrationsRes.json());
                if (bookingsRes.ok) setBookings(await bookingsRes.json());
            } catch (error) {
                console.error("Failed to load data", error);
                toast.error("Failed to load dashboard data");
            }
        };
        loadData();
    }, []);

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

    const handleSaveEvent = async (savedEvent: EventType) => {
        try {
            const res = await fetch('/api/bookings/event-types', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(savedEvent)
            });

            if (!res.ok) throw new Error("Failed to save");
            const updatedEvent = await res.json();

            setEvents(prev => {
                const exists = prev.find(e => e.id === updatedEvent.id);
                if (exists) {
                    toast.success("Event type updated successfully");
                    return prev.map(e => e.id === updatedEvent.id ? updatedEvent : e);
                } else {
                    toast.success("New event type created");
                    return [...prev, updatedEvent];
                }
            });
        } catch (error) {
            toast.error("Failed to save event type");
        }
    };

    const handleSaveIntegration = async (integration: any) => {
        try {
            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(integration)
            });

            if (!res.ok) throw new Error("Failed to save");
            const saved = await res.json();

            setIntegrations(prev => [...prev, saved]);
            setIsIntegrationOpen(false); // Close dialog here since page handles save
        } catch (error) {
            toast.error("Failed to save integration");
        }
    };

    const handleSettings = () => {
        setIsSettingsOpen(true);
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
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px]">
                    <TabsTrigger value="bookings">Bookings</TabsTrigger>
                    <TabsTrigger value="events">Event Types</TabsTrigger>
                    <TabsTrigger value="availability">Availability</TabsTrigger>
                    <TabsTrigger value="integrations">Integrations</TabsTrigger>
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
                        {bookings.map((booking, i) => (
                            <motion.div
                                key={booking.id}
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
                                                <p className="text-sm font-medium leading-none">{booking.guestName}</p>
                                                <Badge variant={booking.status === 'confirmed' ? "default" : "outline"}>
                                                    {booking.status}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center text-sm text-muted-foreground">
                                                <Calendar className="mr-1 h-3 w-3" />
                                                {new Date(booking.startTime).toLocaleDateString()}
                                                <span className="mx-2">•</span>
                                                <Clock className="mr-1 h-3 w-3" />
                                                {new Date(booking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                Type: <span className="font-semibold text-foreground">{booking.eventTypeName}</span>
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
                            <Card key={event.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${event.color}`} />
                                <CardHeader className="pl-6">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-xl">{event.name}</CardTitle>
                                        <Switch checked={event.isActive} />
                                    </div>
                                    <CardDescription>{event.duration} min • One-on-One</CardDescription>
                                </CardHeader>
                                <CardContent className="pl-6">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-sm text-muted-foreground">
                                            Booking link: <span className="text-primary hover:underline cursor-pointer">{event.slug}</span>
                                        </p>
                                        <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-9 text-xs"
                                                onClick={() => handleCopyLink(event.slug)}
                                            >
                                                Copy Link
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 h-9 text-xs"
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

                <TabsContent value="integrations" className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-medium">Active Integrations</h3>
                            <p className="text-sm text-muted-foreground">
                                Connect your booking flow to external tools.
                            </p>
                        </div>
                        <Button onClick={() => setIsIntegrationOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Connection
                        </Button>
                    </div>

                    <div className="grid gap-4">
                        {integrations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg border-muted">
                                <div className="p-3 rounded-full bg-muted/50 mb-4">
                                    <ExternalLink className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-medium">No integrations yet</h3>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    Add a webhook or MCP server to automate your workflow when a booking happens.
                                </p>
                            </div>
                        ) : (
                            integrations.map((integration) => (
                                <Card key={integration.id}>
                                    <div className="flex items-center p-4 gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            {integration.type === 'webhook' ? (
                                                <Webhook className="h-5 w-5 text-primary" />
                                            ) : (
                                                <RadioTower className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{integration.name}</h4>
                                                <Badge variant="secondary" className="text-xs uppercase">
                                                    {integration.type}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground truncate max-w-md">
                                                {integration.config.url}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/25 border-green-200">
                                                Active
                                            </Badge>
                                            <Button variant="ghost" size="sm">Configure</Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            <EventEditorDialog
                open={isEditorOpen}
                onOpenChange={setIsEditorOpen}
                event={selectedEvent}
                onSave={handleSaveEvent}
            />

            <BookingSettingsDialog
                open={isSettingsOpen}
                onOpenChange={setIsSettingsOpen}
            />

            <BookingIntegrationDialog
                open={isIntegrationOpen}
                onOpenChange={setIsIntegrationOpen}
                onSave={handleSaveIntegration}
            />
        </div>
    );
}
