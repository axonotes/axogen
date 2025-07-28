import * as yaml from "js-yaml";
import {VariableProcessor} from "../pre-processor.ts";
import type {YamlTargetOptions} from "../../config/types";

export class YamlGenerator {
    private processor = new VariableProcessor();

    generate(
        variables: Record<string, any>,
        options: YamlTargetOptions = {}
    ): string {
        const processedVariables = this.processor.process(variables);
        return yaml.dump(processedVariables, {
            indent: 2,
            lineWidth: 80,
            noRefs: false,
            sortKeys: false,
            quotingType: '"',
            forceQuotes: false,
            ...options,
        });
    }
}
