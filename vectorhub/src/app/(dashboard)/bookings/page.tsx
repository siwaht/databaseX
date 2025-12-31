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
    Download,
    Upload,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Webhook, RadioTower } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { EventEditorDialog } from "@/components/bookings/EventEditorDialog";
import { BookingSettingsDialog } from "@/components/bookings/BookingSettingsDialog";
import { BookingIntegrationDialog } from "@/components/bookings/BookingIntegrationDialog";
import { AvailabilityDialog } from "@/components/bookings/AvailabilityDialog";
import { EventType } from "@/types/booking";


import { useEffect } from "react";

// ... imports ...

export default function BookingsPage() {
    const [, setActiveTab] = useState("bookings");
    const [events, setEvents] = useState<EventType[]>([]);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);

    // Dialog States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventType | undefined>(undefined);
    const [selectedIntegration, setSelectedIntegration] = useState<any | undefined>(undefined);
    // Availability State
    const [availability, setAvailability] = useState<{ [day: string]: { start: string; end: string } | null }>({});
    const [editingDay, setEditingDay] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Import/Export Handlers
    const handleExport = () => {
        window.open('/api/admin/data', '_blank');
        toast.success("Export started");
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                const res = await fetch('/api/admin/data', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(json)
                });

                if (!res.ok) throw new Error("Import failed");

                toast.success("Data imported successfully. Reloading...");
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                console.error("Import error", error);
                toast.error("Failed to import data. Invalid file format.");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                const [eventsRes, integrationsRes, bookingsRes, settingsRes] = await Promise.all([
                    fetch('/api/bookings/event-types'),
                    fetch('/api/integrations'),
                    fetch('/api/bookings'),
                    fetch('/api/bookings/settings')
                ]);

                if (eventsRes.ok) {
                    const eventsData = await eventsRes.json();
                    // Handle both array and { data: [...] } formats
                    setEvents(Array.isArray(eventsData) ? eventsData : (eventsData.data || []));
                }
                if (integrationsRes.ok) {
                    const integrationsData = await integrationsRes.json();
                    setIntegrations(Array.isArray(integrationsData) ? integrationsData : (integrationsData.data || []));
                }
                if (bookingsRes.ok) {
                    const bookingsData = await bookingsRes.json();
                    // Handle both array and { data: [...] } formats
                    setBookings(Array.isArray(bookingsData) ? bookingsData : (bookingsData.data || []));
                }
                if (settingsRes.ok) {
                    const settings = await settingsRes.json();
                    if (settings.availability) {
                        setAvailability(settings.availability);
                    }
                }
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

    const handleSaveEvent = async (savedEvent: Omit<EventType, "id"> & { id?: string }) => {
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

            setIntegrations(prev => {
                const exists = prev.find(i => i.id === saved.id);
                if (exists) {
                    return prev.map(i => i.id === saved.id ? saved : i);
                }
                return [...prev, saved];
            });
            setIsIntegrationOpen(false); // Close dialog here since page handles save
        } catch (error) {
            toast.error("Failed to save integration");
        }
    };

    const handleConfigure = (integration: any) => {
        setSelectedIntegration(integration);
        setIsIntegrationOpen(true);
    };

    const handleNewIntegration = () => {
        setSelectedIntegration(undefined);
        setIsIntegrationOpen(true);
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
        setEditingDay(day);
    };

    const handleSaveAvailability = async (day: string, dayAvailability: { start: string; end: string } | null) => {
        const newAvailability = { ...availability, [day]: dayAvailability };
        setAvailability(newAvailability);

        // Fetch current settings to preserve other fields like timezone
        try {
            const settingsRes = await fetch('/api/bookings/settings');
            const currentSettings = settingsRes.ok ? await settingsRes.json() : {};

            const res = await fetch('/api/bookings/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...currentSettings,
                    availability: newAvailability,
                }),
            });

            if (!res.ok) throw new Error("Failed to save availability");
            toast.success(`${day} availability updated`);
        } catch (error) {
            toast.error("Failed to save availability");
            // Revert on error could be added here
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Booking Management</h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Manage your event types, availability, and scheduled bookings.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleSettings}>
                        <Settings2 className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Export</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleImportClick}>
                        <Upload className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">Import</span>
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".json"
                        onChange={handleFileChange}
                    />
                    <Button size="sm" onClick={handleNewEvent}>
                        <Plus className="mr-2 h-4 w-4" />
                        <span className="hidden sm:inline">New Event Type</span>
                        <span className="sm:hidden">New</span>
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="bookings" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 lg:w-[500px] h-auto">
                    <TabsTrigger value="bookings" className="text-xs sm:text-sm py-2">Bookings</TabsTrigger>
                    <TabsTrigger value="events" className="text-xs sm:text-sm py-2">Events</TabsTrigger>
                    <TabsTrigger value="availability" className="text-xs sm:text-sm py-2">Hours</TabsTrigger>
                    <TabsTrigger value="integrations" className="text-xs sm:text-sm py-2">Integrations</TabsTrigger>
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
                    <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                        <CardContent className="space-y-4 sm:space-y-6">
                            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, i) => (
                                <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 border-b pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between sm:justify-start gap-4">
                                        <div className="w-20 sm:w-24 font-medium text-sm sm:text-base">{day}</div>
                                        {availability[day] ? (
                                            <div className="flex items-center gap-2">
                                                <Badge className="text-xs">{availability[day]?.start}</Badge>
                                                <span className="text-muted-foreground">-</span>
                                                <Badge className="text-xs">{availability[day]?.end}</Badge>
                                            </div>
                                        ) : (
                                            <span className="text-xs sm:text-sm text-muted-foreground italic">Unavailable</span>
                                        )}
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleEditAvailability(day)}>Edit</Button>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="integrations" className="space-y-6">
                    {/* MCP Server Section */}
                    <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <RadioTower className="h-5 w-5 text-purple-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">MCP Server for AI Agents</CardTitle>
                                        <CardDescription>
                                            Let AI assistants manage bookings automatically
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge className="bg-green-500/15 text-green-700 border-green-200">
                                    Active
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                                <code className="flex-1 text-sm font-mono truncate">
                                    {typeof window !== 'undefined' ? `${window.location.origin}/api/bookings/mcp` : '/api/bookings/mcp'}
                                </code>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                        navigator.clipboard.writeText(`${window.location.origin}/api/bookings/mcp`);
                                        toast.success("MCP endpoint copied!");
                                    }}
                                >
                                    Copy
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="outline" className="text-xs">booking_list</Badge>
                                <Badge variant="outline" className="text-xs">booking_create</Badge>
                                <Badge variant="outline" className="text-xs">booking_update</Badge>
                                <Badge variant="outline" className="text-xs">booking_cancel</Badge>
                                <Badge variant="outline" className="text-xs">availability_check</Badge>
                                <Badge variant="outline" className="text-xs">+4 more</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                AI agents can use this endpoint to list, create, update, and cancel bookings via the Model Context Protocol.
                            </p>
                        </CardContent>
                    </Card>

                    {/* Webhooks Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-medium flex items-center gap-2">
                                    <Webhook className="h-5 w-5 text-blue-500" />
                                    Webhook Integrations
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Send booking events to external services like Slack, Zapier, or your own server.
                                </p>
                            </div>
                            <Button onClick={handleNewIntegration}>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Webhook
                            </Button>
                        </div>

                        <div className="grid gap-3">
                            {integrations.filter(i => i.type === 'webhook').length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed rounded-lg border-muted">
                                    <div className="p-3 rounded-full bg-muted/50 mb-3">
                                        <Webhook className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                    <h4 className="font-medium">No webhooks configured</h4>
                                    <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                        Add a webhook to get notified when bookings are created or cancelled.
                                    </p>
                                    <Button variant="outline" size="sm" className="mt-3" onClick={handleNewIntegration}>
                                        Add Webhook
                                    </Button>
                                </div>
                            ) : (
                                integrations.filter(i => i.type === 'webhook').map((integration) => (
                                    <Card key={integration.id}>
                                        <div className="flex items-center p-4 gap-4">
                                            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                                <Webhook className="h-5 w-5 text-blue-500" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium">{integration.name}</h4>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {integration.config?.url}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Badge className="bg-green-500/15 text-green-700 border-green-200">
                                                    Active
                                                </Badge>
                                                <Button variant="ghost" size="sm" onClick={() => handleConfigure(integration)}>
                                                    Edit
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
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
                integration={selectedIntegration}
                onSave={handleSaveIntegration}
            />

            <AvailabilityDialog
                open={!!editingDay}
                onOpenChange={(open) => !open && setEditingDay(null)}
                day={editingDay || ""}
                currentAvailability={editingDay ? availability[editingDay] : null}
                onSave={handleSaveAvailability}
            />
        </div>
    );
}
