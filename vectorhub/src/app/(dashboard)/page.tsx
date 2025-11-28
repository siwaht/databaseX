"use client";

import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, Layers, FileText, Activity } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
    const { connections, collections, documents } = useStore();

    const stats = [
        {
            title: "Total Connections",
            value: connections.length,
            icon: Database,
            href: "/connections",
            color: "text-blue-500",
        },
        {
            title: "Active Collections",
            value: collections.length,
            icon: Layers,
            href: "/collections",
            color: "text-green-500",
        },
        {
            title: "Indexed Documents",
            value: documents.length,
            icon: FileText,
            href: "/documents",
            color: "text-orange-500",
        },
        {
            title: "Total Vectors",
            value: collections.reduce((acc, c) => acc + c.documentCount, 0),
            icon: Activity,
            href: "/collections",
            color: "text-purple-500",
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your vector database infrastructure.
                </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => (
                    <Link key={stat.title} href={stat.href}>
                        <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    {stat.title}
                                </CardTitle>
                                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">
                            No recent activity to display.
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>System Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Storage Usage</span>
                                <span className="text-sm font-medium">2.4 GB / 10 GB</span>
                            </div>
                            <div className="h-2 w-full rounded-full bg-secondary">
                                <div className="h-full w-[24%] rounded-full bg-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
