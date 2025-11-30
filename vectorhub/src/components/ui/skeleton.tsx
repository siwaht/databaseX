"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: "default" | "circular" | "text";
}

function Skeleton({ className, variant = "default", ...props }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse bg-muted",
                {
                    "rounded-md": variant === "default",
                    "rounded-full": variant === "circular",
                    "rounded h-4": variant === "text",
                },
                className
            )}
            {...props}
        />
    );
}

function SkeletonCard() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" variant="default" />
            </div>
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-40" variant="text" />
            <div className="flex justify-between pt-2">
                <Skeleton className="h-9 w-20" />
                <div className="flex gap-2">
                    <Skeleton className="h-9 w-9" variant="circular" />
                    <Skeleton className="h-9 w-9" variant="circular" />
                </div>
            </div>
        </div>
    );
}

function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="rounded-md border">
            <div className="border-b p-4">
                <div className="flex gap-4">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[100px]" />
                    <Skeleton className="h-4 w-[80px]" />
                </div>
            </div>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="border-b p-4 last:border-0">
                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2 w-[200px]">
                            <Skeleton className="h-4 w-4" variant="circular" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                        <Skeleton className="h-5 w-[80px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-8 w-8" variant="circular" />
                    </div>
                </div>
            ))}
        </div>
    );
}

function SkeletonStats() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border bg-card p-6 space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-4" variant="circular" />
                    </div>
                    <Skeleton className="h-8 w-16" />
                </div>
            ))}
        </div>
    );
}

export { Skeleton, SkeletonCard, SkeletonTable, SkeletonStats };

