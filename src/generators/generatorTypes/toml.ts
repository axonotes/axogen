import * as TOML from "@iarna/toml";
import {TomlVariableProcessor} from "../pre-processor.ts";

export class TomlGenerator {
    private processor = new TomlVariableProcessor();

    generate(variables: Record<string, any>): string {
        const processedVariables = this.processor.process(variables);
        return TOML.stringify(processedVariables);
    }
}
