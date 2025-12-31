import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "@/lib/logger";
import { listEventTypes, createEventType, updateEventType, deleteEventType } from "@/lib/bookings/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { EventType } from "@/types/booking";

// Validation schemas
const createEventTypeSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).default(""),
    duration: z.number().min(5, "Duration must be at least 5 minutes").max(480, "Duration cannot exceed 8 hours"),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Invalid color format").default("#3b82f6"),
    isActive: z.boolean().default(true),
});

const updateEventTypeSchema = z.object({
    id: z.string().min(1, "ID is required"),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).optional(),
    duration: z.number().min(5).max(480).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
    isActive: z.boolean().optional(),
});

export async function GET(request: Request) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get("activeOnly") === "true";

        let eventTypes = await listEventTypes();

        if (activeOnly) {
            eventTypes = eventTypes.filter((e) => e.isActive);
        }

        return NextResponse.json({
            data: eventTypes,
            total: eventTypes.length,
        });
    } catch (error) {
        logger.error("GET /api/bookings/event-types failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to fetch event types" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const body = await request.json();

        // Check if this is an update (has id) or create
        if (body.id) {
            const data = updateEventTypeSchema.parse(body);
            const { id, ...updates } = data;

            const updated = await updateEventType(id, updates);
            if (!updated) {
                return NextResponse.json(
                    { code: "NOT_FOUND", message: `Event type not found: ${id}` },
                    { status: 404 }
                );
            }

            logger.info("Event type updated", { id });
            return NextResponse.json(updated);
        } else {
            const data = createEventTypeSchema.parse(body);

            // Generate slug from name
            const slug = data.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/(^-|-$)/g, "");

            // Check for duplicate slug
            const existing = await listEventTypes();
            if (existing.some((e) => e.slug === slug)) {
                return NextResponse.json(
                    { code: "CONFLICT", message: "An event type with this name already exists" },
                    { status: 409 }
                );
            }

            const newEventType: EventType = {
                id: crypto.randomUUID(),
                name: data.name,
                description: data.description,
                duration: data.duration,
                slug,
                isActive: data.isActive,
                color: data.color,
            };

            const created = await createEventType(newEventType);
            logger.info("Event type created", { id: created.id, name: created.name });

            return NextResponse.json(created, { status: 201 });
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid event type data", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("POST /api/bookings/event-types failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to save event type" }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Event type ID is required" },
                { status: 400 }
            );
        }

        const deleted = await deleteEventType(id);
        if (!deleted) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: `Event type not found: ${id}` },
                { status: 404 }
            );
        }

        logger.info("Event type deleted", { id });
        return NextResponse.json({ success: true, id });
    } catch (error) {
        logger.error("DELETE /api/bookings/event-types failed", error instanceof Error ? error : new Error(String(error)));
        return NextResponse.json({ code: "INTERNAL_ERROR", message: "Failed to delete event type" }, { status: 500 });
    }
}
