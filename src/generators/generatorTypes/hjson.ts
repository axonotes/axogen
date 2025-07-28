import * as Hjson from "hjson";
import {HjsonVariableProcessor} from "../pre-processor.ts";
import type {HjsonTargetOptions} from "../../config/types";

export class HjsonGenerator {
    private processor = new HjsonVariableProcessor();

    generate(
        variables: Record<string, any>,
        options: HjsonTargetOptions = {}
    ): string {
        const processedVariables = this.processor.process(variables);
        return Hjson.stringify(processedVariables, {
            keepWsc: true,
            bracesSameLine: false,
            quotes: "strings",
            separator: false,
            space: 2,
            ...options,
        });
    }
}
