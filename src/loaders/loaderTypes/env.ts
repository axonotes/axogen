import * as fs from "node:fs";
import {parse} from "@dotenvx/dotenvx";

export function parseEnvFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse ENV file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
