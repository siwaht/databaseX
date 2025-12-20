import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { listEventTypes, createEventType, updateEventType } from "@/lib/bookings/store";

export async function GET() {
    try {
        const eventTypes = await listEventTypes();
        return NextResponse.json(eventTypes);
    } catch (error) {
        logger.error("GET /api/bookings/event-types failed", error as Error);
        return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        if (data.id) {
            // Update existing
            const updated = await updateEventType(data.id, data);
            return NextResponse.json(updated);
        } else {
            // Create new
            const newEventType = await createEventType({
                id: crypto.randomUUID(),
                ...data
            });
            return NextResponse.json(newEventType, { status: 201 });
        }
    } catch (error) {
        logger.error("POST /api/bookings/event-types failed", error as Error);
        return NextResponse.json({ error: "Failed to save event type" }, { status: 500 });
    }
}
