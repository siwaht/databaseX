import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { listBookings, updateBooking, deleteBooking } from "@/lib/bookings/store";
import { broadcastWebhook } from "@/lib/webhooks/delivery";
import { listWebhookConnections, getWebhookSecret } from "@/lib/webhooks/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

// Validation schema for updating a booking
const updateBookingSchema = z.object({
    status: z.enum(["pending", "confirmed", "cancelled", "completed"]).optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    guestNotes: z.string().max(1000).optional(),
    agenda: z.string().max(2000).optional(),
    meetingUrl: z.string().url().optional().nullable(),
});

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET a single booking
export async function GET(request: Request, { params }: RouteParams) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { id } = await params;
        const bookings = await listBookings();
        const booking = bookings.find((b) => b.id === id);

        if (!booking) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Booking not found: ${id}` },
                { status: 404 }
            );
        }

        return NextResponse.json(booking);
    } catch (error) {
        logger.error("GET /api/bookings/[id] failed", error as Error);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to fetch booking" },
            { status: 500 }
        );
    }
}

// UPDATE a booking
export async function PATCH(request: Request, { params }: RouteParams) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const data = updateBookingSchema.parse(body);

        // Get current booking to check if it exists
        const bookings = await listBookings();
        const currentBooking = bookings.find((b) => b.id === id);

        if (!currentBooking) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Booking not found: ${id}` },
                { status: 404 }
            );
        }

        // Check for time conflicts if updating time
        if (data.startTime || data.endTime) {
            const newStart = new Date(data.startTime || currentBooking.startTime);
            const newEnd = new Date(data.endTime || currentBooking.endTime);

            const hasConflict = bookings.some((booking) => {
                if (booking.id === id || booking.status === "cancelled") return false;
                const bookingStart = new Date(booking.startTime);
                const bookingEnd = new Date(booking.endTime);
                return newStart < bookingEnd && newEnd > bookingStart;
            });

            if (hasConflict) {
                return NextResponse.json(
                    { code: "CONFLICT", message: "Time slot is already booked" },
                    { status: 409 }
                );
            }
        }

        const updatedBooking = await updateBooking(id, data as Partial<typeof currentBooking>);

        if (!updatedBooking) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Booking not found: ${id}` },
                { status: 404 }
            );
        }

        // Determine webhook event type
        let eventType = "booking.updated";
        if (data.status === "cancelled" && currentBooking.status !== "cancelled") {
            eventType = "booking.cancelled";
        } else if (data.status === "confirmed" && currentBooking.status !== "confirmed") {
            eventType = "booking.confirmed";
        } else if (data.status === "completed" && currentBooking.status !== "completed") {
            eventType = "booking.completed";
        }

        // Broadcast webhook event
        try {
            const webhooks = await listWebhookConnections();
            const secret = getWebhookSecret();
            await broadcastWebhook(
                webhooks,
                eventType,
                {
                    ...updatedBooking,
                    previousStatus: currentBooking.status,
                } as unknown as Record<string, unknown>,
                secret
            );
        } catch (webhookError) {
            logger.warn(`Failed to broadcast ${eventType} webhook`, { error: webhookError });
        }

        logger.info("Booking updated", { id, eventType });

        return NextResponse.json(updatedBooking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid update data", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("PATCH /api/bookings/[id] failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to update booking" },
            { status: 500 }
        );
    }
}

// DELETE a booking
export async function DELETE(request: Request, { params }: RouteParams) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { id } = await params;

        // Get booking before deletion for webhook
        const bookings = await listBookings();
        const booking = bookings.find((b) => b.id === id);

        if (!booking) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Booking not found: ${id}` },
                { status: 404 }
            );
        }

        const success = await deleteBooking(id);

        if (!success) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Booking not found: ${id}` },
                { status: 404 }
            );
        }

        // Broadcast webhook event
        try {
            const webhooks = await listWebhookConnections();
            const secret = getWebhookSecret();
            await broadcastWebhook(
                webhooks,
                "booking.deleted",
                { id, deletedBooking: booking } as unknown as Record<string, unknown>,
                secret
            );
        } catch (webhookError) {
            logger.warn("Failed to broadcast booking.deleted webhook", { error: webhookError });
        }

        logger.info("Booking deleted", { id });

        return NextResponse.json({ success: true, id });
    } catch (error) {
        logger.error("DELETE /api/bookings/[id] failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to delete booking" },
            { status: 500 }
        );
    }
}
