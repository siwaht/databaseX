import { NextResponse } from "next/server";
import { mockDbClient } from "@/lib/db/client";
import { logger } from "@/lib/logger";

interface RouteParams {
    params: { name: string };
}

export async function DELETE(request: Request, { params }: RouteParams) {
    const { name } = params;
    const url = new URL(request.url);
    const cascade = url.searchParams.get("cascade") === "true";

    try {
        await mockDbClient.deleteCollection(name, cascade);
        return NextResponse.json({ ok: true });
    } catch (error: any) {
        logger.error("DELETE /api/collections failed", error, { name, cascade });
        const status = error?.message?.includes("not found") ? 404 : 500;
        return NextResponse.json({ error: "Failed to delete collection" }, { status });
    }
}
