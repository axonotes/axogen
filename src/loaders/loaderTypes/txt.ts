import * as fs from "node:fs";
import * as z from "zod";

export const txtSchema = z.object({
    content: z.string(),
});

export function parseTxtFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return {content: fileContent};
    } catch (error) {
        throw new Error(
            `Failed to parse TXT file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
