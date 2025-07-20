export * from "./helpers";
export * from "./runner";

import {spawn} from "node:child_process";

/**
 * Executes a command-line command and returns the result.
 * @param command The command to execute.
 * @param options Additional options for the execution.
 * @returns A Promise that resolves with the command's output or rejects with an error.
 */
export function executeCommand(
    command: string,
    options: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        shell?: string;
    } = {}
): Promise<{stdout: string; stderr: string; exitCode: number}> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, {
            shell: true,
            cwd: options.cwd || process.cwd(),
            env: {...process.env, ...options.env},
            stdio: ["pipe", "pipe", "pipe"], // Capture stdout and stderr
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
            stdout += data.toString();
        });

        child.stderr.on("data", (data) => {
            stderr += data.toString();
        });

        child.on("close", (exitCode) => {
            resolve({stdout, stderr, exitCode: exitCode || 0});
        });

        child.on("error", (error) => {
            reject(error);
        });
    });
}

/**
 * Executes a command-line command and returns the result. (Alias for `executeCommand`)
 * @param command The command to execute.
 * @param options Additional options for the execution.
 * @returns A Promise that resolves with the command's output or rejects with an error.
 */
export function exec(
    command: string,
    options: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
        shell?: string;
    } = {}
): Promise<{stdout: string; stderr: string; exitCode: number}> {
    return executeCommand(command, options);
}
