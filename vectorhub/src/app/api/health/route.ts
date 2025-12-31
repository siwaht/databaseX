import { NextResponse } from "next/server";
import { withRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

interface HealthStatus {
    status: "healthy" | "degraded" | "unhealthy";
    timestamp: string;
    version: string;
    uptime: number;
    environment: string;
    checks: {
        memory: {
            status: "ok" | "warning" | "critical";
            heapUsed: number;
            heapTotal: number;
            percentage: number;
        };
    };
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

    // Check memory usage
    const memoryUsage = process.memoryUsage();
    const heapPercentage = Math.round(
        (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
    );

    const memoryStatus: HealthStatus["checks"]["memory"] = {
        status: heapPercentage > 90 ? "critical" : heapPercentage > 75 ? "warning" : "ok",
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: heapPercentage,
    };

    // Determine overall health status
    let overallStatus: HealthStatus["status"] = "healthy";
    if (memoryStatus.status === "critical") {
        overallStatus = "unhealthy";
    } else if (memoryStatus.status === "warning") {
        overallStatus = "degraded";
    }

    const health: HealthStatus = {
        status: overallStatus,
        timestamp,
        version: process.env.npm_package_version || "1.0.0",
        uptime,
        environment: process.env.NODE_ENV || "development",
        checks: {
            memory: memoryStatus,
        },
    };

    // Return appropriate HTTP status code based on health
    const httpStatus = overallStatus === "unhealthy" ? 503 : 200;

    return NextResponse.json(health, { status: httpStatus });
}

