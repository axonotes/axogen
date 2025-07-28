import * as CSON from "cson";
import {CsonVariableProcessor} from "../pre-processor.ts";

export class CsonGenerator {
    private processor = new CsonVariableProcessor();

    generate(variables: Record<string, any>): string {
        const processedVariables = this.processor.process(variables);

        return CSON.stringify(processedVariables, {
            indent: "  ",
        });
    }
}
