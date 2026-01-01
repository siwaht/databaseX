import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { getBookingSettings, saveBookingSettings } from "@/lib/bookings/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Validation schema for booking settings
const timeSlotSchema = z.object({
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
}).nullable();

const bookingSettingsSchema = z.object({
    timezone: z.string().min(1, "Timezone is required"),
    availability: z.object({
        Monday: timeSlotSchema,
        Tuesday: timeSlotSchema,
        Wednesday: timeSlotSchema,
        Thursday: timeSlotSchema,
        Friday: timeSlotSchema,
        Saturday: timeSlotSchema,
        Sunday: timeSlotSchema,
    }),
    brandColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#000000"),
}).partial();

export async function GET(request: Request) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const settings = await getBookingSettings();
        return NextResponse.json(settings);
    } catch (error) {
        logger.error("GET /api/bookings/settings failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to fetch settings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const body = await request.json();
        const data = bookingSettingsSchema.parse(body);

        // Validate time slots (end must be after start)
        if (data.availability) {
            for (const [day, slot] of Object.entries(data.availability)) {
                if (slot && typeof slot === 'object' && 'start' in slot && 'end' in slot) {
                    const typedSlot = slot as { start: string; end: string };
                    const [startH, startM] = typedSlot.start.split(":").map(Number);
                    const [endH, endM] = typedSlot.end.split(":").map(Number);
                    const startMinutes = startH * 60 + startM;
                    const endMinutes = endH * 60 + endM;

                    if (endMinutes <= startMinutes) {
                        return NextResponse.json(
                            { code: "VALIDATION_ERROR", message: `${day}: End time must be after start time` },
                            { status: 400 }
                        );
                    }
                }
            }
        }

        const settings = await saveBookingSettings(data as Omit<import("@/types/booking").BookingSettings, "id">);
        logger.info("Booking settings updated");

        return NextResponse.json(settings);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid settings data", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("POST /api/bookings/settings failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to save settings" }, { status: 500 });
    }
}
