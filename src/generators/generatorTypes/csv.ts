import Papa from "papaparse";
import {CsvVariableProcessor} from "../pre-processor.ts";
import type {CsvTargetOptions} from "../../config/types";

export class CsvGenerator {
    private processor = new CsvVariableProcessor();

    generate(
        variables: Record<string, any>,
        options: CsvTargetOptions = {}
    ): string {
        const processedVariables = this.processor.process(variables);

        // Convert variables to CSV-compatible format
        const csvData = this.prepareDataForCsv(processedVariables);

        return Papa.unparse(csvData, {
            quotes: false,
            quoteChar: '"',
            escapeChar: '"',
            delimiter: ",",
            header: true,
            newline: "\n",
            skipEmptyLines: false,
            columns: undefined,
            ...options,
        });
    }

    private prepareDataForCsv(data: any): any[] {
        // If data is already an array, use it directly
        if (Array.isArray(data)) {
            return data;
        }

        // If data is an object, check if it has array properties
        if (typeof data === "object" && data !== null) {
            // Look for array properties that could be CSV rows
            for (const [key, value] of Object.entries(data)) {
                if (Array.isArray(value) && value.length > 0) {
                    // If the array contains objects, use it as CSV data
                    if (typeof value[0] === "object") {
                        return value;
                    }
                }
            }

            // If no suitable array found, convert object keys/values to CSV
            return [data];
        }

        // Fallback: wrap single value in array
        return [{value: data}];
    }
}
