import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { listBookings, listEventTypes, getBookingSettings } from "@/lib/bookings/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

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

        // Generate time slots
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
            available: !isPast && slots.length > 0,
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

interface Booking {
    startTime: string;
    endTime: string;
}

function generateTimeSlots(
    startTime: string,
    endTime: string,
    duration: number,
    existingBookings: Booking[],
    date: Date
): { start: string; end: string; available: boolean }[] {
    const slots: { start: string; end: string; available: boolean }[] = [];
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);

    const current = new Date(date);
    current.setHours(startHour, startMin, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(endHour, endMin, 0, 0);

    const now = new Date();

    while (current < endDate) {
        const slotEnd = new Date(current);
        slotEnd.setMinutes(slotEnd.getMinutes() + duration);

        if (slotEnd > endDate) break;

        // Check if slot is in the past
        const isPast = current < now;

        // Check if slot conflicts with existing bookings
        const hasConflict = existingBookings.some((booking) => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return current < bookingEnd && slotEnd > bookingStart;
        });

        slots.push({
            start: current.toISOString(),
            end: slotEnd.toISOString(),
            available: !isPast && !hasConflict,
        });

        current.setMinutes(current.getMinutes() + duration);
    }

    return slots;
}
