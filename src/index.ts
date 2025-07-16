import {getVersion} from "./version.ts";

export function foo(bar: string): string {
    return `Hello, ${bar}! with version ${getVersion()}`;
}
