import { NextResponse } from "next/server";
import { z } from "zod";
import { getLead, updateLead, deleteLead } from "@/lib/leads/store";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export const runtime = 'edge';

// Validation schema for updating a lead
const updateLeadSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    email: z.string().email().optional(),
    phone: z.string().max(20).optional(),
    company: z.string().max(100).optional(),
    status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    interestedIn: z.string().max(200).optional(),
    preferredContactMethod: z.enum(["email", "phone", "callback"]).optional(),
    preferredCallbackTime: z.string().max(100).optional(),
    assignedTo: z.string().max(100).optional(),
}).strict();

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { id } = await params;
        const lead = await getLead(id);

        if (!lead) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: "Lead not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(lead);
    } catch (error) {
        logger.error("GET /api/leads/[id] failed", error instanceof Error ? error : undefined);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to fetch lead" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { id } = await params;
        const body = await request.json();
        const validated = updateLeadSchema.parse(body);

        // Add updatedAt timestamp
        const updates = {
            ...validated,
            updatedAt: new Date().toISOString(),
        };

        const updated = await updateLead(id, updates);

        if (!updated) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: "Lead not found" },
                { status: 404 }
            );
        }

        logger.info(`Lead updated: ${id}`);
        return NextResponse.json(updated);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid update data", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("PATCH /api/leads/[id] failed", error instanceof Error ? error : undefined);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to update lead" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { id } = await params;
        const deleted = await deleteLead(id);

        if (!deleted) {
            return NextResponse.json(
                { code: "NOT_FOUND", message: "Lead not found" },
                { status: 404 }
            );
        }

        logger.info(`Lead deleted: ${id}`);
        return NextResponse.json({ success: true, id });
    } catch (error) {
        logger.error("DELETE /api/leads/[id] failed", error instanceof Error ? error : undefined);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to delete lead" },
            { status: 500 }
        );
    }
}
