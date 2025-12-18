/**
 * MCP Tools for Booking Management
 * This file defines the tools that allow an LLM to interact with the booking system.
 */

export const bookingTools = [
    {
        name: "list_event_types",
        description: "List all available meeting types (e.g., Intro Call, Product Demo)",
        inputSchema: {
            type: "object",
            properties: {},
        },
    },
    {
        name: "get_booking_availability",
        description: "Get available time slots for a specific date and event type",
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string" },
                date: { type: "string", description: "ISO date string (YYYY-MM-DD)" },
            },
            required: ["eventTypeId", "date"],
        },
    },
    {
        name: "create_booking",
        description: "Create a new booking for a user",
        inputSchema: {
            type: "object",
            properties: {
                eventTypeId: { type: "string" },
                startTime: { type: "string", description: "ISO start time" },
                guestName: { type: "string" },
                guestEmail: { type: "string" },
                guestNotes: { type: "string" },
            },
            required: ["eventTypeId", "startTime", "guestName", "guestEmail"],
        },
    },
    {
        name: "list_bookings",
        description: "List existing bookings",
        inputSchema: {
            type: "object",
            properties: {
                status: { type: "string", enum: ["pending", "confirmed", "cancelled"] },
            },
        },
    },
];

/**
 * Simplified responder for MCP tool calls
 */
export async function handleBookingToolCall(name: string, args: any) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    switch (name) {
        case "list_event_types": {
            const res = await fetch(`${baseUrl}/api/bookings/event-types`);
            return await res.json();
        }
        case "create_booking": {
            const res = await fetch(`${baseUrl}/api/bookings`, {
                method: "POST",
                body: JSON.stringify(args),
                headers: { "Content-Type": "application/json" },
            });
            return await res.json();
        }
        case "list_bookings": {
            const res = await fetch(`${baseUrl}/api/bookings`);
            const bookings = await res.json();
            if (args.status) {
                return bookings.filter((b: any) => b.status === args.status);
            }
            return bookings;
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
