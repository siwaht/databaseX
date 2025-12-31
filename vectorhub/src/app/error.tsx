"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console in development, could send to error tracking service in production
        console.error("Application error:", error);
    }, [error]);

    return (
        <div className="flex items-center justify-center min-h-screen p-6 bg-background">
            <Card className="max-w-md w-full">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center">
                        <AlertTriangle className="h-7 w-7 text-destructive" />
                    </div>
                    <CardTitle className="text-xl">Something went wrong</CardTitle>
                    <CardDescription>
                        An unexpected error occurred. Our team has been notified.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {process.env.NODE_ENV === "development" && (
                        <div className="rounded-md bg-muted p-3 font-mono text-xs text-muted-foreground overflow-auto max-h-32">
                            <p className="font-semibold mb-1">{error.name}</p>
                            <p>{error.message}</p>
                            {error.digest && (
                                <p className="mt-2 text-[10px] opacity-60">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex gap-3 justify-center">
                    <Button onClick={reset} variant="default">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Try Again
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">
                            <Home className="mr-2 h-4 w-4" />
                            Go Home
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
