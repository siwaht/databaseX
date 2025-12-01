"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
};

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    return (
        <Loader2
            className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)}
        />
    );
}

interface LoadingOverlayProps {
    message?: string;
    className?: string;
}

export function LoadingOverlay({ message = "Loading...", className }: LoadingOverlayProps) {
    return (
        <div
            className={cn(
                "absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50",
                className
            )}
        >
            <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}

interface LoadingPageProps {
    message?: string;
}

export function LoadingPage({ message = "Loading..." }: LoadingPageProps) {
    return (
        <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-muted-foreground">{message}</p>
            </div>
        </div>
    );
}

interface LoadingButtonProps {
    loading?: boolean;
    children: React.ReactNode;
    loadingText?: string;
}

export function LoadingButton({
    loading,
    children,
    loadingText = "Loading...",
}: LoadingButtonProps) {
    if (loading) {
        return (
            <span className="flex items-center gap-2">
                <LoadingSpinner size="sm" />
                {loadingText}
            </span>
        );
    }
    return <>{children}</>;
}

