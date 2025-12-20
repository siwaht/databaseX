import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { getBookingSettings, saveBookingSettings } from "@/lib/bookings/store";

export async function GET() {
    try {
        const settings = await getBookingSettings();
        return NextResponse.json(settings);
    } catch (error) {
        logger.error("GET /api/bookings/settings failed", error as Error);
        return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();
        const settings = await saveBookingSettings(data);
        return NextResponse.json(settings);
    } catch (error) {
        logger.error("POST /api/bookings/settings failed", error as Error);
        return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
    }
}
