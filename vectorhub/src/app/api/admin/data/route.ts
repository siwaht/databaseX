import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import {
    listBookings, restoreBookings,
    listEventTypes, restoreEventTypes,
    getBookingSettings, restoreSettings
} from "@/lib/bookings/store";
import { listIntegrations, restoreIntegrations } from "@/lib/integrations/store";

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const [bookings, eventTypes, settings, integrations] = await Promise.all([
            listBookings(),
            listEventTypes(),
            getBookingSettings(),
            listIntegrations()
        ]);

        const exportData = {
            version: 1,
            timestamp: new Date().toISOString(),
            data: {
                bookings,
                eventTypes,
                settings,
                integrations
            }
        };

        const response = new NextResponse(JSON.stringify(exportData, null, 2));
        response.headers.set('Content-Type', 'application/json');
        response.headers.set('Content-Disposition', `attachment; filename="vectorhub-bookings-${new Date().toISOString().split('T')[0]}.json"`);

        return response;
    } catch (error) {
        logger.error("Export failed", error as Error);
        return NextResponse.json({ error: "Export failed" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const payload = await request.json();

        if (!payload.data || !payload.version) {
            return NextResponse.json({ error: "Invalid import file format" }, { status: 400 });
        }

        const { bookings, eventTypes, settings, integrations } = payload.data;

        // Restore all data
        await Promise.all([
            bookings && restoreBookings(bookings),
            eventTypes && restoreEventTypes(eventTypes),
            settings && restoreSettings(settings),
            integrations && restoreIntegrations(integrations)
        ]);

        return NextResponse.json({ message: "Import successful" });
    } catch (error) {
        logger.error("Import failed", error as Error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
