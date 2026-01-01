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
    getBookingSettings,
    saveBookingSettings,
} from "./store";
import {
    listLeads,
    createLead,
    updateLead,
    getLead,
    getLeadStats,
} from "@/lib/leads/store";
import { Booking, EventType, BookingStatus, Lead, CustomField, CustomFieldValue } from "@/types/booking";
import { broadcastWebhook } from "@/lib/webhooks/delivery";
import { listWebhookConnections, getWebhookSecret } from "@/lib/webhooks/store";

// MCP Tool definitions following the Model Context Protocol spec
export const bookingMcpTools = [
    // Date/Time context tool - CALL THIS FIRST to get current date for scheduling
    {
        name: "get_current_datetime",
        description: `IMPORTANT: Call this FIRST before creating any booking to get the current date and time.
        
        Returns the current date, time, timezone, and helpful info for scheduling like:
        - Current date and time in ISO format
        - Day of week
        - Upcoming weekdays with their dates (e.g., "Monday" -> "2025-01-06")
        
        Use this to correctly interpret user requests like "Monday at 3pm" or "next Friday".`,
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    // Smart routing tool - helps AI decide between booking and lead
    {
        name: "capture_contact",
        description: `Smart contact capture - automatically creates a BOOKING or LEAD based on the situation:
        
        USE BOOKING when: User wants to schedule a specific meeting/appointment with a date and time.
        USE LEAD when: User wants a callback, has questions, wants to be contacted later, or doesn't have a specific time.
        
        This tool analyzes the request and routes to the appropriate system.`,
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Contact's full name" },
                email: { type: "string", description: "Contact's email address" },
                phone: { type: "string", description: "Contact's phone number" },
                company: { type: "string", description: "Contact's company name" },
                requestType: {
                    type: "string",
                    enum: ["booking", "lead", "auto"],
                    description: "Type of request: 'booking' for scheduled appointments, 'lead' for callbacks/inquiries, 'auto' to decide automatically",
                    default: "auto"
                },
                // Booking-specific fields
                eventTypeId: { type: "string", description: "Event type ID (for bookings)" },
                startTime: { type: "string", description: "Appointment start time in ISO format (for bookings)" },
                // Lead-specific fields
                interestedIn: { type: "string", description: "What they're interested in" },
                preferredContactMethod: {
                    type: "string",
                    enum: ["email", "phone", "callback"],
                    description: "How they prefer to be contacted"
                },
                preferredCallbackTime: { type: "string", description: "When they want to be called back (e.g., 'Tomorrow afternoon', 'Monday 2-4 PM')" },
                // Common fields
                notes: { type: "string", description: "Additional notes, questions, or context" },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "Priority level"
                },
            },
            required: ["name", "email"],
        },
    },
    // Booking Tools - for scheduled appointments with specific times
    {
        name: "booking_list",
        description: "List all scheduled bookings/appointments. Bookings have specific date and time slots.",
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
        description: `Create a scheduled booking/appointment with a SPECIFIC DATE AND TIME.
        
        IMPORTANT: 
        1. Call get_current_datetime FIRST to get the correct date for relative terms like "Monday" or "next week".
        2. Call booking_find FIRST to check if guest already has a booking - use booking_update instead if updating.
        
        Use this when someone wants to book a NEW meeting at a particular time slot.
        Requires: startTime, guestName, guestEmail, and EITHER eventTypeId OR eventTypeName.
        
        If "Open Events" is enabled in settings, you can use eventTypeName with any custom name.
        Otherwise, you must use eventTypeId from event_types_list.
        
        startTime MUST be a valid ISO 8601 datetime string (e.g., "2025-01-06T15:00:00").
        - For "3pm" use "15:00:00" (24-hour format)
        - For "3am" use "03:00:00"
        - NEVER use 12-hour format like "3:00 PM"`,
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string", description: "The event type ID (get from event_types_list). Required unless Open Events is enabled." },
                eventTypeName: { type: "string", description: "Custom event type name (only works if Open Events is enabled in settings)" },
                duration: { type: "number", description: "Duration in minutes (default: 30, only used with eventTypeName)" },
                startTime: { type: "string", description: "Start time in ISO format, e.g., '2025-01-06T15:00:00' for 3pm (REQUIRED)" },
                endTime: { type: "string", description: "End time in ISO format (optional, auto-calculated from event duration)" },
                guestName: { type: "string", description: "Guest's full name" },
                guestEmail: { type: "string", description: "Guest's email address" },
                guestPhone: { type: "string", description: "Guest's phone number" },
                phone: { type: "string", description: "Guest's phone number (alias for guestPhone)" },
                notes: { type: "string", description: "Notes about the booking" },
                agenda: { type: "string", description: "Meeting agenda or topics to discuss" },
                customFields: { 
                    type: "object",
                    description: "Custom field values as key-value pairs (e.g., {\"budget\": \"10000\", \"company_size\": \"50-100\"})",
                    additionalProperties: true
                },
            },
            required: ["startTime", "guestName", "guestEmail"],
        },
    },
    {
        name: "booking_find",
        description: `Find existing bookings by guest email, name, or phone. 
        
        IMPORTANT: Call this BEFORE creating a booking to check if the guest already has one.
        If found, use booking_update instead of booking_create to avoid duplicates.`,
        inputSchema: {
            type: "object",
            properties: {
                email: { type: "string", description: "Guest's email to search for" },
                name: { type: "string", description: "Guest's name to search for (partial match)" },
                phone: { type: "string", description: "Guest's phone to search for" },
                includeCompleted: { type: "boolean", description: "Include completed/cancelled bookings", default: false },
            },
        },
    },
    {
        name: "booking_upsert",
        description: `Smart booking create or update - automatically finds existing booking and updates it, or creates new one.
        
        Use this instead of booking_create when you want to avoid duplicates.
        If guest (by email) already has an active booking, it updates that booking.
        Otherwise, creates a new booking.
        
        IMPORTANT: Call get_current_datetime FIRST to get correct dates.
        
        Provide EITHER eventTypeId OR eventTypeName (if Open Events is enabled).
        
        startTime format: ISO 8601 (e.g., "2025-01-06T15:00:00" for 3pm)`,
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string", description: "The event type ID (required unless Open Events is enabled)" },
                eventTypeName: { type: "string", description: "Custom event type name (only works if Open Events is enabled)" },
                duration: { type: "number", description: "Duration in minutes (default: 30, only used with eventTypeName)" },
                startTime: { type: "string", description: "Start time in ISO format, e.g., '2025-01-06T15:00:00'" },
                guestName: { type: "string", description: "Guest's full name" },
                guestEmail: { type: "string", description: "Guest's email address" },
                guestPhone: { type: "string", description: "Guest's phone number" },
                phone: { type: "string", description: "Guest's phone number (alias for guestPhone)" },
                notes: { type: "string", description: "Notes about the booking" },
                agenda: { type: "string", description: "Meeting agenda" },
            },
            required: ["startTime", "guestName", "guestEmail"],
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
                notes: { type: "string", description: "Updated notes" },
                agenda: { type: "string" },
                meetingUrl: { type: "string", description: "Video meeting URL" },
            },
            required: ["id"],
        },
    },
    {
        name: "booking_cancel",
        description: "Cancel a scheduled booking",
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
    // Event Type Tools
    {
        name: "event_types_list",
        description: "List all available event/meeting types. Use this to get eventTypeId for creating bookings.",
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
        description: "Create a new event/meeting type",
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Event type name (e.g., 'Consultation', '30-min Call')" },
                description: { type: "string", description: "Description of the event type" },
                duration: { type: "number", description: "Duration in minutes" },
                color: { type: "string", description: "Color hex code for UI" },
            },
            required: ["name", "duration"],
        },
    },
    {
        name: "availability_check",
        description: "Check available time slots for booking on a specific date. Use before creating a booking to find open slots.",
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string", description: "Event type ID" },
                date: { type: "string", description: "Date to check (YYYY-MM-DD format)" },
            },
            required: ["eventTypeId", "date"],
        },
    },
    // Lead Capture Tools - for callbacks and inquiries WITHOUT specific times
    {
        name: "lead_create",
        description: `Capture a lead for callback requests or inquiries WITHOUT a specific appointment time. 
        
        Use this when someone:
        - Wants a callback but doesn't have a specific time
        - Has questions and wants to be contacted
        - Is interested but not ready to book
        - Prefers to be reached out to later
        
        NO startTime or eventTypeId required - just contact info and preferences.`,
        inputSchema: {
            type: "object",
            properties: {
                name: { type: "string", description: "Lead's full name" },
                email: { type: "string", description: "Lead's email address" },
                phone: { type: "string", description: "Lead's phone number (important for callbacks)" },
                company: { type: "string", description: "Lead's company name" },
                source: { 
                    type: "string", 
                    enum: ["website", "chatbot", "referral", "social", "other"],
                    description: "Where the lead came from",
                    default: "chatbot"
                },
                priority: {
                    type: "string",
                    enum: ["low", "medium", "high", "urgent"],
                    description: "How urgent is this lead",
                    default: "medium"
                },
                notes: { type: "string", description: "Their questions, requirements, or any context" },
                interestedIn: { type: "string", description: "What product/service they're interested in" },
                preferredContactMethod: {
                    type: "string",
                    enum: ["email", "phone", "callback"],
                    description: "How they want to be contacted",
                    default: "callback"
                },
                preferredCallbackTime: { type: "string", description: "When to call back (e.g., 'Tomorrow afternoon', 'Weekdays 9-5')" },
                tags: { 
                    type: "array", 
                    items: { type: "string" },
                    description: "Tags to categorize (e.g., ['enterprise', 'demo-request'])"
                },
                customFields: { 
                    type: "object",
                    description: "Custom field values as key-value pairs (e.g., {\"budget\": \"10000\", \"industry\": \"healthcare\"})",
                    additionalProperties: true
                },
            },
            required: ["name", "email"],
        },
    },
    {
        name: "lead_list",
        description: "List all captured leads (callback requests, inquiries)",
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
        description: "Update a lead's information or status (e.g., mark as contacted, qualified, converted)",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string", description: "The lead ID to update" },
                status: {
                    type: "string",
                    enum: ["new", "contacted", "qualified", "converted", "lost"],
                    description: "New status"
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
        description: "Get lead statistics (counts by status, source, priority)",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    // Custom Fields Management
    {
        name: "custom_fields_get",
        description: "Get the custom fields configured for leads or a specific event type",
        inputSchema: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    enum: ["lead", "event"],
                    description: "Get custom fields for leads or events"
                },
                eventTypeId: {
                    type: "string",
                    description: "Event type ID (required if type is 'event')"
                },
            },
            required: ["type"],
        },
    },
    {
        name: "custom_fields_set",
        description: "Configure custom fields to capture for leads or a specific event type",
        inputSchema: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    enum: ["lead", "event"],
                    description: "Set custom fields for leads or events"
                },
                eventTypeId: {
                    type: "string",
                    description: "Event type ID (required if type is 'event')"
                },
                fields: {
                    type: "array",
                    description: "Array of custom field definitions",
                    items: {
                        type: "object",
                        properties: {
                            name: { type: "string", description: "Field name (used as key)" },
                            label: { type: "string", description: "Display label" },
                            type: { 
                                type: "string", 
                                enum: ["text", "textarea", "number", "email", "phone", "select", "multiselect", "checkbox", "date"],
                                description: "Field type"
                            },
                            required: { type: "boolean", description: "Is this field required?" },
                            placeholder: { type: "string", description: "Placeholder text" },
                            options: { 
                                type: "array", 
                                items: { type: "string" },
                                description: "Options for select/multiselect fields"
                            },
                        },
                        required: ["name", "label", "type"],
                    },
                },
            },
            required: ["type", "fields"],
        },
    },
    {
        name: "get_capture_requirements",
        description: `Get the required and optional fields that should be captured when creating a lead or booking. 
        
        IMPORTANT: Call this BEFORE creating a lead or booking to know what information to collect from the user.
        Returns both standard fields and any custom fields that have been configured.`,
        inputSchema: {
            type: "object",
            properties: {
                type: {
                    type: "string",
                    enum: ["lead", "booking"],
                    description: "What type of capture - lead (callback/inquiry) or booking (scheduled appointment)"
                },
                eventTypeId: {
                    type: "string",
                    description: "Event type ID (optional, for booking-specific custom fields)"
                },
            },
            required: ["type"],
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
            // Date/Time context tool
            case "get_current_datetime": {
                const now = new Date();
                const settings = await getBookingSettings();
                
                // Get upcoming weekdays with their dates
                const upcomingDays: Record<string, string> = {};
                const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                
                for (let i = 0; i < 14; i++) {
                    const futureDate = new Date(now);
                    futureDate.setDate(now.getDate() + i);
                    const dayName = dayNames[futureDate.getDay()];
                    const dateStr = futureDate.toISOString().split('T')[0];
                    
                    // Only add if not already present (first occurrence)
                    if (!upcomingDays[dayName]) {
                        upcomingDays[dayName] = dateStr;
                    }
                    // Also add "next Monday", "next Tuesday" etc for the second week
                    if (i >= 7 && !upcomingDays[`next ${dayName}`]) {
                        upcomingDays[`next ${dayName}`] = dateStr;
                    }
                }
                
                // Add common relative terms
                const tomorrow = new Date(now);
                tomorrow.setDate(now.getDate() + 1);
                upcomingDays["tomorrow"] = tomorrow.toISOString().split('T')[0];
                upcomingDays["today"] = now.toISOString().split('T')[0];
                
                return {
                    success: true,
                    data: {
                        currentDateTime: now.toISOString(),
                        currentDate: now.toISOString().split('T')[0],
                        currentTime: now.toTimeString().split(' ')[0],
                        dayOfWeek: dayNames[now.getDay()],
                        timezone: settings.timezone,
                        upcomingDays,
                        tip: "Use upcomingDays to convert 'Monday' or 'next Friday' to actual dates. Combine date with time like: '2025-01-06T15:00:00' for 3pm on Jan 6th.",
                    }
                };
            }

            // Smart routing tool
            case "capture_contact": {
                const requestType = args.requestType as string || "auto";
                const hasScheduledTime = !!(args.startTime && args.eventTypeId);
                
                // Determine if this should be a booking or lead
                let shouldBeBooking = false;
                if (requestType === "booking") {
                    shouldBeBooking = true;
                } else if (requestType === "lead") {
                    shouldBeBooking = false;
                } else {
                    // Auto-detect: if they have a specific time and event type, it's a booking
                    shouldBeBooking = hasScheduledTime;
                }

                if (shouldBeBooking) {
                    // Validate booking requirements
                    if (!args.eventTypeId || !args.startTime) {
                        return {
                            success: false,
                            error: "Booking requires eventTypeId and startTime. Use lead_create for callback requests without specific times.",
                        };
                    }

                    // Create booking
                    const bookingResult = await handleBookingToolCall("booking_create", {
                        eventTypeId: args.eventTypeId,
                        startTime: args.startTime,
                        guestName: args.name,
                        guestEmail: args.email,
                        guestPhone: args.phone,
                        notes: args.notes,
                    });

                    return {
                        ...bookingResult,
                        data: {
                            type: "booking",
                            ...(bookingResult.data as object),
                            message: "Scheduled appointment created successfully.",
                        },
                    };
                } else {
                    // Create lead
                    const leadResult = await handleBookingToolCall("lead_create", {
                        name: args.name,
                        email: args.email,
                        phone: args.phone,
                        company: args.company,
                        notes: args.notes,
                        interestedIn: args.interestedIn,
                        preferredContactMethod: args.preferredContactMethod || "callback",
                        preferredCallbackTime: args.preferredCallbackTime,
                        priority: args.priority,
                        source: "chatbot",
                    });

                    return {
                        ...leadResult,
                        data: {
                            type: "lead",
                            ...(leadResult.data as object),
                            message: "Lead captured for follow-up. No specific appointment time - will be contacted based on preferences.",
                        },
                    };
                }
            }

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
                const settings = await getBookingSettings();
                const eventTypes = await listEventTypes();
                
                let eventTypeId: string;
                let eventTypeName: string;
                let eventDuration: number;

                // Check if using eventTypeId or eventTypeName (open events)
                if (args.eventTypeId) {
                    const eventType = eventTypes.find((e) => e.id === args.eventTypeId);

                    if (!eventType) {
                        // Check if open events is enabled
                        if (settings.allowOpenEvents && args.eventTypeName) {
                            // Allow custom event type name
                            eventTypeId = "open-event";
                            eventTypeName = args.eventTypeName as string;
                            eventDuration = (args.duration as number) || 30;
                        } else {
                            // List available event types for helpful error message
                            const activeEventTypes = eventTypes.filter(e => e.isActive);
                            const availableTypes = activeEventTypes.map(e => `- ${e.name} (ID: ${e.id})`).join('\n');
                            return { 
                                success: false, 
                                error: `Event type not found: ${args.eventTypeId}. Available event types:\n${availableTypes || 'No event types configured. Please create one first.'}` 
                            };
                        }
                    } else {
                        // Check if event type is active
                        if (!eventType.isActive) {
                            return { 
                                success: false, 
                                error: `Event type "${eventType.name}" is not active. Please choose an active event type.` 
                            };
                        }
                        eventTypeId = eventType.id;
                        eventTypeName = eventType.name;
                        eventDuration = eventType.duration;
                    }
                } else if (args.eventTypeName && settings.allowOpenEvents) {
                    // Open events mode - use custom event type name
                    eventTypeId = "open-event";
                    eventTypeName = args.eventTypeName as string;
                    eventDuration = (args.duration as number) || 30;
                } else if (args.eventTypeName && !settings.allowOpenEvents) {
                    return { 
                        success: false, 
                        error: `Open Events is not enabled. Please use eventTypeId from event_types_list, or enable "Open Events" in settings to use custom event type names.` 
                    };
                } else {
                    // No event type specified
                    const activeEventTypes = eventTypes.filter(e => e.isActive);
                    const availableTypes = activeEventTypes.map(e => `- ${e.name} (ID: ${e.id})`).join('\n');
                    return { 
                        success: false, 
                        error: `Event type is required. Provide eventTypeId from event_types_list${settings.allowOpenEvents ? ', or use eventTypeName for custom events' : ''}.\n\nAvailable event types:\n${availableTypes || 'No event types configured.'}` 
                    };
                }

                // Validate booking time against working hours (skip if 24/7 mode is enabled)
                const startTime = new Date(args.startTime as string);
                
                // Skip working hours validation if 24/7 mode is enabled
                if (!settings.is24x7) {
                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const dayOfWeek = dayNames[startTime.getDay()];
                    const dayAvailability = settings.availability?.[dayOfWeek];

                    if (!dayAvailability) {
                        const availableDays = Object.entries(settings.availability || {})
                            .filter(([, v]) => v !== null)
                            .map(([day, hours]) => `${day}: ${(hours as {start: string; end: string}).start} - ${(hours as {start: string; end: string}).end}`)
                            .join(', ');
                        return { 
                            success: false, 
                            error: `Bookings are not available on ${dayOfWeek}. Available days: ${availableDays || 'No working hours configured.'}` 
                        };
                    }

                    // Check if time is within working hours
                    const bookingHour = startTime.getHours();
                    const bookingMinute = startTime.getMinutes();
                    const bookingTimeMinutes = bookingHour * 60 + bookingMinute;
                    
                    const [startHour, startMin] = dayAvailability.start.split(':').map(Number);
                    const [endHour, endMin] = dayAvailability.end.split(':').map(Number);
                    const workStartMinutes = startHour * 60 + startMin;
                    const workEndMinutes = endHour * 60 + endMin;

                    // Calculate end time to check if booking fits within working hours
                    const endTimeDate = new Date(startTime);
                    endTimeDate.setMinutes(endTimeDate.getMinutes() + eventDuration);
                    const endTimeMinutes = endTimeDate.getHours() * 60 + endTimeDate.getMinutes();

                    if (bookingTimeMinutes < workStartMinutes || endTimeMinutes > workEndMinutes) {
                        return { 
                            success: false, 
                            error: `Booking time is outside working hours. ${dayOfWeek} hours: ${dayAvailability.start} - ${dayAvailability.end}. Your booking: ${startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})} - ${endTimeDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}` 
                        };
                    }
                }

                // Calculate end time if not provided
                let endTime = args.endTime as string;
                if (!endTime && args.startTime) {
                    const start = new Date(args.startTime as string);
                    start.setMinutes(start.getMinutes() + eventDuration);
                    endTime = start.toISOString();
                }

                // Accept both 'notes' and 'guestNotes' for flexibility
                const bookingNotes = (args.notes as string) || (args.guestNotes as string) || undefined;
                
                // Accept both 'phone' and 'guestPhone' for flexibility
                const guestPhone = (args.guestPhone as string) || (args.phone as string) || undefined;

                // Process custom fields
                let customFieldValues: CustomFieldValue[] | undefined;
                if (args.customFields && typeof args.customFields === 'object') {
                    customFieldValues = Object.entries(args.customFields as Record<string, unknown>).map(([key, value]) => ({
                        fieldId: key,
                        fieldName: key,
                        value: value as string | string[] | boolean | number,
                    }));
                }

                const newBooking: Booking = {
                    id: crypto.randomUUID(),
                    eventTypeId: eventTypeId,
                    eventTypeName: eventTypeName,
                    startTime: args.startTime as string,
                    endTime: endTime,
                    guestName: args.guestName as string,
                    guestEmail: args.guestEmail as string,
                    guestPhone: guestPhone,
                    guestNotes: bookingNotes,
                    agenda: args.agenda as string | undefined,
                    status: "confirmed",
                    createdAt: new Date().toISOString(),
                    customFields: customFieldValues,
                };

                const created = await createBooking(newBooking);

                // Broadcast webhook event
                await broadcastBookingEvent("booking.created", created as unknown as Record<string, unknown>);

                return { success: true, data: created };
            }

            case "booking_find": {
                let bookings = await listBookings();
                
                // Filter by status (exclude completed/cancelled by default)
                if (!args.includeCompleted) {
                    bookings = bookings.filter(b => b.status !== "completed" && b.status !== "cancelled");
                }
                
                // Search by email (exact match, case-insensitive)
                if (args.email) {
                    const email = (args.email as string).toLowerCase();
                    bookings = bookings.filter(b => b.guestEmail?.toLowerCase() === email);
                }
                
                // Search by name (partial match, case-insensitive)
                if (args.name) {
                    const name = (args.name as string).toLowerCase();
                    bookings = bookings.filter(b => b.guestName?.toLowerCase().includes(name));
                }
                
                // Search by phone (partial match)
                if (args.phone) {
                    const phone = (args.phone as string).replace(/\D/g, '');
                    bookings = bookings.filter(b => b.guestPhone?.replace(/\D/g, '').includes(phone));
                }
                
                return { 
                    success: true, 
                    data: {
                        found: bookings.length > 0,
                        count: bookings.length,
                        bookings,
                        tip: bookings.length > 0 
                            ? "Guest has existing booking(s). Use booking_update with the booking ID to modify instead of creating a duplicate."
                            : "No existing bookings found. Safe to create a new booking."
                    }
                };
            }

            case "booking_upsert": {
                // First, check if guest already has an active booking
                const existingBookings = await listBookings();
                const guestEmail = (args.guestEmail as string).toLowerCase();
                const existingBooking = existingBookings.find(
                    b => b.guestEmail?.toLowerCase() === guestEmail && 
                         b.status !== "completed" && 
                         b.status !== "cancelled"
                );
                
                const settings = await getBookingSettings();
                const eventTypes = await listEventTypes();
                
                let eventTypeId: string;
                let eventTypeName: string;
                let eventDuration: number;

                // Check if using eventTypeId or eventTypeName (open events)
                if (args.eventTypeId) {
                    const eventType = eventTypes.find((e) => e.id === args.eventTypeId);
                    
                    if (!eventType) {
                        if (settings.allowOpenEvents && args.eventTypeName) {
                            eventTypeId = "open-event";
                            eventTypeName = args.eventTypeName as string;
                            eventDuration = (args.duration as number) || 30;
                        } else {
                            const activeEventTypes = eventTypes.filter(e => e.isActive);
                            const availableTypes = activeEventTypes.map(e => `- ${e.name} (ID: ${e.id})`).join('\n');
                            return { 
                                success: false, 
                                error: `Event type not found: ${args.eventTypeId}. Available event types:\n${availableTypes || 'No event types configured.'}` 
                            };
                        }
                    } else {
                        if (!eventType.isActive) {
                            return { 
                                success: false, 
                                error: `Event type "${eventType.name}" is not active. Please choose an active event type.` 
                            };
                        }
                        eventTypeId = eventType.id;
                        eventTypeName = eventType.name;
                        eventDuration = eventType.duration;
                    }
                } else if (args.eventTypeName && settings.allowOpenEvents) {
                    eventTypeId = "open-event";
                    eventTypeName = args.eventTypeName as string;
                    eventDuration = (args.duration as number) || 30;
                } else if (args.eventTypeName && !settings.allowOpenEvents) {
                    return { 
                        success: false, 
                        error: `Open Events is not enabled. Please use eventTypeId, or enable "Open Events" in settings.` 
                    };
                } else {
                    const activeEventTypes = eventTypes.filter(e => e.isActive);
                    const availableTypes = activeEventTypes.map(e => `- ${e.name} (ID: ${e.id})`).join('\n');
                    return { 
                        success: false, 
                        error: `Event type is required. Provide eventTypeId${settings.allowOpenEvents ? ' or eventTypeName' : ''}.\n\nAvailable:\n${availableTypes || 'None'}` 
                    };
                }

                // Validate booking time against working hours (skip if 24/7 mode is enabled)
                const startTime = new Date(args.startTime as string);
                
                // Skip working hours validation if 24/7 mode is enabled
                if (!settings.is24x7) {
                    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                    const dayOfWeek = dayNames[startTime.getDay()];
                    const dayAvailability = settings.availability?.[dayOfWeek];

                    if (!dayAvailability) {
                        const availableDays = Object.entries(settings.availability || {})
                            .filter(([, v]) => v !== null)
                            .map(([day, hours]) => `${day}: ${(hours as {start: string; end: string}).start} - ${(hours as {start: string; end: string}).end}`)
                            .join(', ');
                        return { 
                            success: false, 
                            error: `Bookings are not available on ${dayOfWeek}. Available days: ${availableDays || 'No working hours configured.'}` 
                        };
                    }

                    // Check if time is within working hours
                    const bookingHour = startTime.getHours();
                    const bookingMinute = startTime.getMinutes();
                    const bookingTimeMinutes = bookingHour * 60 + bookingMinute;
                    
                    const [startHour, startMin] = dayAvailability.start.split(':').map(Number);
                    const [endHour, endMin] = dayAvailability.end.split(':').map(Number);
                    const workStartMinutes = startHour * 60 + startMin;
                    const workEndMinutes = endHour * 60 + endMin;

                    // Calculate end time to check if booking fits within working hours
                    const endTimeDate = new Date(startTime);
                    endTimeDate.setMinutes(endTimeDate.getMinutes() + eventDuration);
                    const endTimeMinutes = endTimeDate.getHours() * 60 + endTimeDate.getMinutes();

                    if (bookingTimeMinutes < workStartMinutes || endTimeMinutes > workEndMinutes) {
                        return { 
                            success: false, 
                            error: `Booking time is outside working hours. ${dayOfWeek} hours: ${dayAvailability.start} - ${dayAvailability.end}. Your booking: ${startTime.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})} - ${endTimeDate.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', hour12: false})}` 
                        };
                    }
                }
                
                // Calculate end time
                let endTime = args.endTime as string;
                if (!endTime && args.startTime) {
                    const start = new Date(args.startTime as string);
                    start.setMinutes(start.getMinutes() + eventDuration);
                    endTime = start.toISOString();
                }
                
                if (existingBooking) {
                    // Update existing booking
                    const updates: Partial<Booking> = {
                        startTime: args.startTime as string,
                        endTime: endTime,
                        eventTypeId: eventTypeId,
                        eventTypeName: eventTypeName,
                    };
                    
                    if (args.guestName) updates.guestName = args.guestName as string;
                    // Accept both phone and guestPhone
                    const phoneValue = (args.guestPhone as string) || (args.phone as string);
                    if (phoneValue) updates.guestPhone = phoneValue;
                    if (args.notes) updates.guestNotes = args.notes as string;
                    if (args.agenda) updates.agenda = args.agenda as string;
                    
                    const updated = await updateBooking(existingBooking.id, updates);
                    await broadcastBookingEvent("booking.updated", updated as unknown as Record<string, unknown>);
                    
                    return { 
                        success: true, 
                        data: {
                            ...updated,
                            action: "updated",
                            message: `Updated existing booking for ${guestEmail}`
                        }
                    };
                } else {
                    // Create new booking
                    // Accept both phone and guestPhone
                    const phoneValue = (args.guestPhone as string) || (args.phone as string);
                    
                    const newBooking: Booking = {
                        id: crypto.randomUUID(),
                        eventTypeId: eventTypeId,
                        eventTypeName: eventTypeName,
                        startTime: args.startTime as string,
                        endTime: endTime,
                        guestName: args.guestName as string,
                        guestEmail: args.guestEmail as string,
                        guestPhone: phoneValue,
                        guestNotes: args.notes as string | undefined,
                        agenda: args.agenda as string | undefined,
                        status: "confirmed",
                        createdAt: new Date().toISOString(),
                    };
                    
                    const created = await createBooking(newBooking);
                    await broadcastBookingEvent("booking.created", created as unknown as Record<string, unknown>);
                    
                    return { 
                        success: true, 
                        data: {
                            ...created,
                            action: "created",
                            message: `Created new booking for ${guestEmail}`
                        }
                    };
                }
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
                // Process custom fields
                let customFieldValues: CustomFieldValue[] | undefined;
                if (args.customFields && typeof args.customFields === 'object') {
                    customFieldValues = Object.entries(args.customFields as Record<string, unknown>).map(([key, value]) => ({
                        fieldId: key,
                        fieldName: key,
                        value: value as string | string[] | boolean | number,
                    }));
                }

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
                    customFields: customFieldValues,
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

            // Custom Fields Management
            case "custom_fields_get": {
                const fieldType = args.type as string;
                
                if (fieldType === "lead") {
                    const settings = await getBookingSettings();
                    return { 
                        success: true, 
                        data: {
                            type: "lead",
                            fields: settings.leadCustomFields || [],
                        }
                    };
                } else if (fieldType === "event") {
                    if (!args.eventTypeId) {
                        return { success: false, error: "eventTypeId is required for event custom fields" };
                    }
                    const eventTypes = await listEventTypes();
                    const eventType = eventTypes.find(e => e.id === args.eventTypeId);
                    if (!eventType) {
                        return { success: false, error: `Event type not found: ${args.eventTypeId}` };
                    }
                    return {
                        success: true,
                        data: {
                            type: "event",
                            eventTypeId: eventType.id,
                            eventTypeName: eventType.name,
                            fields: eventType.customFields || [],
                        }
                    };
                }
                return { success: false, error: "Invalid type. Use 'lead' or 'event'" };
            }

            case "custom_fields_set": {
                const fieldType = args.type as string;
                const fields = (args.fields as CustomField[]) || [];
                
                // Validate and normalize fields
                const normalizedFields: CustomField[] = fields.map((f, i) => ({
                    id: f.id || `field_${i}_${Date.now()}`,
                    name: f.name,
                    label: f.label,
                    type: f.type,
                    required: f.required || false,
                    placeholder: f.placeholder,
                    options: f.options,
                    defaultValue: f.defaultValue,
                }));

                if (fieldType === "lead") {
                    const settings = await getBookingSettings();
                    const updatedSettings = {
                        ...settings,
                        leadCustomFields: normalizedFields,
                    };
                    // Save settings (you'll need to implement saveBookingSettings)
                    await saveBookingSettings(updatedSettings);
                    return {
                        success: true,
                        data: {
                            type: "lead",
                            fields: normalizedFields,
                            message: `${normalizedFields.length} custom fields configured for leads`,
                        }
                    };
                } else if (fieldType === "event") {
                    if (!args.eventTypeId) {
                        return { success: false, error: "eventTypeId is required for event custom fields" };
                    }
                    const updated = await updateEventType(args.eventTypeId as string, {
                        customFields: normalizedFields,
                    });
                    if (!updated) {
                        return { success: false, error: `Event type not found: ${args.eventTypeId}` };
                    }
                    return {
                        success: true,
                        data: {
                            type: "event",
                            eventTypeId: updated.id,
                            eventTypeName: updated.name,
                            fields: normalizedFields,
                            message: `${normalizedFields.length} custom fields configured for ${updated.name}`,
                        }
                    };
                }
                return { success: false, error: "Invalid type. Use 'lead' or 'event'" };
            }

            case "get_capture_requirements": {
                const captureType = args.type as string;
                const settings = await getBookingSettings();
                
                if (captureType === "lead") {
                    // Standard lead fields
                    const standardFields = [
                        { name: "name", label: "Full Name", type: "text", required: true },
                        { name: "email", label: "Email Address", type: "email", required: true },
                        { name: "phone", label: "Phone Number", type: "phone", required: false },
                        { name: "company", label: "Company", type: "text", required: false },
                        { name: "interestedIn", label: "Interested In", type: "text", required: false },
                        { name: "preferredContactMethod", label: "Preferred Contact Method", type: "select", required: false, options: ["email", "phone", "callback"] },
                        { name: "preferredCallbackTime", label: "Preferred Callback Time", type: "text", required: false },
                        { name: "notes", label: "Notes/Questions", type: "textarea", required: false },
                    ];
                    
                    // Get configured custom fields for leads
                    const customFields = settings.leadCustomFields || [];
                    
                    return {
                        success: true,
                        data: {
                            type: "lead",
                            description: "Lead capture for callbacks and inquiries (no specific appointment time)",
                            standardFields,
                            customFields,
                            requiredFields: standardFields.filter(f => f.required).map(f => f.name),
                            allFields: [...standardFields, ...customFields],
                        }
                    };
                } else if (captureType === "booking") {
                    // Standard booking fields
                    const standardFields = [
                        { name: "eventTypeId", label: "Event Type", type: "select", required: true, description: "Get from event_types_list" },
                        { name: "startTime", label: "Start Time", type: "date", required: true, description: "ISO format datetime" },
                        { name: "guestName", label: "Guest Name", type: "text", required: true },
                        { name: "guestEmail", label: "Guest Email", type: "email", required: true },
                        { name: "guestPhone", label: "Guest Phone", type: "phone", required: false },
                        { name: "notes", label: "Notes", type: "textarea", required: false },
                        { name: "agenda", label: "Meeting Agenda", type: "textarea", required: false },
                    ];
                    
                    // If eventTypeId provided, get custom fields for that event type
                    let customFields: CustomField[] = [];
                    let eventTypeName = "";
                    
                    if (args.eventTypeId) {
                        const eventTypes = await listEventTypes();
                        const eventType = eventTypes.find(e => e.id === args.eventTypeId);
                        if (eventType) {
                            customFields = eventType.customFields || [];
                            eventTypeName = eventType.name;
                        }
                    }
                    
                    return {
                        success: true,
                        data: {
                            type: "booking",
                            description: "Scheduled appointment with specific date and time",
                            eventTypeId: args.eventTypeId || null,
                            eventTypeName: eventTypeName || null,
                            standardFields,
                            customFields,
                            requiredFields: standardFields.filter(f => f.required).map(f => f.name),
                            allFields: [...standardFields, ...customFields],
                            tip: "Use event_types_list to get available event types, then availability_check to find open slots",
                        }
                    };
                }
                
                return { success: false, error: "Invalid type. Use 'lead' or 'booking'" };
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

// Import shared utility for time slot generation
import { generateTimeSlots as generateTimeSlotsUtil } from "./utils";

// Helper to generate available time slots (wrapper around shared utility)
function generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    existingBookings: Booking[],
    date: Date
): { start: string; end: string }[] {
    const slots = generateTimeSlotsUtil(startTime, endTime, duration, existingBookings, date, false);
    // Filter to only available slots (no conflicts)
    return slots.filter((_, idx) => {
        const slot = slots[idx];
        const slotStart = new Date(slot.start);
        const slotEnd = new Date(slot.end);
        return !existingBookings.some((booking) => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return slotStart < bookingEnd && slotEnd > bookingStart;
        });
    });
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
