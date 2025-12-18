import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

// In-memory store for demonstration purposes
// In a real app, this would be in a database
let bookings = [
    { id: "1", eventTypeId: "intro", eventTypeName: "Intro Call", startTime: "2025-12-20T10:00:00Z", endTime: "2025-12-20T10:30:00Z", guestName: "Asif Ahmed", guestEmail: "asif@example.com", status: "confirmed", createdAt: new Date().toISOString() },
];

export async function GET() {
    try {
        return NextResponse.json(bookings);
    } catch (error) {
        logger.error("GET /api/bookings failed", error as Error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const newBooking = {
            id: Math.random().toString(36).substring(7),
            ...data,
            status: "confirmed",
            createdAt: new Date().toISOString(),
        };
        bookings.push(newBooking);

        // Return created booking
        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        logger.error("POST /api/bookings failed", error as Error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
