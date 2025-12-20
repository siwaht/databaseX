import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { listIntegrations, createIntegration } from "@/lib/integrations/store";

export async function GET() {
    try {
        const integrations = await listIntegrations();
        return NextResponse.json(integrations);
    } catch (error) {
        logger.error("GET /api/integrations failed", error as Error);
        return NextResponse.json({ error: "Failed to fetch integrations" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const data = await request.json();

        // Basic validation
        if (!data.name || !data.config?.url) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const integration = await createIntegration({
            type: data.type || 'webhook',
            name: data.name,
            config: data.config
        });

        return NextResponse.json(integration, { status: 201 });
    } catch (error) {
        logger.error("POST /api/integrations failed", error as Error);
        return NextResponse.json({ error: "Failed to create integration" }, { status: 500 });
    }
}
