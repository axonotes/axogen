export * from "./helpers";
export * from "./runner";

import {spawn} from "node:child_process";

/**
 * Execute a shell command and capture output
 */
export function executeCommand(
    command: string,
    options: {
        cwd?: string;
        env?: NodeJS.ProcessEnv;
    } = {}
): Promise<{stdout: string; stderr: string; exitCode: number}> {
    return new Promise((resolve, reject) => {
        const child = spawn(command, {
            shell: true,
            cwd: options.cwd || process.cwd(),
            env: {...process.env, ...options.env},
            stdio: ["pipe", "pipe", "pipe"],
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

export const exec = executeCommand;
