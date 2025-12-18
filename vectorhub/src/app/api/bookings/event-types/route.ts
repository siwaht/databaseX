import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

let eventTypes = [
    { id: "intro", name: "Intro Call", duration: 15, slug: "intro-call", isActive: true },
    { id: "demo", name: "Product Demo", duration: 45, slug: "demo", isActive: true },
];

export async function GET() {
    try {
        return NextResponse.json(eventTypes);
    } catch (error) {
        logger.error("GET /api/bookings/event-types failed", error as Error);
        return NextResponse.json({ error: "Failed to fetch event types" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const newEvent = {
            id: Math.random().toString(36).substring(7),
            ...data,
            isActive: true,
        };
        eventTypes.push(newEvent);
        return NextResponse.json(newEvent, { status: 201 });
    } catch (error) {
        logger.error("POST /api/bookings/event-types failed", error as Error);
        return NextResponse.json({ error: "Failed to create event type" }, { status: 500 });
    }
}
