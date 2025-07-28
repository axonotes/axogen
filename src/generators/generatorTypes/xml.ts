import {XMLBuilder} from "fast-xml-parser";
import {XmlVariableProcessor} from "../pre-processor.ts";
import type {XmlTargetOptions} from "../../config/types";

export class XmlGenerator {
    private processor = new XmlVariableProcessor();

    generate(
        variables: Record<string, any>,
        options: XmlTargetOptions = {}
    ): string {
        const processedVariables = this.processor.process(variables);

        const builder = new XMLBuilder({
            ignoreAttributes: false,
            format: true,
            indentBy: "  ",
            suppressEmptyNode: false,
            suppressBooleanAttributes: false,
            suppressUnpairedNode: false,
            textNodeName: "#text",
            attributeNamePrefix: "@_",
            ...options,
        });

        // Wrap the data in a root element if not already wrapped
        const dataToConvert = this.ensureRootElement(processedVariables);

        return builder.build(dataToConvert);
    }

    private ensureRootElement(data: any, rootElement?: string): any {
        // If data is already wrapped in a single root object, use it
        if (typeof data === "object" && !Array.isArray(data)) {
            const keys = Object.keys(data);
            if (keys.length === 1 && !rootElement) {
                return data;
            }
        }

        // Otherwise, wrap in specified root element or default
        const root = rootElement || "root";
        return {[root]: data};
    }
}
