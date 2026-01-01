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
    Eye,
    CalendarClock,
    XCircle,
    CheckCircle,
    Trash2,
    Mail,
    UserPlus,
    Phone,
    Building,
    Tag,
} from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Webhook, RadioTower } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { EventEditorDialog } from "@/components/bookings/EventEditorDialog";
import { BookingSettingsDialog } from "@/components/bookings/BookingSettingsDialog";
import { BookingIntegrationDialog } from "@/components/bookings/BookingIntegrationDialog";
import { AvailabilityDialog } from "@/components/bookings/AvailabilityDialog";
import { EventType, Lead, CustomFieldValue } from "@/types/booking";


import { useEffect } from "react";

// ... imports ...

export default function BookingsPage() {
    const [, setActiveTab] = useState("bookings");
    const [events, setEvents] = useState<EventType[]>([]);
    const [integrations, setIntegrations] = useState<any[]>([]);
    const [bookings, setBookings] = useState<any[]>([]);
    const [leads, setLeads] = useState<Lead[]>([]);

    // Dialog States
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isIntegrationOpen, setIsIntegrationOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<EventType | undefined>(undefined);
    const [selectedIntegration, setSelectedIntegration] = useState<any | undefined>(undefined);
    const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
    const [bookingAction, setBookingAction] = useState<'view' | 'cancel' | 'complete' | 'delete' | null>(null);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [leadAction, setLeadAction] = useState<'view' | 'edit' | 'delete' | null>(null);
    const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
    const [newLeadForm, setNewLeadForm] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        interestedIn: '',
        notes: '',
        priority: 'medium' as Lead['priority'],
        preferredContactMethod: 'email' as Lead['preferredContactMethod'],
        preferredCallbackTime: '',
    });
    // Availability State
    const [availability, setAvailability] = useState<{ [day: string]: { start: string; end: string } | null }>({});
    const [is24x7, setIs24x7] = useState(false);
    const [allowOpenEvents, setAllowOpenEvents] = useState(false);
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
                const [eventsRes, integrationsRes, bookingsRes, settingsRes, leadsRes] = await Promise.all([
                    fetch('/api/bookings/event-types'),
                    fetch('/api/integrations'),
                    fetch('/api/bookings'),
                    fetch('/api/bookings/settings'),
                    fetch('/api/leads')
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
                    if (settings.is24x7 !== undefined) {
                        setIs24x7(settings.is24x7);
                    }
                    if (settings.allowOpenEvents !== undefined) {
                        setAllowOpenEvents(settings.allowOpenEvents);
                    }
                }
                if (leadsRes.ok) {
                    const leadsData = await leadsRes.json();
                    setLeads(Array.isArray(leadsData) ? leadsData : (leadsData.data || []));
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

    // Booking action handlers
    const handleViewBooking = (booking: any) => {
        setSelectedBooking(booking);
        setBookingAction('view');
    };

    const handleCancelBooking = async (booking: any) => {
        setSelectedBooking(booking);
        setBookingAction('cancel');
    };

    const handleCompleteBooking = async (booking: any) => {
        setSelectedBooking(booking);
        setBookingAction('complete');
    };

    const handleDeleteBooking = async (booking: any) => {
        setSelectedBooking(booking);
        setBookingAction('delete');
    };

    const handleSendReminder = async (booking: any) => {
        toast.success(`Reminder sent to ${booking.guestEmail}`, {
            description: "The guest will receive an email reminder shortly."
        });
    };

    const confirmBookingAction = async () => {
        if (!selectedBooking || !bookingAction) return;

        try {
            if (bookingAction === 'cancel') {
                const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'cancelled' })
                });
                if (!res.ok) throw new Error("Failed to cancel");
                setBookings(prev => prev.map(b => 
                    b.id === selectedBooking.id ? { ...b, status: 'cancelled' } : b
                ));
                toast.success("Booking cancelled", {
                    description: `Booking with ${selectedBooking.guestName} has been cancelled.`
                });
            } else if (bookingAction === 'complete') {
                const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'completed' })
                });
                if (!res.ok) throw new Error("Failed to complete");
                setBookings(prev => prev.map(b => 
                    b.id === selectedBooking.id ? { ...b, status: 'completed' } : b
                ));
                toast.success("Booking completed", {
                    description: `Booking with ${selectedBooking.guestName} marked as completed.`
                });
            } else if (bookingAction === 'delete') {
                const res = await fetch(`/api/bookings/${selectedBooking.id}`, {
                    method: 'DELETE'
                });
                if (!res.ok) throw new Error("Failed to delete");
                setBookings(prev => prev.filter(b => b.id !== selectedBooking.id));
                toast.success("Booking deleted", {
                    description: "The booking has been permanently removed."
                });
            }
        } catch (error) {
            toast.error(`Failed to ${bookingAction} booking`);
        } finally {
            setSelectedBooking(null);
            setBookingAction(null);
        }
    };

    // Lead action handlers
    const handleUpdateLeadStatus = async (leadId: string, status: string) => {
        try {
            const res = await fetch(`/api/leads/${leadId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            if (!res.ok) throw new Error("Failed to update");
            setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: status as Lead['status'] } : l));
            toast.success(`Lead marked as ${status}`);
        } catch (error) {
            toast.error("Failed to update lead status");
        }
    };

    const handleDeleteLead = async () => {
        if (!selectedLead) return;
        try {
            const res = await fetch(`/api/leads/${selectedLead.id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete");
            setLeads(prev => prev.filter(l => l.id !== selectedLead.id));
            toast.success("Lead deleted");
        } catch (error) {
            toast.error("Failed to delete lead");
        } finally {
            setSelectedLead(null);
            setLeadAction(null);
        }
    };

    const handleCreateLead = async () => {
        if (!newLeadForm.name || !newLeadForm.email) {
            toast.error("Name and email are required");
            return;
        }
        try {
            const res = await fetch('/api/leads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...newLeadForm,
                    source: 'website',
                })
            });
            if (!res.ok) throw new Error("Failed to create");
            const created = await res.json();
            setLeads(prev => [created, ...prev]);
            toast.success("Lead created successfully");
            setIsNewLeadOpen(false);
            setNewLeadForm({
                name: '',
                email: '',
                phone: '',
                company: '',
                interestedIn: '',
                notes: '',
                priority: 'medium',
                preferredContactMethod: 'email',
                preferredCallbackTime: '',
            });
        } catch (error) {
            toast.error("Failed to create lead");
        }
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

    const handle24x7Toggle = async (enabled: boolean) => {
        setIs24x7(enabled);
        try {
            const settingsRes = await fetch('/api/bookings/settings');
            const currentSettings = settingsRes.ok ? await settingsRes.json() : {};

            const res = await fetch('/api/bookings/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...currentSettings,
                    is24x7: enabled,
                }),
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success(enabled ? "24/7 availability enabled" : "24/7 availability disabled");
        } catch (error) {
            setIs24x7(!enabled); // Revert on error
            toast.error("Failed to update availability mode");
        }
    };

    const handleOpenEventsToggle = async (enabled: boolean) => {
        setAllowOpenEvents(enabled);
        try {
            const settingsRes = await fetch('/api/bookings/settings');
            const currentSettings = settingsRes.ok ? await settingsRes.json() : {};

            const res = await fetch('/api/bookings/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...currentSettings,
                    allowOpenEvents: enabled,
                }),
            });

            if (!res.ok) throw new Error("Failed to save");
            toast.success(enabled ? "Open events enabled - any event type allowed" : "Open events disabled - only predefined event types allowed");
        } catch (error) {
            setAllowOpenEvents(!enabled); // Revert on error
            toast.error("Failed to update event type mode");
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
                <TabsList className="grid w-full grid-cols-5 lg:w-[600px] h-auto">
                    <TabsTrigger value="bookings" className="text-xs sm:text-sm py-2">Bookings</TabsTrigger>
                    <TabsTrigger value="leads" className="text-xs sm:text-sm py-2">Leads</TabsTrigger>
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
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <DropdownMenuItem onClick={() => handleViewBooking(booking)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleSendReminder(booking)}>
                                                        <Mail className="mr-2 h-4 w-4" />
                                                        Send Reminder
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    {booking.status !== 'completed' && (
                                                        <DropdownMenuItem onClick={() => handleCompleteBooking(booking)}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            Mark Complete
                                                        </DropdownMenuItem>
                                                    )}
                                                    {booking.status !== 'cancelled' && (
                                                        <DropdownMenuItem onClick={() => handleCancelBooking(booking)} className="text-orange-500">
                                                            <XCircle className="mr-2 h-4 w-4" />
                                                            Cancel Booking
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => handleDeleteBooking(booking)} className="text-red-500">
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </TabsContent>

                <TabsContent value="leads" className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Search leads..." className="pl-9" />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                        <Button onClick={() => setIsNewLeadOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            New Lead
                        </Button>
                    </div>

                    {leads.length === 0 ? (
                        <Card className="p-8">
                            <div className="flex flex-col items-center justify-center text-center">
                                <div className="p-3 rounded-full bg-muted/50 mb-3">
                                    <UserPlus className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h4 className="font-medium">No leads yet</h4>
                                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                    Leads will appear here when captured via the MCP chatbot or API.
                                </p>
                                <Button variant="outline" size="sm" className="mt-3" onClick={() => setIsNewLeadOpen(true)}>
                                    <UserPlus className="mr-2 h-4 w-4" />
                                    Add First Lead
                                </Button>
                            </div>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {leads.map((lead, i) => (
                                <motion.div
                                    key={lead.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                >
                                    <Card>
                                        <div className="flex items-center p-4">
                                            <div className="mr-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                                                <UserPlus className="h-6 w-6 text-green-500" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium leading-none">{lead.name}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className={
                                                            lead.priority === 'urgent' ? 'bg-red-500/15 text-red-700' :
                                                            lead.priority === 'high' ? 'bg-orange-500/15 text-orange-700' :
                                                            lead.priority === 'medium' ? 'bg-blue-500/15 text-blue-700' :
                                                            'bg-gray-500/15 text-gray-700'
                                                        }>
                                                            {lead.priority}
                                                        </Badge>
                                                        <Badge variant={lead.status === 'new' ? "default" : "outline"}>
                                                            {lead.status}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center">
                                                        <Mail className="mr-1 h-3 w-3" />
                                                        {lead.email}
                                                    </span>
                                                    {lead.phone && (
                                                        <span className="flex items-center">
                                                            <Phone className="mr-1 h-3 w-3" />
                                                            {lead.phone}
                                                        </span>
                                                    )}
                                                    {lead.company && (
                                                        <span className="flex items-center">
                                                            <Building className="mr-1 h-3 w-3" />
                                                            {lead.company}
                                                        </span>
                                                    )}
                                                </div>
                                                {lead.interestedIn && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Interested in: <span className="font-medium text-foreground">{lead.interestedIn}</span>
                                                    </div>
                                                )}
                                                {lead.notes && (
                                                    <div className="text-xs text-muted-foreground mt-1 line-clamp-1">
                                                        {lead.notes}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => { setSelectedLead(lead); setLeadAction('view'); }}>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'contacted')}>
                                                            <Phone className="mr-2 h-4 w-4" />
                                                            Mark Contacted
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'qualified')}>
                                                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                                                            Mark Qualified
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleUpdateLeadStatus(lead.id, 'converted')}>
                                                            <Tag className="mr-2 h-4 w-4 text-blue-500" />
                                                            Mark Converted
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => { setSelectedLead(lead); setLeadAction('delete'); }} className="text-red-500">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="events" className="space-y-4">
                    {/* Open Events Toggle Card */}
                    <Card className={allowOpenEvents ? "border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-transparent" : ""}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">Open Events</CardTitle>
                                    <CardDescription>
                                        Allow any event type name via MCP (no predefined types required)
                                    </CardDescription>
                                </div>
                                <Switch 
                                    checked={allowOpenEvents} 
                                    onCheckedChange={handleOpenEventsToggle}
                                />
                            </div>
                        </CardHeader>
                        {allowOpenEvents && (
                            <CardContent className="pt-0">
                                <p className="text-sm text-blue-600">
                                    AI agents can create bookings with any event type name. A default 30-minute duration will be used.
                                </p>
                            </CardContent>
                        )}
                    </Card>

                    {/* Event Types Grid */}
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
                    {/* 24/7 Toggle Card */}
                    <Card className={is24x7 ? "border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent" : ""}>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="text-base">24/7 Availability</CardTitle>
                                    <CardDescription>
                                        Accept bookings at any time, any day
                                    </CardDescription>
                                </div>
                                <Switch 
                                    checked={is24x7} 
                                    onCheckedChange={handle24x7Toggle}
                                />
                            </div>
                        </CardHeader>
                        {is24x7 && (
                            <CardContent className="pt-0">
                                <p className="text-sm text-green-600">
                                    Bookings are available 24 hours a day, 7 days a week. Working hours below are ignored.
                                </p>
                            </CardContent>
                        )}
                    </Card>

                    {/* Working Hours Card */}
                    <Card className={is24x7 ? "opacity-50" : ""}>
                        <CardHeader>
                            <CardTitle>Working Hours</CardTitle>
                            <CardDescription>
                                {is24x7 ? "These hours are ignored when 24/7 mode is enabled." : "Set your default weekly working hours."}
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
                                    <Button variant="ghost" size="sm" onClick={() => handleEditAvailability(day)} disabled={is24x7}>Edit</Button>
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

            {/* View Booking Dialog */}
            <AlertDialog open={bookingAction === 'view'} onOpenChange={(open) => !open && setBookingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Booking Details</AlertDialogTitle>
                    </AlertDialogHeader>
                    {selectedBooking && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Guest</p>
                                    <p className="font-medium">{selectedBooking.guestName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedBooking.guestEmail}</p>
                                </div>
                                {selectedBooking.guestPhone && (
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedBooking.guestPhone}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Event Type</p>
                                    <p className="font-medium">{selectedBooking.eventTypeName}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant={selectedBooking.status === 'confirmed' ? "default" : "outline"}>
                                        {selectedBooking.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Date</p>
                                    <p className="font-medium">{new Date(selectedBooking.startTime).toLocaleDateString()}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Time</p>
                                    <p className="font-medium">{new Date(selectedBooking.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            </div>
                            {selectedBooking.agenda && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Agenda</p>
                                    <p className="text-sm mt-1">{selectedBooking.agenda}</p>
                                </div>
                            )}
                            {selectedBooking.guestNotes && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Notes</p>
                                    <p className="text-sm mt-1">{selectedBooking.guestNotes}</p>
                                </div>
                            )}
                            {selectedBooking.meetingUrl && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Meeting URL</p>
                                    <a href={selectedBooking.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline mt-1 block">
                                        {selectedBooking.meetingUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Cancel Booking Confirmation */}
            <AlertDialog open={bookingAction === 'cancel'} onOpenChange={(open) => !open && setBookingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to cancel the booking with {selectedBooking?.guestName}? 
                            They will be notified of the cancellation.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBookingAction} className="bg-orange-500 hover:bg-orange-600">
                            Cancel Booking
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Complete Booking Confirmation */}
            <AlertDialog open={bookingAction === 'complete'} onOpenChange={(open) => !open && setBookingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Mark as Complete?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Mark the booking with {selectedBooking?.guestName} as completed?
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBookingAction} className="bg-green-500 hover:bg-green-600">
                            Mark Complete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Booking Confirmation */}
            <AlertDialog open={bookingAction === 'delete'} onOpenChange={(open) => !open && setBookingAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Booking?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the booking with {selectedBooking?.guestName}. 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmBookingAction} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* View Lead Dialog */}
            <AlertDialog open={leadAction === 'view'} onOpenChange={(open) => !open && setLeadAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Lead Details</AlertDialogTitle>
                    </AlertDialogHeader>
                    {selectedLead && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Name</p>
                                    <p className="font-medium">{selectedLead.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{selectedLead.email}</p>
                                </div>
                                {selectedLead.phone && (
                                    <div>
                                        <p className="text-muted-foreground">Phone</p>
                                        <p className="font-medium">{selectedLead.phone}</p>
                                    </div>
                                )}
                                {selectedLead.company && (
                                    <div>
                                        <p className="text-muted-foreground">Company</p>
                                        <p className="font-medium">{selectedLead.company}</p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <Badge variant={selectedLead.status === 'new' ? "default" : "outline"}>
                                        {selectedLead.status}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Priority</p>
                                    <Badge className={
                                        selectedLead.priority === 'urgent' ? 'bg-red-500/15 text-red-700' :
                                        selectedLead.priority === 'high' ? 'bg-orange-500/15 text-orange-700' :
                                        'bg-blue-500/15 text-blue-700'
                                    }>
                                        {selectedLead.priority}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Source</p>
                                    <p className="font-medium">{selectedLead.source}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Contact Method</p>
                                    <p className="font-medium">{selectedLead.preferredContactMethod || 'email'}</p>
                                </div>
                            </div>
                            {selectedLead.interestedIn && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Interested In</p>
                                    <p className="text-sm mt-1">{selectedLead.interestedIn}</p>
                                </div>
                            )}
                            {selectedLead.preferredCallbackTime && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Preferred Callback Time</p>
                                    <p className="text-sm mt-1">{selectedLead.preferredCallbackTime}</p>
                                </div>
                            )}
                            {selectedLead.notes && (
                                <div>
                                    <p className="text-muted-foreground text-sm">Notes</p>
                                    <p className="text-sm mt-1">{selectedLead.notes}</p>
                                </div>
                            )}
                            <div className="text-xs text-muted-foreground">
                                Created: {new Date(selectedLead.createdAt).toLocaleString()}
                            </div>
                        </div>
                    )}
                    <AlertDialogFooter>
                        <AlertDialogCancel>Close</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Lead Confirmation */}
            <AlertDialog open={leadAction === 'delete'} onOpenChange={(open) => !open && setLeadAction(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the lead for {selectedLead?.name}. 
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteLead} className="bg-red-500 hover:bg-red-600">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* New Lead Dialog */}
            <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Add New Lead</DialogTitle>
                        <DialogDescription>
                            Capture a new lead for follow-up or callback.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="lead-name">Name *</Label>
                                <Input
                                    id="lead-name"
                                    value={newLeadForm.name}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lead-email">Email *</Label>
                                <Input
                                    id="lead-email"
                                    type="email"
                                    value={newLeadForm.email}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, email: e.target.value }))}
                                    placeholder="john@example.com"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="lead-phone">Phone</Label>
                                <Input
                                    id="lead-phone"
                                    value={newLeadForm.phone}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder="+1 234 567 8900"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lead-company">Company</Label>
                                <Input
                                    id="lead-company"
                                    value={newLeadForm.company}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, company: e.target.value }))}
                                    placeholder="Acme Inc"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Priority</Label>
                                <Select
                                    value={newLeadForm.priority}
                                    onValueChange={(value) => setNewLeadForm(prev => ({ ...prev, priority: value as Lead['priority'] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="low">Low</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="urgent">Urgent</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Contact Method</Label>
                                <Select
                                    value={newLeadForm.preferredContactMethod}
                                    onValueChange={(value) => setNewLeadForm(prev => ({ ...prev, preferredContactMethod: value as Lead['preferredContactMethod'] }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="email">Email</SelectItem>
                                        <SelectItem value="phone">Phone</SelectItem>
                                        <SelectItem value="callback">Callback</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lead-interested">Interested In</Label>
                            <Input
                                id="lead-interested"
                                value={newLeadForm.interestedIn}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, interestedIn: e.target.value }))}
                                placeholder="Product demo, consultation, etc."
                            />
                        </div>
                        {newLeadForm.preferredContactMethod === 'callback' && (
                            <div className="space-y-2">
                                <Label htmlFor="lead-callback">Preferred Callback Time</Label>
                                <Input
                                    id="lead-callback"
                                    value={newLeadForm.preferredCallbackTime}
                                    onChange={(e) => setNewLeadForm(prev => ({ ...prev, preferredCallbackTime: e.target.value }))}
                                    placeholder="e.g., Tomorrow 2-4 PM"
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="lead-notes">Notes</Label>
                            <Textarea
                                id="lead-notes"
                                value={newLeadForm.notes}
                                onChange={(e) => setNewLeadForm(prev => ({ ...prev, notes: e.target.value }))}
                                placeholder="Additional context about this lead..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsNewLeadOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreateLead}>
                            Create Lead
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
