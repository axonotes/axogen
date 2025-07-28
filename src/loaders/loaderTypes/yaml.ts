import * as yaml from "js-yaml";
import * as fs from "node:fs";

export function parseYamlFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        return yaml.load(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse YAML file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
