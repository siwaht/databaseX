"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SkeletonStats } from "@/components/ui/skeleton";
import { Database, Layers, FileText, Activity, ArrowUpRight, Clock, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.4,
            ease: "easeOut",
        },
    },
};

export default function DashboardPage() {
    // Access store state separately
    const connections = useStore((state) => state.connections);
    const collections = useStore((state) => state.collections);
    const documents = useStore((state) => state.documents);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Simulate initial data loading
        const timer = setTimeout(() => setIsLoading(false), 500);
        return () => clearTimeout(timer);
    }, []);

    const stats = [
        {
            title: "Total Connections",
            value: connections.length,
            icon: Database,
            href: "/connections",
            color: "text-blue-500",
            bgColor: "bg-blue-500/10",
            borderColor: "border-blue-500/20",
            change: "+2 this week",
        },
        {
            title: "Active Collections",
            value: collections.length,
            icon: Layers,
            href: "/collections",
            color: "text-emerald-500",
            bgColor: "bg-emerald-500/10",
            borderColor: "border-emerald-500/20",
            change: "+5 this month",
        },
        {
            title: "Indexed Documents",
            value: documents.length,
            icon: FileText,
            href: "/documents",
            color: "text-amber-500",
            bgColor: "bg-amber-500/10",
            borderColor: "border-amber-500/20",
            change: "+128 today",
        },
        {
            title: "Total Vectors",
            value: collections.reduce((acc, c) => acc + c.documentCount, 0),
            icon: Activity,
            href: "/collections",
            color: "text-purple-500",
            bgColor: "bg-purple-500/10",
            borderColor: "border-purple-500/20",
            change: "1.2M embeddings",
        },
    ];

    const recentActivities = [
        { action: "Collection created", target: "product_embeddings", time: "2 min ago", icon: Layers },
        { action: "Documents indexed", target: "150 items", time: "15 min ago", icon: FileText },
        { action: "Connection synced", target: "Pinecone Prod", time: "1 hour ago", icon: Database },
        { action: "Search query", target: '"AI assistants"', time: "2 hours ago", icon: Zap },
    ];

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <p className="text-muted-foreground">
                        Overview of your vector database infrastructure.
                    </p>
                </div>
                <SkeletonStats />
            </div>
        );
    }

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <p className="text-muted-foreground">
                    Overview of your vector database infrastructure.
                </p>
            </motion.div>

            {/* Stats Grid */}
            <motion.div
                className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
                variants={containerVariants}
            >
                {stats.map((stat) => (
                    <motion.div key={stat.title} variants={itemVariants}>
                        <Link href={stat.href}>
                            <Card className={cn(
                                "card-hover cursor-pointer border",
                                stat.borderColor
                            )}>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium text-muted-foreground">
                                        {stat.title}
                                    </CardTitle>
                                    <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                                        <stat.icon className={cn("h-4 w-4", stat.color)} />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-bold">
                                        {stat.value.toLocaleString()}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                        <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                                        {stat.change}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    </motion.div>
                ))}
            </motion.div>

            {/* Activity and Status */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <motion.div variants={itemVariants} className="col-span-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Clock className="h-5 w-5 text-muted-foreground" />
                                Recent Activity
                            </CardTitle>
                            <CardDescription>
                                Latest operations across your vector databases
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {recentActivities.length > 0 ? (
                                <div className="space-y-4">
                                    {recentActivities.map((activity, i) => (
                                        <motion.div
                                            key={i}
                                            className="flex items-center gap-4"
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                        >
                                            <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center">
                                                <activity.icon className="h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">
                                                    {activity.action}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {activity.target}
                                                </p>
                                            </div>
                                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                                                {activity.time}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-muted-foreground text-center py-8">
                                    No recent activity to display.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="col-span-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-muted-foreground" />
                                System Status
                            </CardTitle>
                            <CardDescription>
                                Resource usage and health metrics
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Storage Usage</span>
                                    <span className="font-medium">2.4 GB / 10 GB</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "24%" }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">API Requests (24h)</span>
                                    <span className="font-medium">8,421 / 50,000</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-500/60 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "17%" }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Vector Operations</span>
                                    <span className="font-medium">1.2M / 5M</span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                                    <motion.div
                                        className="h-full bg-gradient-to-r from-amber-500 to-amber-500/60 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: "24%" }}
                                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex items-center gap-2 text-sm">
                                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-muted-foreground">All systems operational</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </motion.div>
    );
}
