import * as ini from "ini";
import {IniVariableProcessor} from "../pre-processor.ts";
import type {IniTargetOptions} from "../../config/types";

export class IniGenerator {
    private processor = new IniVariableProcessor();

    generate(
        variables: Record<string, any>,
        options: IniTargetOptions = {}
    ): string {
        const processedVariables = this.processor.process(variables);
        return ini.stringify(processedVariables, {
            section: "section",
            whitespace: false,
            align: false,
            sort: false,
            ...options,
        });
    }
}
