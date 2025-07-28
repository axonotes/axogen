import {XMLParser, XMLValidator} from "fast-xml-parser";
import * as fs from "node:fs";

export function parseXmlFile(filePath: string) {
    try {
        const fileContent = fs.readFileSync(filePath, "utf-8");

        const validationResult = XMLValidator.validate(fileContent, {
            allowBooleanAttributes: true,
        });

        if (validationResult !== true) {
            throw new Error(
                `Invalid XML: ${validationResult.err.msg} at line ${validationResult.err.line}`
            );
        }

        const parser = new XMLParser({
            ignoreAttributes: false,
            attributeNamePrefix: "@_",
            parseAttributeValue: true,
            parseTagValue: true,
            trimValues: true,
            processEntities: true,
            htmlEntities: true,
            stopNodes: [],
            unpairedTags: [],
        });
        return parser.parse(fileContent);
    } catch (error) {
        throw new Error(
            `Failed to parse XML file at ${filePath}: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
}
