import {parse} from "jsonc-parser";
import * as fs from "node:fs";

export function parseJsoncFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse JSONC file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
