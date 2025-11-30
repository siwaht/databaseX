"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex items-center justify-center min-h-[400px] p-6">
                    <Card className="max-w-md w-full">
                        <CardHeader className="text-center">
                            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                                <AlertTriangle className="h-6 w-6 text-destructive" />
                            </div>
                            <CardTitle>Something went wrong</CardTitle>
                            <CardDescription>
                                An unexpected error occurred. Please try again.
                            </CardDescription>
                        </CardHeader>
                        {this.state.error && (
                            <CardContent>
                                <div className="rounded-md bg-muted p-3 font-mono text-sm text-muted-foreground overflow-auto max-h-32">
                                    {this.state.error.message}
                                </div>
                            </CardContent>
                        )}
                        <CardFooter className="justify-center">
                            <Button onClick={this.handleReset} variant="outline">
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Try Again
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

// Functional wrapper for error boundary with reset
export function ErrorBoundaryWrapper({
    children,
    fallbackMessage = "Something went wrong",
}: {
    children: React.ReactNode;
    fallbackMessage?: string;
}) {
    return (
        <ErrorBoundary
            fallback={
                <div className="flex flex-col items-center justify-center min-h-[200px] text-center p-6">
                    <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
                    <p className="text-muted-foreground">{fallbackMessage}</p>
                </div>
            }
        >
            {children}
        </ErrorBoundary>
    );
}

