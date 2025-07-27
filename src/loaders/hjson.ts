import Hjson from "hjson";
import * as fs from "node:fs";

export function parseHjsonFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return Hjson.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse HJSON file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
