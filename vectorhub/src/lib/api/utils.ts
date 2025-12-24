import { ConnectionConfig } from "@/types/connections";

// ============================================================================
// API Error Handling
// ============================================================================

export interface ApiErrorResponse {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

export class ApiError extends Error {
    code: string;
    statusCode: number;
    details?: Record<string, string[]>;

    constructor(response: ApiErrorResponse, statusCode: number) {
        super(response.message);
        this.name = "ApiError";
        this.code = response.code;
        this.statusCode = statusCode;
        this.details = response.details;
    }
}

/**
 * Shared response handler for API calls
 */
export async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        let errorData: ApiErrorResponse;
        try {
            errorData = await response.json();
        } catch {
            errorData = {
                code: "UNKNOWN_ERROR",
                message: `Request failed with status ${response.status}`,
            };
        }
        throw new ApiError(errorData, response.status);
    }
    return response.json();
}

/**
 * Helper to add connection config to headers
 */
export const getHeaders = (config?: ConnectionConfig): Record<string, string> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (config) {
        headers["x-connection-config"] = JSON.stringify(config);
    }
    return headers;
};
