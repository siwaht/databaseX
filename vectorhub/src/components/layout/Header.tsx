"use client";

import { Bell } from "lucide-react";

export function Header() {
    return (
        <header className="flex h-14 items-center justify-between border-b bg-card px-6">
            <div className="flex items-center">
                {/* Breadcrumbs or Page Title could go here */}
                <h2 className="text-lg font-semibold">Dashboard</h2>
            </div>
            <div className="flex items-center space-x-4">
                <button className="rounded-full p-2 hover:bg-muted">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                </button>
            </div>
        </header>
    );
}
