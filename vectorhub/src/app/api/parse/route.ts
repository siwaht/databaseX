import { NextResponse } from "next/server";

export const runtime = 'edge';

const isEdge = typeof process === 'undefined' || process.env.NEXT_RUNTIME === 'edge';

export async function POST(request: Request) {
    try {
        if (isEdge) {
            // For now, return a informative error or implement a Web-standard alternative
            return NextResponse.json(
                { error: "PDF and DOCX parsing is currently only supported in Node.js environments. Please use local development or a Node.js-compatible backend." },
                { status: 501 }
            );
        }

        // Dynamically import libraries to avoid build-time resolution issues
        // @ts-ignore
        const pdfParse = (await import("pdf-parse")).default;
        // @ts-ignore
        const mammoth = (await import("mammoth"));

        const formData = await request.formData();
        const file = formData.get("file") as File;

        if (!file) {
            return NextResponse.json(
                { error: "No file provided" },
                { status: 400 }
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        let text = "";
        let metadata = {};

        if (file.type === "application/pdf") {
            const data = await pdfParse(buffer);
            text = data.text;
            metadata = {
                info: data.info,
                metadata: data.metadata,
                version: data.version,
                numpages: data.numpages,
            };
        } else if (
            file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
            file.name.endsWith(".docx")
        ) {
            const result = await mammoth.extractRawText({ buffer });
            text = result.value;
            if (result.messages && result.messages.length > 0) {
                console.warn("Mammoth messages:", result.messages);
            }
        } else if (
            file.type === "text/plain" ||
            file.type === "text/markdown" ||
            file.type === "text/csv" ||
            file.name.endsWith(".txt") ||
            file.name.endsWith(".md") ||
            file.name.endsWith(".csv") ||
            file.name.endsWith(".js") ||
            file.name.endsWith(".ts") ||
            file.name.endsWith(".tsx") ||
            file.name.endsWith(".py") ||
            file.name.endsWith(".json")
        ) {
            // Handle as plain text
            text = buffer.toString("utf-8");

            // Basic JSON check to pretty print or validate if needed
            if (file.type === "application/json" || file.name.endsWith(".json")) {
                try {
                    const jsonObj = JSON.parse(text);
                    text = JSON.stringify(jsonObj, null, 2);
                } catch (e) {
                    console.warn("Failed to format JSON:", e);
                }
            }
        } else {
            return NextResponse.json(
                { error: `Invalid file type: ${file.type}. Only PDF, DOCX, TXT, MD, CSV, JSON and Code files are supported.` },
                { status: 400 }
            );
        }

        return NextResponse.json({
            text,
            ...metadata,
        });
    } catch (error) {
        console.error("File parsing error:", error);
        return NextResponse.json(
            { error: "Failed to parse file" },
            { status: 500 }
        );
    }
}
