export interface FirecrawlScrapeResponse {
    success: boolean;
    data?: {
        content: string;
        metadata?: Record<string, any>;
    };
    error?: string;
}

export class FirecrawlClient {
    private apiKey: string;
    private baseUrl = "https://api.firecrawl.dev/v0";

    constructor(apiKey?: string) {
        this.apiKey = apiKey || process.env.FIRECRAWL_API_KEY || "";
        // Debug logging
        if (!this.apiKey) {
            console.warn("FirecrawlClient: API key is missing. Checked process.env.FIRECRAWL_API_KEY");
        } else {
            console.log("FirecrawlClient: API key initialized successfully");
        }
    }

    async scrapeUrl(url: string): Promise<FirecrawlScrapeResponse> {
        if (!this.apiKey) {
            return {
                success: false,
                error: "FIRECRAWL_API_KEY is not set",
            };
        }

        try {
            const response = await fetch(`${this.baseUrl}/scrape`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify({
                    url,
                    pageOptions: {
                        onlyMainContent: true,
                    },
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error || `Request failed with status ${response.status}`,
                };
            }

            const data = await response.json();

            if (!data.success) {
                return {
                    success: false,
                    error: data.error || "Unknown error from Firecrawl",
                };
            }

            return {
                success: true,
                data: {
                    content: data.data.markdown || data.data.content,
                    metadata: data.data.metadata,
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Failed to connect to Firecrawl",
            };
        }
    }
}

export const firecrawl = new FirecrawlClient();
