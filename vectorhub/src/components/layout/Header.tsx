"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Bell, ChevronRight, Moon, Sun, Monitor, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Route to breadcrumb label mapping
const routeLabels: Record<string, string> = {
    "": "Dashboard",
    connections: "Connections",
    collections: "Collections",
    documents: "Documents",
    upload: "Upload",
    search: "Search",
    settings: "Settings",
};

function Breadcrumbs() {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean);

    const breadcrumbs = segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const label = routeLabels[segment] || segment;
        const isLast = index === segments.length - 1;

        return { href, label, isLast };
    });

    // Always include home/dashboard
    if (breadcrumbs.length === 0) {
        breadcrumbs.push({ href: "/", label: "Dashboard", isLast: true });
    }

    return (
        <nav className="flex items-center space-x-1 text-sm">
            <Link
                href="/"
                className={cn(
                    "transition-colors hover:text-foreground",
                    breadcrumbs.length === 1 && breadcrumbs[0].href === "/"
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                )}
            >
                Dashboard
            </Link>
            {breadcrumbs.map(
                (crumb) =>
                    crumb.href !== "/" && (
                        <div key={crumb.href} className="flex items-center">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <Link
                                href={crumb.href}
                                className={cn(
                                    "ml-1 transition-colors hover:text-foreground",
                                    crumb.isLast
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground"
                                )}
                            >
                                {crumb.label}
                            </Link>
                        </div>
                    )
            )}
        </nav>
    );
}

function ThemeToggle() {
    const { theme, setTheme } = useTheme();

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    <Sun className="mr-2 h-4 w-4" />
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    <Moon className="mr-2 h-4 w-4" />
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                    <Monitor className="mr-2 h-4 w-4" />
                    System
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Header() {
    return (
        <header className="flex h-14 items-center justify-between border-b bg-card/50 backdrop-blur-sm px-6 sticky top-0 z-40">
            <Breadcrumbs />
            <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Search className="h-4 w-4 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-primary" />
                </Button>
                <ThemeToggle />
            </div>
        </header>
    );
}
