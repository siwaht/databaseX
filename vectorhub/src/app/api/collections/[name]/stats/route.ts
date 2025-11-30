import { NextResponse } from "next/server";
import { mockDbClient } from "@/lib/db/client";

interface RouteParams {
    params: { name: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
    const { name } = params;

    try {
        const stats = await mockDbClient.getCollectionStats(name);
        return NextResponse.json(stats);
    } catch (error: any) {
        console.error(`GET /api/collections/${name}/stats failed`, error);
        const status = error?.message?.includes("not found") ? 404 : 500;
        return NextResponse.json({ error: "Failed to fetch collection stats" }, { status });
    }
}
