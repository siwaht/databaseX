/**
 * MCP Tools for Booking Management and Lead Capture
 * Provides a standardized interface for AI agents to interact with the booking system
 */

import {
    listBookings,
    createBooking,
    updateBooking,
    deleteBooking,
    listEventTypes,
    createEventType,
    updateEventType,
    deleteEventType,
    getBookingSettings,
} from "./store";
import {
    listLeads,
    createLead,
    updateLead,
    deleteLead,
    getLead,
    getLeadStats,
} from "@/lib/leads/store";
import { Booking, EventType, BookingStatus, Lead, LeadStatus } from "@/types/booking";
import { broadcastWebhook } from "@/lib/webhooks/delivery";
import { listWebhookConnections, getWebhookSecret } from "@/lib/webhooks/store";

// MCP Tool definitions following the Model Context Protocol spec
export const bookingMcpTools = [
    {
        name: "booking_list",
        description: "List all bookings with optional filtering by status, date range, or event type",
        inputSchema: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["pending", "confirmed", "cancelled", "completed"],
                    description: "Filter by booking status",
                },
                eventTypeId: {
                    type: "string",
                    description: "Filter by event type ID",
                },
                startDate: {
                    type: "string",
                    description: "Filter bookings starting from this date (ISO format)",
                },
                endDate: {
                    type: "string",
                    description: "Filter bookings until this date (ISO format)",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of results to return",
                    default: 50,
                },
            },
        },
    },
    {
        name: "booking_get",
        description: "Get a specific booking by ID",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The booking ID" },
            },
            required: ["id"],
        },
    },
    {
        name: "booking_create",
        description: "Create a new booking for a guest. Use this when someone wants to schedule a meeting or appointment.",
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string", description: "The event type ID" },
                startTime: { type: "string", description: "Start time in ISO format" },
                endTime: { type: "string", description: "End time in ISO format (optional, calculated from duration)" },
                guestName: { type: "string", description: "Guest's full name" },
                guestEmail: { type: "string", description: "Guest's email address" },
                guestPhone: { type: "string", description: "Guest's phone number (optional)" },
                notes: { type: "string", description: "Notes about the booking - any additional information, requirements, or context" },
                guestNotes: { type: "string", description: "Notes from the guest (alias for notes)" },
                agenda: { type: "string", description: "Meeting agenda or topics to discuss" },
            },
            required: ["eventTypeId", "startTime", "guestName", "guestEmail"],
        },
    },
    {
        name: "booking_update",
        description: "Update an existing booking's details, status, or notes",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The booking ID to update" },
                status: {
                    type: "string",
                    enum: ["pending", "confirmed", "cancelled", "completed"],
                },
                startTime: { type: "string", description: "New start time" },
                endTime: { type: "string", description: "New end time" },
                notes: { type: "string", description: "Updated notes for the booking" },
                guestNotes: { type: "string", description: "Updated guest notes (alias for notes)" },
                agenda: { type: "string" },
                meetingUrl: { type: "string", description: "Video meeting URL" },
            },
            required: ["id"],
        },
    },
    {
        name: "booking_cancel",
        description: "Cancel a booking",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The booking ID to cancel" },
                reason: { type: "string", description: "Cancellation reason" },
            },
            required: ["id"],
        },
    },
    {
        name: "booking_delete",
        description: "Permanently delete a booking",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The booking ID to delete" },
            },
            required: ["id"],
        },
    },
    {
        name: "event_types_list",
        description: "List all available event types (meeting types)",
        inputSchema: {
            type: "object",
            properties: {
                activeOnly: {
                    type: "boolean",
                    description: "Only return active event types",
                    default: true,
                },
            },
        },
    },
    {
        name: "event_type_create",
        description: "Create a new event type",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Event type name" },
                description: { type: "string", description: "Description" },
                duration: { type: "number", description: "Duration in minutes" },
                color: { type: "string", description: "Color hex code" },
            },
            required: ["name", "duration"],
        },
    },
    {
        name: "availability_check",
        description: "Check available time slots for a specific date and event type",
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string", description: "Event type ID" },
                date: { type: "string", description: "Date to check (YYYY-MM-DD)" },
            },
            required: ["eventTypeId", "date"],
        },
    },
    // Lead Capture Tools
    {
        name: "lead_create",
        description: "Capture a new lead for callback requests, inquiries, or when someone wants to be contacted later",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Lead's full name" },
                email: { type: "string", description: "Lead's email address" },
                phone: { type: "string", description: "Lead's phone number" },
                company: { type: "string", description: "Lead's company name" },
                source: { 
                    type: "string", 
                    enum: ["website", "chatbot", "referral", "social", "other"],
                    description: "Where the lead came from"
                },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "Lead priority level"
                },
                notes: { type: "string", description: "Additional notes about the lead or their inquiry" },
                interestedIn: { type: "string", description: "What the lead is interested in" },
                preferredContactMethod: {
                    type: "string",
                    enum: ["email", "phone", "callback"],
                    description: "How the lead prefers to be contacted"
                },
                preferredCallbackTime: { type: "string", description: "When the lead wants to be called back" },
                tags: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Tags to categorize the lead"
                },
            },
            required: ["name", "email"],
        },
    },
    {
        name: "lead_list",
        description: "List all captured leads with optional filtering",
        inputSchema: {
            type: "object",
            properties: {
                status: {
                    type: "string",
                    enum: ["new", "contacted", "qualified", "converted", "lost"],
                    description: "Filter by lead status",
                },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "Filter by priority",
                },
                limit: {
                    type: "number",
                    description: "Maximum number of results",
                    default: 50,
                },
            },
        },
    },
    {
        name: "lead_update",
        description: "Update an existing lead's information or status",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The lead ID to update" },
                status: {
                    type: "string",
                    enum: ["new", "contacted", "qualified", "converted", "lost"],
                },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                },
                notes: { type: "string", description: "Updated notes" },
                phone: { type: "string" },
                company: { type: "string" },
                tags: { type: "array", items: { type: "string" } },
            },
            required: ["id"],
        },
    },
    {
        name: "lead_get",
        description: "Get details of a specific lead",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The lead ID" },
            },
            required: ["id"],
        },
    },
    {
        name: "lead_stats",
        description: "Get statistics about leads (counts by status, source, priority)",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
];

// Tool handler implementations
export async function handleBookingToolCall(
    toolName: string,
    args: Record<string, unknown>
): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
        switch (toolName) {
            case "booking_list": {
                let bookings = await listBookings();

                // Apply filters
                if (args.status) {
                    bookings = bookings.filter((b) => b.status === args.status);
                }
                if (args.eventTypeId) {
                    bookings = bookings.filter((b) => b.eventTypeId === args.eventTypeId);
                }
                if (args.startDate) {
                    const start = new Date(args.startDate as string);
                    bookings = bookings.filter((b) => new Date(b.startTime) >= start);
                }
                if (args.endDate) {
                    const end = new Date(args.endDate as string);
                    bookings = bookings.filter((b) => new Date(b.startTime) <= end);
                }

                // Apply limit
                const limit = (args.limit as number) || 50;
                bookings = bookings.slice(0, limit);

                return { success: true, data: bookings };
            }

            case "booking_get": {
                const bookings = await listBookings();
                const booking = bookings.find((b) => b.id === args.id);
                if (!booking) {
                    return { success: false, error: `Booking not found: ${args.id}` };
                }
                return { success: true, data: booking };
            }

            case "booking_create": {
                const eventTypes = await listEventTypes();
                const eventType = eventTypes.find((e) => e.id === args.eventTypeId);

                if (!eventType) {
                    return { success: false, error: `Event type not found: ${args.eventTypeId}` };
                }

                // Calculate end time if not provided
                let endTime = args.endTime as string;
                if (!endTime && args.startTime) {
                    const start = new Date(args.startTime as string);
                    start.setMinutes(start.getMinutes() + eventType.duration);
                    endTime = start.toISOString();
                }

                // Accept both 'notes' and 'guestNotes' for flexibility
                const bookingNotes = (args.notes as string) || (args.guestNotes as string) || undefined;

                const newBooking: Booking = {
                    id: crypto.randomUUID(),
                    eventTypeId: args.eventTypeId as string,
                    eventTypeName: eventType.name,
                    startTime: args.startTime as string,
                    endTime: endTime,
                    guestName: args.guestName as string,
                    guestEmail: args.guestEmail as string,
                    guestNotes: bookingNotes,
                    agenda: args.agenda as string | undefined,
                    status: "confirmed",
                    createdAt: new Date().toISOString(),
                };

                const created = await createBooking(newBooking);

                // Broadcast webhook event
                await broadcastBookingEvent("booking.created", created as unknown as Record<string, unknown>);

                return { success: true, data: created };
            }

            case "booking_update": {
                const { id, notes, ...otherUpdates } = args;
                
                // Handle notes field - accept both 'notes' and 'guestNotes'
                const updates: Partial<Booking> = { ...otherUpdates } as Partial<Booking>;
                if (notes || args.guestNotes) {
                    updates.guestNotes = (notes as string) || (args.guestNotes as string);
                }
                
                const updated = await updateBooking(id as string, updates);

                if (!updated) {
                    return { success: false, error: `Booking not found: ${id}` };
                }

                // Broadcast webhook event
                await broadcastBookingEvent("booking.updated", updated as unknown as Record<string, unknown>);

                return { success: true, data: updated };
            }

            case "booking_cancel": {
                const updated = await updateBooking(args.id as string, {
                    status: "cancelled" as BookingStatus,
                });

                if (!updated) {
                    return { success: false, error: `Booking not found: ${args.id}` };
                }

                // Broadcast webhook event
                await broadcastBookingEvent("booking.cancelled", {
                    ...(updated as unknown as Record<string, unknown>),
                    cancellationReason: args.reason,
                });

                return { success: true, data: updated };
            }

            case "booking_delete": {
                const deleted = await deleteBooking(args.id as string);
                if (!deleted) {
                    return { success: false, error: `Booking not found: ${args.id}` };
                }

                // Broadcast webhook event
                await broadcastBookingEvent("booking.deleted", { id: args.id });

                return { success: true, data: { deleted: true, id: args.id } };
            }

            case "event_types_list": {
                let eventTypes = await listEventTypes();
                if (args.activeOnly !== false) {
                    eventTypes = eventTypes.filter((e) => e.isActive);
                }
                return { success: true, data: eventTypes };
            }

            case "event_type_create": {
                const slug = (args.name as string)
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/(^-|-$)/g, "");

                const newEventType: EventType = {
                    id: crypto.randomUUID(),
                    name: args.name as string,
                    description: (args.description as string) || "",
                    duration: args.duration as number,
                    slug,
                    isActive: true,
                    color: (args.color as string) || "#3b82f6",
                };

                const created = await createEventType(newEventType);
                return { success: true, data: created };
            }

            case "availability_check": {
                const settings = await getBookingSettings();
                const eventTypes = await listEventTypes();
                const eventType = eventTypes.find((e) => e.id === args.eventTypeId);

                if (!eventType) {
                    return { success: false, error: `Event type not found: ${args.eventTypeId}` };
                }

                const date = new Date(args.date as string);
                const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
                const dayAvailability = settings.availability[dayName];

                if (!dayAvailability) {
                    return {
                        success: true,
                        data: { available: false, slots: [], reason: "Day not available" },
                    };
                }

                // Get existing bookings for this date
                const bookings = await listBookings();
                const dayBookings = bookings.filter((b) => {
                    const bookingDate = new Date(b.startTime).toDateString();
                    return bookingDate === date.toDateString() && b.status !== "cancelled";
                });

                // Generate available slots
                const slots = generateTimeSlots(
                    dayAvailability.start,
                    dayAvailability.end,
                    eventType.duration,
                    dayBookings,
                    date
                );

                return {
                    success: true,
                    data: {
                        date: args.date,
                        eventType: eventType.name,
                        duration: eventType.duration,
                        available: slots.length > 0,
                        slots,
                    },
                };
            }

            // Lead Capture Tools
            case "lead_create": {
                const newLead: Lead = {
                    id: crypto.randomUUID(),
                    name: args.name as string,
                    email: args.email as string,
                    phone: args.phone as string | undefined,
                    company: args.company as string | undefined,
                    source: (args.source as Lead["source"]) || "chatbot",
                    status: "new",
                    priority: (args.priority as Lead["priority"]) || "medium",
                    notes: args.notes as string | undefined,
                    interestedIn: args.interestedIn as string | undefined,
                    preferredContactMethod: args.preferredContactMethod as Lead["preferredContactMethod"],
                    preferredCallbackTime: args.preferredCallbackTime as string | undefined,
                    tags: args.tags as string[] | undefined,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                };

                const created = await createLead(newLead);

                // Broadcast webhook event
                await broadcastBookingEvent("lead.created", created as unknown as Record<string, unknown>);

                return { 
                    success: true, 
                    data: {
                        ...created,
                        message: `Lead captured successfully. ${created.preferredContactMethod === 'callback' ? 'Callback requested.' : 'Will be contacted via ' + created.preferredContactMethod + '.'}`
                    }
                };
            }

            case "lead_list": {
                let leads = await listLeads();

                // Apply filters
                if (args.status) {
                    leads = leads.filter((l) => l.status === args.status);
                }
                if (args.priority) {
                    leads = leads.filter((l) => l.priority === args.priority);
                }

                // Apply limit
                const limit = (args.limit as number) || 50;
                leads = leads.slice(0, limit);

                return { success: true, data: leads };
            }

            case "lead_update": {
                const { id, ...updates } = args;
                const updated = await updateLead(id as string, updates as Partial<Lead>);

                if (!updated) {
                    return { success: false, error: `Lead not found: ${id}` };
                }

                await broadcastBookingEvent("lead.updated", updated as unknown as Record<string, unknown>);

                return { success: true, data: updated };
            }

            case "lead_get": {
                const lead = await getLead(args.id as string);
                if (!lead) {
                    return { success: false, error: `Lead not found: ${args.id}` };
                }
                return { success: true, data: lead };
            }

            case "lead_stats": {
                const stats = await getLeadStats();
                return { success: true, data: stats };
            }

            default:
                return { success: false, error: `Unknown tool: ${toolName}` };
        }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

// Helper to generate available time slots
function generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    existingBookings: Booking[],
    date: Date
): { start: string; end: string }[] {
    const slots: { start: string; end: string }[] = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const current = new Date(date);
    current.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMin, 0, 0);

    while (current < endDate) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        if (slotEnd > endDate) break;

        // Check if slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return current < bookingEnd && slotEnd > bookingStart;
        });

        if (!hasConflict) {
            slots.push({
                start: current.toISOString(),
                end: slotEnd.toISOString(),
            });
        }

        current.setMinutes(current.getMinutes() + duration);
    }

    return slots;
}

// Helper to broadcast booking events to webhooks
async function broadcastBookingEvent(
    eventType: string,
    data: Record<string, unknown>
): Promise<void> {
    try {
        const webhooks = await listWebhookConnections();
        const secret = getWebhookSecret();
        await broadcastWebhook(webhooks, eventType, data, secret);
    } catch (error) {
        // Log but don't fail the operation
        console.error("Failed to broadcast webhook:", error);
    }
}
