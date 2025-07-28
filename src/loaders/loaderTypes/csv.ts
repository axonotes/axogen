import Papa from "papaparse";
import * as fs from "node:fs";

export function parseCsvFile(filePath: string): any[] {
    try {
        const fileContent = fs.readFileSync(filePath, "utf8");

        // Remove BOM if present
        const cleanContent = fileContent.replace(/^\uFEFF/, "");

        const parseConfig: Papa.ParseConfig = {
            header: true,
            skipEmptyLines: true,
            fastMode: false, // Use slower but more accurate parsing
            comments: false, // Don't treat any lines as comments
        };

        const result = Papa.parse(cleanContent, parseConfig);

        if (result.errors && result.errors.length > 0) {
            // Filter out empty row errors which are common and acceptable
            const significantErrors = result.errors.filter(
                (error: any) =>
                    !error.message.includes("Too few fields") &&
                    !error.message.includes("Empty row") &&
                    error.type !== "Quotes"
            );
            if (significantErrors.length > 0) {
                throw new Error(
                    `CSV parsing errors: ${significantErrors.map((e: any) => e.message).join(", ")}`
                );
            }
        }

        return result.data as any[];
    } catch (error) {
        throw new Error(
            `Failed to parse CSV file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
