import { NextResponse } from "next/server";
import { z } from "zod";
import { listLeads, createLead, getLeadStats } from "@/lib/leads/store";
import { Lead } from "@/types/booking";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

// Validation schema for creating a lead
const createLeadSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name too long"),
    email: z.string().email("Invalid email address"),
    phone: z.string().max(20).optional(),
    company: z.string().max(100).optional(),
    source: z.enum(["website", "chatbot", "referral", "social", "other"]).default("website"),
    priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
    notes: z.string().max(2000).optional(),
    tags: z.array(z.string().max(50)).max(10).optional(),
    interestedIn: z.string().max(200).optional(),
    preferredContactMethod: z.enum(["email", "phone", "callback"]).default("email"),
    preferredCallbackTime: z.string().max(100).optional(),
    customFields: z.array(z.object({
        fieldId: z.string(),
        fieldName: z.string(),
        value: z.union([z.string(), z.array(z.string()), z.boolean(), z.number()]),
    })).optional(),
});

// Query params schema for filtering leads
const listLeadsSchema = z.object({
    status: z.enum(["new", "contacted", "qualified", "converted", "lost"]).optional(),
    priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
    source: z.enum(["website", "chatbot", "referral", "social", "other"]).optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
    offset: z.coerce.number().min(0).default(0),
    stats: z.string().optional(),
});

export async function GET(request: Request) {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.default);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const { searchParams } = new URL(request.url);
        const params = listLeadsSchema.parse({
            status: searchParams.get("status") || undefined,
            priority: searchParams.get("priority") || undefined,
            source: searchParams.get("source") || undefined,
            limit: searchParams.get("limit") || 50,
            offset: searchParams.get("offset") || 0,
            stats: searchParams.get("stats") || undefined,
        });

        // Return stats if requested
        if (params.stats === "true") {
            const leadStats = await getLeadStats();
            return NextResponse.json(leadStats);
        }

        let leads = await listLeads();

        // Apply filters
        if (params.status) {
            leads = leads.filter((l) => l.status === params.status);
        }
        if (params.priority) {
            leads = leads.filter((l) => l.priority === params.priority);
        }
        if (params.source) {
            leads = leads.filter((l) => l.source === params.source);
        }

        // Sort by creation date (newest first)
        leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        // Apply pagination
        const total = leads.length;
        leads = leads.slice(params.offset, params.offset + params.limit);

        return NextResponse.json({
            data: leads,
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
                { code: "VALIDATION_ERROR", message: "Invalid parameters", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("GET /api/leads failed", error instanceof Error ? error : undefined);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to fetch leads" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    // Apply rate limiting
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.write);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    try {
        const body = await request.json();
        const validated = createLeadSchema.parse(body);

        // Check for duplicate email (optional - can be removed if duplicates are allowed)
        const existingLeads = await listLeads();
        const duplicateLead = existingLeads.find(
            (l) => l.email.toLowerCase() === validated.email.toLowerCase() && 
                   l.status !== "converted" && l.status !== "lost"
        );
        
        if (duplicateLead) {
            return NextResponse.json(
                { 
                    code: "DUPLICATE_LEAD", 
                    message: "A lead with this email already exists",
                    existingLeadId: duplicateLead.id,
                },
                { status: 409 }
            );
        }

        const newLead: Lead = {
            id: crypto.randomUUID(),
            name: validated.name,
            email: validated.email,
            phone: validated.phone,
            company: validated.company,
            source: validated.source,
            status: "new",
            priority: validated.priority,
            notes: validated.notes,
            tags: validated.tags || [],
            interestedIn: validated.interestedIn,
            preferredContactMethod: validated.preferredContactMethod,
            preferredCallbackTime: validated.preferredCallbackTime,
            customFields: validated.customFields,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const created = await createLead(newLead);
        logger.info(`Lead created: ${created.id} (${created.email})`);
        
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { code: "VALIDATION_ERROR", message: "Invalid lead data", details: error.errors },
                { status: 400 }
            );
        }
        logger.error("POST /api/leads failed", error instanceof Error ? error : undefined);
        return NextResponse.json(
            { code: "INTERNAL_ERROR", message: "Failed to create lead" },
            { status: 500 }
        );
    }
}
