import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { createWebhookConnectionSchema, validateRequestBody } from "@/lib/validations/api";
import {
    createWebhookConnection,
    listWebhookConnections,
} from "@/lib/webhooks/store";

export async function GET() {
    try {
        const connections = await listWebhookConnections();
        return NextResponse.json(connections);
    } catch (error) {
        logger.error("GET /api/webhooks failed", error as Error);
        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to list webhooks",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const validation = await validateRequestBody(request, createWebhookConnectionSchema);

    if (!validation.success) {
        return NextResponse.json(validation.error, { status: 400 });
    }

    const { data } = validation;

    try {
        const created = await createWebhookConnection({
            name: data.name,
            url: data.url,
            eventTypes: data.eventTypes,
            secretConfigured: data.secretConfigured ?? false,
        });

        return NextResponse.json(created, { status: 201 });
    } catch (error) {
        logger.error("POST /api/webhooks failed", error as Error, {
            name: data.name,
            url: data.url,
        });

        return NextResponse.json(
            {
                code: "INTERNAL_ERROR",
                message: "Failed to create webhook",
            },
            { status: 500 }
        );
    }
}
