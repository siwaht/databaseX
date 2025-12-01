"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Settings, Palette, Globe, Bell, Loader2 } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function SettingsPage() {
    const { theme, setTheme } = useTheme();
    const [compactView, setCompactView] = useState(false);
    const [notifications, setNotifications] = useState(true);
    const [timeout, setTimeout] = useState("30000");
    const [retries, setRetries] = useState("3");
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);

        // Simulate save delay
        await new Promise((resolve) => window.setTimeout(resolve, 1000));

        setIsSaving(false);
        toast.success("Settings saved", {
            description: "Your preferences have been updated successfully.",
        });
    };

    return (
        <motion.div
            className="space-y-6 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                    <Settings className="h-8 w-8 text-muted-foreground" />
                    Settings
                </h2>
                <p className="text-muted-foreground">
                    Manage your application preferences and configurations.
                </p>
            </motion.div>

            <div className="grid gap-6">
                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Palette className="h-5 w-5 text-muted-foreground" />
                                Appearance
                            </CardTitle>
                            <CardDescription>
                                Customize the look and feel of the application.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Theme</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Choose between light or dark mode
                                    </p>
                                </div>
                                <Select value={theme} onValueChange={setTheme}>
                                    <SelectTrigger className="w-[140px]">
                                        <SelectValue placeholder="Select theme" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="light">Light</SelectItem>
                                        <SelectItem value="dark">Dark</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Compact View</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Use a more compact layout for lists and tables
                                    </p>
                                </div>
                                <Switch
                                    checked={compactView}
                                    onCheckedChange={setCompactView}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                Notifications
                            </CardTitle>
                            <CardDescription>
                                Configure how you receive updates and alerts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label>Enable Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive in-app notifications for important events
                                    </p>
                                </div>
                                <Switch
                                    checked={notifications}
                                    onCheckedChange={setNotifications}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants}>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Globe className="h-5 w-5 text-muted-foreground" />
                                API Configuration
                            </CardTitle>
                            <CardDescription>
                                Configure global API settings and timeouts.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="timeout">Request Timeout (ms)</Label>
                                    <Input
                                        id="timeout"
                                        type="number"
                                        value={timeout}
                                        onChange={(e) => setTimeout(e.target.value)}
                                        min="1000"
                                        max="120000"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Maximum time to wait for API responses
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="retries">Max Retries</Label>
                                    <Input
                                        id="retries"
                                        type="number"
                                        value={retries}
                                        onChange={(e) => setRetries(e.target.value)}
                                        min="0"
                                        max="10"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Number of retry attempts on failure
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.div variants={itemVariants} className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </motion.div>
            </div>
        </motion.div>
    );
}
