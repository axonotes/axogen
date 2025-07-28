import JSON5 from "json5";
import {Json5VariableProcessor} from "../pre-processor.ts";
import type {Json5TargetOptions} from "../../config/types";

export class Json5Generator {
    private processor = new Json5VariableProcessor();

    generate(
        variables: Record<string, any>,
        options?: Json5TargetOptions
    ): string {
        const processedVariables = this.processor.process(variables);
        return JSON5.stringify(
            processedVariables,
            undefined,
            options?.space || 2
        );
    }
}
