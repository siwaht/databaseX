import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Outfit } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const outfit = Outfit({
    subsets: ["latin"],
    variable: "--font-sans",
    display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
    subsets: ["latin"],
    variable: "--font-mono",
    display: "swap",
});

export const metadata: Metadata = {
    title: {
        default: "VectorHub",
        template: "%s | VectorHub",
    },
    description: "Universal Vector Database & Integration Manager - Manage, search, and analyze your vector databases with ease.",
    keywords: ["vector database", "embeddings", "semantic search", "AI", "machine learning"],
    authors: [{ name: "VectorHub Team" }],
    creator: "VectorHub",
};

export const viewport: Viewport = {
    themeColor: [
        { media: "(prefers-color-scheme: light)", color: "#fafafa" },
        { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    ],
    width: "device-width",
    initialScale: 1,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body
                className={cn(
                    "min-h-screen bg-background font-sans antialiased",
                    outfit.variable,
                    jetbrainsMono.variable
                )}
            >
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    {children}
                    <Toaster position="bottom-right" richColors closeButton />
                </ThemeProvider>
            </body>
        </html>
    );
}
