import { NextResponse } from "next/server";
import { getLead, updateLead, deleteLead } from "@/lib/leads/store";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const lead = await getLead(id);

    if (!lead) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(lead);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateLead(id, body);

    if (!updated) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json(updated);
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const deleted = await deleteLead(id);

    if (!deleted) {
        return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
}
