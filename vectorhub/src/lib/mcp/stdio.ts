import { spawn, ChildProcess } from "child_process";
import { logger } from "@/lib/logger";

interface McpRequest {
    jsonrpc: "2.0";
    id: number;
    method: string;
    params?: any;
}

interface McpResponse {
    jsonrpc: "2.0";
    id: number;
    result?: any;
    error?: {
        code: number;
        message: string;
        data?: any;
    };
}

export class OneShotMcpClient {
    private process: ChildProcess | null = null;
    private requestId = 0;
    private pendingRequests = new Map<number, { resolve: (val: any) => void; reject: (err: Error) => void }>();
    private isInitialized = false;

    constructor(
        private command: string,
        private args: string[],
        private env: Record<string, string> = {}
    ) { }

    private async start() {
        if (this.process) return;

        logger.info(`Spawning MCP process: ${this.command} ${this.args.join(" ")}`);

        this.process = spawn(this.command, this.args, {
            env: { ...process.env, ...this.env },
            stdio: ["pipe", "pipe", "pipe"],
        });

        this.process.stdout?.on("data", (data) => {
            const lines = data.toString().split("\n");
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const response = JSON.parse(line) as McpResponse;
                    if (response.id !== undefined && this.pendingRequests.has(response.id)) {
                        const { resolve, reject } = this.pendingRequests.get(response.id)!;
                        this.pendingRequests.delete(response.id);
                        if (response.error) {
                            reject(new Error(response.error.message));
                        } else {
                            resolve(response.result);
                        }
                    }
                } catch (e) {
                    // Ignore non-JSON output (logs, etc.)
                }
            }
        });

        this.process.stderr?.on("data", (data) => {
            logger.warn(`MCP Stderr: ${data.toString()}`);
        });

        this.process.on("error", (err) => {
            logger.error(`MCP process error: ${err.message}`);
            this.kill();
        });

        this.process.on("exit", (code) => {
            if (code !== 0 && code !== null) {
                logger.warn(`MCP process exited with code ${code}`);
            }
            this.process = null;
        });
    }

    private async send<T>(method: string, params?: any): Promise<T> {
        if (!this.process) await this.start();

        return new Promise((resolve, reject) => {
            const id = ++this.requestId;
            const request: McpRequest = {
                jsonrpc: "2.0",
                id,
                method,
                params,
            };

            this.pendingRequests.set(id, { resolve, reject });

            try {
                this.process?.stdin?.write(JSON.stringify(request) + "\n");
            } catch (error) {
                this.pendingRequests.delete(id);
                reject(error instanceof Error ? error : new Error("Failed to write to stdin"));
            }

            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error("RPC Request timed out"));
                }
            }, 30000);
        });
    }

    async init() {
        if (this.isInitialized) return;
        await this.send("initialize", {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: {
                name: "VectorHub",
                version: "1.0.0",
            },
        });
        await this.send("notifications/initialized");
        this.isInitialized = true;
    }

    async listTools(): Promise<{ name: string; description?: string; inputSchema?: any }[]> {
        await this.init();
        const res = await this.send<{ tools: any[] }>("tools/list");
        return res.tools || [];
    }

    async callTool(name: string, args: any): Promise<any> {
        await this.init();
        const res = await this.send<{ content: any[] }>("tools/call", {
            name,
            arguments: args,
        });
        return res;
    }

    kill() {
        if (this.process) {
            this.process.kill();
            this.process = null;
        }
    }
}
