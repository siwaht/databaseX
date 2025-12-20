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
    {
        name: "update_booking",
        description: "Update an existing booking",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string" },
                status: { type: "string", enum: ["pending", "confirmed", "cancelled"] },
                startTime: { type: "string", description: "ISO start time" },
                guestNotes: { type: "string" },
            },
            required: ["id"],
        },
    },
    {
        name: "delete_booking",
        description: "Delete a booking permanently",
        inputSchema: {
            type: "object",
            properties: {
                id: { type: "string" },
            },
            required: ["id"],
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
        case "get_booking_availability": {
            // Not yet implemented in API, but tool exists.
            // For now we can return a mock or just throw if the API doesn't exist.
            // Assuming the user only asked for CRUD on bookings, availability is read-only logic usually.
            // I'll leave it as is or implement if I see the route.
            // checking previous file content... it wasn't implemented in the previous swtich either.
            // Wait, I missed get_booking_availability in the switch case in the original file?
            // Ah, looking at the original file content (Step 12), it wasn't in the switch case!
            // It seems I am only adding to the switch. I will leave get_booking_availability out for now as it wasn't there.
            return { error: "Not implemented yet" };
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
        case "update_booking": {
            const { id, ...updates } = args;
            const res = await fetch(`${baseUrl}/api/bookings/${id}`, {
                method: "PATCH",
                body: JSON.stringify(updates),
                headers: { "Content-Type": "application/json" },
            });
            return await res.json();
        }
        case "delete_booking": {
            const res = await fetch(`${baseUrl}/api/bookings/${args.id}`, {
                method: "DELETE",
            });
            return await res.json();
        }
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
