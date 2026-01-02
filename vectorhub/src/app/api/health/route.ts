import { NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export const runtime = 'edge';

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    uptime: number;
    environment: string;
}

// Track server start time for uptime calculation
const startTime = Date.now();

export async function GET(request: Request) {
    // Apply rate limiting for health checks
    const rateLimitResult = withRateLimit(request, RATE_LIMITS.health);
    if (!rateLimitResult.allowed && rateLimitResult.response) {
        return rateLimitResult.response;
    }

    const timestamp = new Date().toISOString();
    const uptime = Math.floor((Date.now() - startTime) / 1000);

    const health: HealthStatus = {
        status: "healthy",
        timestamp,
        version: "1.0.0",
        uptime,
        environment: "edge",
    };

    return NextResponse.json(health, { status: 200 });
}

