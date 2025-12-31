import { NextResponse } from "next/server";
import { z } from "zod";
import { logger } from "./logger";
import { withRateLimit, RATE_LIMITS, addRateLimitHeaders } from "./rate-limit";
import { formatZodError } from "./validations/api";

type RateLimitType = keyof typeof RATE_LIMITS;

interface ApiHandlerOptions {
    rateLimit?: RateLimitType;
    requireAuth?: boolean;
}

interface ApiContext {
    requestId: string;
    startTime: number;
}

type ApiHandler<T = unknown> = (
    request: Request,
    context: ApiContext
) => Promise<NextResponse<T>>;

/**
 * Production-ready API handler wrapper with:
 * - Rate limiting
 * - Request logging
 * - Error handling
 * - Request timing
 */
export function createApiHandler<T = unknown>(
    handler: ApiHandler<T>,
    options: ApiHandlerOptions = {}
): (request: Request) => Promise<NextResponse> {
    return async (request: Request): Promise<NextResponse> => {
        const requestId = request.headers.get("x-request-id") || crypto.randomUUID();
        const startTime = performance.now();
        const path = new URL(request.url).pathname;

        // Log incoming request
        logger.info(`API Request: ${request.method} ${path}`, {
            requestId,
            method: request.method,
            path,
        });

        try {
            // Apply rate limiting
            if (options.rateLimit) {
                const rateLimitConfig = RATE_LIMITS[options.rateLimit];
                const rateLimitResult = withRateLimit(request, rateLimitConfig);

                if (!rateLimitResult.allowed && rateLimitResult.response) {
                    logger.warn("Rate limit exceeded", {
                        requestId,
                        path,
                    });
                    return rateLimitResult.response;
                }
            }

            // Execute handler
            const response = await handler(request, { requestId, startTime });

            // Add rate limit headers if applicable
            if (options.rateLimit) {
                const rateLimitConfig = RATE_LIMITS[options.rateLimit];
                const rateLimitResult = withRateLimit(request, rateLimitConfig);
                addRateLimitHeaders(
                    response,
                    rateLimitResult.remaining,
                    rateLimitResult.resetTime,
                    rateLimitConfig.maxRequests
                );
            }

            // Log successful response
            const duration = performance.now() - startTime;
            logger.info(`API Response: ${response.status}`, {
                requestId,
                path,
                status: response.status,
                durationMs: duration.toFixed(2),
            });

            return response;
        } catch (error) {
            const duration = performance.now() - startTime;

            // Log error
            logger.error(`API Error: ${path}`, error, {
                requestId,
                path,
                durationMs: duration.toFixed(2),
            });

            // Return appropriate error response
            if (error instanceof z.ZodError) {
                return NextResponse.json(formatZodError(error), { status: 400 });
            }

            const message = error instanceof Error ? error.message : "Internal server error";
            const isClientError = message.toLowerCase().includes("not found") ||
                message.toLowerCase().includes("invalid") ||
                message.toLowerCase().includes("unauthorized");

            return NextResponse.json(
                {
                    code: isClientError ? "BAD_REQUEST" : "INTERNAL_ERROR",
                    message: process.env.NODE_ENV === "production" && !isClientError
                        ? "An unexpected error occurred"
                        : message,
                    requestId,
                },
                { status: isClientError ? 400 : 500 }
            );
        }
    };
}

/**
 * Helper to create a successful JSON response
 */
export function jsonResponse<T>(data: T, status = 200): NextResponse<T> {
    return NextResponse.json(data, { status });
}

/**
 * Helper to create an error response
 */
export function errorResponse(
    code: string,
    message: string,
    status = 400,
    details?: Record<string, string[]>
): NextResponse {
    return NextResponse.json({ code, message, details }, { status });
}
