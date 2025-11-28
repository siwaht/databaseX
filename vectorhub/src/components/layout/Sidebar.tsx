"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Database,
    Layers,
    Files,
    Upload,
    Search,
    Settings,
    Activity
} from "lucide-react";

const navItems = [
    { href: "/connections", icon: Database, label: "Connections" },
    { href: "/collections", icon: Layers, label: "Collections" },
    { href: "/documents", icon: Files, label: "Documents" },
    { href: "/upload", icon: Upload, label: "Upload" },
    { href: "/search", icon: Search, label: "Search" },
    { href: "/settings", icon: Settings, label: "Settings" },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="flex h-full w-64 flex-col border-r bg-card text-card-foreground">
            <div className="flex h-14 items-center border-b px-6">
                <Activity className="mr-2 h-6 w-6 text-primary" />
                <span className="text-lg font-bold">VectorHub</span>
            </div>
            <nav className="flex-1 space-y-1 p-4">
                {navItems.map((item) => {
                    const isActive = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            )}
                        >
                            <item.icon className="mr-3 h-5 w-5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
            <div className="border-t p-4">
                <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10" />
                    <div>
                        <p className="text-sm font-medium">User</p>
                        <p className="text-xs text-muted-foreground">admin@vectorhub.com</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
