/**
 * Supported file types for document processing
 */
export const SUPPORTED_FILES = {
    pdf: {
        mime: "application/pdf",
        ext: [".pdf"],
        label: "PDF",
    },
    docx: {
        mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ext: [".docx"],
        label: "Word",
    },
    text: {
        mime: "text/plain",
        ext: [".txt"],
        label: "Text",
    },
    markdown: {
        mime: "text/markdown",
        ext: [".md"],
        label: "Markdown",
    },
    csv: {
        mime: "text/csv",
        ext: [".csv"],
        label: "CSV",
    },
    json: {
        mime: "application/json",
        ext: [".json"],
        label: "JSON",
    },
    code: {
        mime: "text/x-code", // General label for code files
        ext: [".js", ".ts", ".tsx", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".h", ".css", ".html"],
        label: "Code",
    },
} as const;

export type FileType = keyof typeof SUPPORTED_FILES;

/**
 * Get all supported mime types
 */
export function getSupportedMimeTypes(): string[] {
    return Object.values(SUPPORTED_FILES).map((f) => f.mime);
}

/**
 * Get all supported extensions
 */
export function getSupportedExtensions(): string[] {
    return Object.values(SUPPORTED_FILES).flatMap((f) => f.ext);
}

/**
 * Check if a file is supported based on it's type or name
 */
export function isSupportedFile(file: File): boolean {
    const mimeSupported = getSupportedMimeTypes().includes(file.type);
    if (mimeSupported) return true;

    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    return getSupportedExtensions().includes(extension);
}

/**
 * Get a dropzone-compatible "accept" object
 */
export function getDropzoneAccept() {
    const accept: Record<string, string[]> = {};

    // PDF
    accept[SUPPORTED_FILES.pdf.mime] = [...SUPPORTED_FILES.pdf.ext];

    // DOCX
    accept[SUPPORTED_FILES.docx.mime] = [...SUPPORTED_FILES.docx.ext];

    // Text based
    accept["text/plain"] = [".txt", ".md", ".csv", ...SUPPORTED_FILES.code.ext];

    // JSON
    accept["application/json"] = [".json"];

    return accept;
}
