import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { listBookings, listEventTypes, getBookingSettings } from "@/lib/bookings/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { generateTimeSlots } from "@/lib/bookings/utils";

export const runtime = 'edge';

const availabilitySchema = z.object({
    eventTypeId: z.string().min(1, "Event type ID is required"),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export async function GET(request: Request) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const params = availabilitySchema.parse({
            eventTypeId: searchParams.get("eventTypeId"),
            date: searchParams.get("date"),
        });

        // Get event type
        const eventTypes = await listEventTypes();
        const eventType = eventTypes.find((e) => e.id === params.eventTypeId);

        if (!eventType) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Event type not found: ${params.eventTypeId}` },
                { status: 404 }
            );
        }

        if (!eventType.isActive) {
            return NextResponse.json(
                { code: "UNAVAILABLE", message: "Event type is not active" },
                { status: 400 }
            );
        }

        // Get settings for availability
        const settings = await getBookingSettings();

        // Parse the date
        const date = new Date(params.date + "T00:00:00");
        const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
        const dayAvailability = settings.availability[dayName];

        if (!dayAvailability) {
            return NextResponse.json({
                date: params.date,
                eventType: {
                    id: eventType.id,
                    name: eventType.name,
                    duration: eventType.duration,
                },
                available: false,
                reason: `${dayName} is not available for bookings`,
                slots: [],
            });
        }

        // Get existing bookings for this date
        const bookings = await listBookings();
        const dayBookings = bookings.filter((b) => {
            const bookingDate = new Date(b.startTime).toISOString().split("T")[0];
            return bookingDate === params.date && b.status !== "cancelled";
        });

        // Generate time slots using shared utility
        const slots = generateTimeSlots(
            dayAvailability.start,
            dayAvailability.end,
            eventType.duration,
            dayBookings,
            date
        );

        // Check if date is in the past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const isPast = date < today;

        return NextResponse.json({
            date: params.date,
            dayOfWeek: dayName,
            timezone: settings.timezone,
            eventType: {
                id: eventType.id,
                name: eventType.name,
                duration: eventType.duration,
                color: eventType.color,
            },
            available: !isPast && slots.some(s => s.available),
            isPast,
            workingHours: {
                start: dayAvailability.start,
                end: dayAvailability.end,
            },
            slots: isPast ? [] : slots,
            bookedSlots: dayBookings.map((b) => ({
                start: b.startTime,
                end: b.endTime,
            })),
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid parameters", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("GET /api/bookings/availability failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to check availability" },
            { status: 500 }
        );
    }
}
