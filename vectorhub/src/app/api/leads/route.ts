import { NextResponse } from "next/server";
import { listLeads, createLead, getLeadStats } from "@/lib/leads/store";
import { Lead } from "@/types/booking";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const stats = searchParams.get("stats");

    if (stats === "true") {
        const leadStats = await getLeadStats();
        return NextResponse.json(leadStats);
    }

    const leads = await listLeads();
    return NextResponse.json({ data: leads });
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const newLead: Lead = {
            id: crypto.randomUUID(),
            name: body.name,
            email: body.email,
            phone: body.phone,
            company: body.company,
            source: body.source || "website",
            status: "new",
            priority: body.priority || "medium",
            notes: body.notes,
            tags: body.tags || [],
            interestedIn: body.interestedIn,
            preferredContactMethod: body.preferredContactMethod || "email",
            preferredCallbackTime: body.preferredCallbackTime,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const created = await createLead(newLead);
        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create lead" },
            { status: 400 }
        );
    }
}
