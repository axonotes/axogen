import CSON from "cson";
import * as fs from "node:fs";

export function parseCsonFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return CSON.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse CSON file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
