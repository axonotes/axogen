import {JsonVariableProcessor} from "../pre-processor.ts";
import type {JsonTargetOptions} from "../../config/types";

export class JsonGenerator {
    private processor = new JsonVariableProcessor();

    generate(
        variables: Record<string, any>,
        options?: JsonTargetOptions
    ): string {
        const processedVariables = this.processor.process(variables);
        return JSON.stringify(
            processedVariables,
            options?.replacer,
            options?.space || 2
        );
    }
}
