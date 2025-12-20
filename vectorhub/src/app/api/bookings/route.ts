import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { listBookings, createBooking } from "@/lib/bookings/store";

export async function GET() {
    try {
        const bookings = await listBookings();
        return NextResponse.json(bookings);
    } catch (error) {
        logger.error("GET /api/bookings failed", error as Error);
        return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        const newBooking = await createBooking({
            id: Math.random().toString(36).substring(7),
            ...data,
            status: "confirmed",
            createdAt: new Date().toISOString(),
        });

        // Return created booking
        return NextResponse.json(newBooking, { status: 201 });
    } catch (error) {
        logger.error("POST /api/bookings failed", error as Error);
        return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });
    }
}
