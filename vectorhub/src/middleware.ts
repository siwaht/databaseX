import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Allowed origins for CORS (configure based on your deployment)
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5000",
];

export default withAuth(
    function middleware(request) {
        // Generate unique request ID for tracing
        const requestId = crypto.randomUUID();

        // Get the response
        const response = NextResponse.next();

        // Add request ID header for tracing
        response.headers.set("X-Request-ID", requestId);

        // Add security headers
        response.headers.set("X-Content-Type-Options", "nosniff");
        response.headers.set("X-Frame-Options", "DENY");
        response.headers.set("X-XSS-Protection", "1; mode=block");

        // Add CORS headers for API routes
        if (request.nextUrl.pathname.startsWith("/api/")) {
            const origin = request.headers.get("origin");

            // Allow all origins for MCP endpoint (needed for external AI agents)
            if (request.nextUrl.pathname.startsWith("/api/bookings/mcp")) {
                response.headers.set("Access-Control-Allow-Origin", "*");
            } else if (origin && (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes("*"))) {
                // Validate origin against allowed list for other API routes
                response.headers.set("Access-Control-Allow-Origin", origin);
            }

            response.headers.set(
                "Access-Control-Allow-Methods",
                "GET, POST, PUT, PATCH, DELETE, OPTIONS"
            );
            response.headers.set(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, X-Request-ID, X-Connection-Config"
            );
            response.headers.set("Access-Control-Max-Age", "86400");
            response.headers.set("Access-Control-Allow-Credentials", "true");

            // Handle preflight requests
            if (request.method === "OPTIONS") {
                return new NextResponse(null, {
                    status: 204,
                    headers: response.headers,
                });
            }
        }

        return response;
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const pathname = req.nextUrl.pathname;

                // Public routes that don't require authentication
                const publicRoutes = [
                    "/api/auth",
                    "/api/health",
                    "/api/webhooks",
                    "/api/bookings/mcp",  // MCP endpoint for AI agents
                    "/login",
                    "/register",
                    "/api/setup",
                ];

                // Check if current path starts with any public route
                if (publicRoutes.some(route => pathname.startsWith(route))) {
                    return true;
                }

                // All other routes require authentication
                return !!token;
            },
        },
    }
);

export const config = {
    matcher: [
        "/dashboard/:path*",
        "/users/:path*",
        "/api/:path*",
        "/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|sitemap.xml).*)",
    ],
};
