import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { listBookings, createBooking, listEventTypes } from "@/lib/bookings/store";
import { broadcastWebhook } from "@/lib/webhooks/delivery";
import { listWebhookConnections, getWebhookSecret } from "@/lib/webhooks/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { Booking } from "@/types/booking";

export const runtime = 'edge';

// Validation schema for creating a booking
const createBookingSchema = z.object({
    eventTypeId: z.string().min(1, "Event type ID is required"),
    startTime: z.string().datetime("Invalid start time format"),
    endTime: z.string().datetime("Invalid end time format").optional(),
    guestName: z.string().min(1, "Guest name is required").max(100),
    guestEmail: z.string().email("Invalid email address"),
    guestNotes: z.string().max(1000).optional(),
    agenda: z.string().max(2000).optional(),
    meetingUrl: z.string().url().optional(),
});

// Query params schema for filtering
const listBookingsSchema = z.object({
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
    eventTypeId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
});

export async function GET(request: Request) {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const params = listBookingsSchema.parse({
            status: searchParams.get("status") || undefined,
            eventTypeId: searchParams.get("eventTypeId") || undefined,
            startDate: searchParams.get("startDate") || undefined,
            endDate: searchParams.get("endDate") || undefined,
            limit: searchParams.get("limit") || 50,
            offset: searchParams.get("offset") || 0,
        });

        let bookings = await listBookings();

        // Apply filters
        if (params.status) {
            bookings = bookings.filter((b) => b.status === params.status);
        }
        if (params.eventTypeId) {
            bookings = bookings.filter((b) => b.eventTypeId === params.eventTypeId);
        }
        if (params.startDate) {
            const start = new Date(params.startDate);
            bookings = bookings.filter((b) => new Date(b.startTime) >= start);
        }
        if (params.endDate) {
            const end = new Date(params.endDate);
            bookings = bookings.filter((b) => new Date(b.startTime) <= end);
        }

        // Sort by start time (newest first)
        bookings.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

        // Apply pagination
        const total = bookings.length;
        bookings = bookings.slice(params.offset, params.offset + params.limit);

        return NextResponse.json({
            data: bookings,
            pagination: {
                total,
                limit: params.limit,
                offset: params.offset,
                hasMore: params.offset + params.limit < total,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid query parameters", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("GET /api/bookings failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to fetch bookings" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    // Apply rate limiting for write operations
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const body = await request.json();
        const data = createBookingSchema.parse(body);

        // Validate event type exists
        const eventTypes = await listEventTypes();
        const eventType = eventTypes.find((e) => e.id === data.eventTypeId);

        if (!eventType) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Event type not found: ${data.eventTypeId}` },
                { status: 404 }
            );
        }

        // Calculate end time if not provided
        let endTime = data.endTime;
        if (!endTime) {
            const start = new Date(data.startTime);
            start.setMinutes(start.getMinutes() + eventType.duration);
            endTime = start.toISOString();
        }

        // Check for conflicts
        const existingBookings = await listBookings();
        const hasConflict = existingBookings.some((booking) => {
            if (booking.status === "cancelled") return false;
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            const newStart = new Date(data.startTime);
            const newEnd = new Date(endTime!);
            return newStart < bookingEnd && newEnd > bookingStart;
        });

        if (hasConflict) {
            return NextResponse.json(
                { code: "CONFLICT", message: "Time slot is already booked" },
                { status: 409 }
            );
        }

        const newBooking: Booking = {
            id: crypto.randomUUID(),
            eventTypeId: data.eventTypeId,
            eventTypeName: eventType.name,
            startTime: data.startTime,
            endTime: endTime,
            guestName: data.guestName,
            guestEmail: data.guestEmail,
            guestNotes: data.guestNotes,
            agenda: data.agenda,
            meetingUrl: data.meetingUrl,
            status: "confirmed",
            createdAt: new Date().toISOString(),
        };

        const created = await createBooking(newBooking);

        // Broadcast webhook event
        try {
            const webhooks = await listWebhookConnections();
            const secret = getWebhookSecret();
            await broadcastWebhook(webhooks, "booking.created", created as unknown as Record<string, unknown>, secret);
        } catch (webhookError) {
            logger.warn("Failed to broadcast booking.created webhook", { error: webhookError });
        }

        logger.info("Booking created", { id: created.id, eventType: eventType.name });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid booking data", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("POST /api/bookings failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to create booking" }, { status: 500 });
    }
}
