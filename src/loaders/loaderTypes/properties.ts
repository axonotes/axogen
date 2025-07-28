import {Properties} from "properties-file";
import * as fs from "node:fs";

export function parsePropertiesFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const properties = new Properties(fileContent);
        return properties.collection.reduce(
            (acc, prop) => {
                acc[prop.key] = prop.value;
                return acc;
            },
            {} as Record<string, string>
        );
    } catch (error) {
        throw new Error(
            `Failed to parse Properties file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
