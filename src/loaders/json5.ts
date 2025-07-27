import JSON5 from "json5";
import * as fs from "node:fs";

export function parseJson5File(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return JSON5.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse JSON5 file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
