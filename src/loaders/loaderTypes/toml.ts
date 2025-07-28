import * as TOML from "@iarna/toml";
import * as fs from "node:fs";

export function parseTomlFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return TOML.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse TOML file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
