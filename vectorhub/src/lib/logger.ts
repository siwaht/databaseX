type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    context?: Record<string, unknown>;
    error?: {
        name: string;
        message: string;
        stack?: string;
    };
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

// Get minimum log level from environment
const MIN_LOG_LEVEL: LogLevel =
    (process.env.LOG_LEVEL as LogLevel) ||
    (process.env.NODE_ENV === "production" ? "info" : "debug");

function shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[MIN_LOG_LEVEL];
}

function formatLog(entry: LogEntry): string {
    if (process.env.NODE_ENV === "production") {
        // JSON format for production (easier to parse in log aggregators)
        return JSON.stringify(entry);
    }

    // Pretty format for development
    const { timestamp, level, message, context, error } = entry;
    const levelColors: Record<LogLevel, string> = {
        debug: "\x1b[90m",
        info: "\x1b[36m",
        warn: "\x1b[33m",
        error: "\x1b[31m",
    };
    const reset = "\x1b[0m";
    const color = levelColors[level];

    let output = `${timestamp} ${color}[${level.toUpperCase()}]${reset} ${message}`;

    if (context && Object.keys(context).length > 0) {
        output += `\n  Context: ${JSON.stringify(context, null, 2)}`;
    }

    if (error) {
        output += `\n  Error: ${error.name}: ${error.message}`;
        if (error.stack) {
            output += `\n  Stack: ${error.stack}`;
        }
    }

    return output;
}

function createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error
): LogEntry {
    const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
    };

    if (error) {
        entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
    }

    return entry;
}

export const logger = {
    debug(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog("debug")) return;
        const entry = createLogEntry("debug", message, context);
        console.debug(formatLog(entry));
    },

    info(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog("info")) return;
        const entry = createLogEntry("info", message, context);
        console.info(formatLog(entry));
    },

    warn(message: string, context?: Record<string, unknown>): void {
        if (!shouldLog("warn")) return;
        const entry = createLogEntry("warn", message, context);
        console.warn(formatLog(entry));
    },

    error(
        message: string,
        error?: Error | unknown,
        context?: Record<string, unknown>
    ): void {
        if (!shouldLog("error")) return;
        const err = error instanceof Error ? error : undefined;
        const entry = createLogEntry("error", message, context, err);
        console.error(formatLog(entry));
    },

    // Helper for timing operations
    time(label: string): () => void {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.debug(`${label} completed`, { durationMs: duration.toFixed(2) });
        };
    },
};

export type Logger = typeof logger;

