import ini from "ini";
import * as fs from "node:fs";

export function parseIniFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return ini.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse INI file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
