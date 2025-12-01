import { NextResponse } from "next/server";
import { mockDbClient } from "@/lib/db/client";
import { logger } from "@/lib/logger";

interface RouteParams {
    params: { name: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
    const { name } = params;

    try {
        const stats = await mockDbClient.getCollectionStats(name);
        return NextResponse.json(stats);
    } catch (error: any) {
        logger.error("GET /api/collections/stats failed", error, { name });
        const status = error?.message?.includes("not found") ? 404 : 500;
        return NextResponse.json({ error: "Failed to fetch collection stats" }, { status });
    }
}
