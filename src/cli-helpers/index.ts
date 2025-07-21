export * from "./helpers";
export * from "./runner";

import {spawn, ChildProcess} from "node:child_process";
import {EventEmitter} from "node:events";
import {pretty} from "../utils/pretty";

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

export interface LiveExecOptions {
    cwd?: string;
    env?: NodeJS.ProcessEnv;
    /** Prefix for live output lines */
    outputPrefix?: string;
    /** Whether this command needs interactive input (default: auto-detect) */
    interactive?: boolean;
}

export interface LiveExecResult {
    exitCode: number;
    /** Whether the command was terminated by user action */
    wasTerminated: boolean;
}

/**
 * Auto-detect if a command is likely to be interactive
 */
function isInteractiveCommand(command: string): boolean {
    const interactiveKeywords = [
        "dev",
        "serve",
        "start",
        "watch",
        "server",
        "daemon",
        "tail",
        "logs",
        "monitor",
        "repl",
        "shell",
        "bash",
        "zsh",
    ];

    return interactiveKeywords.some((keyword) =>
        command.toLowerCase().includes(keyword)
    );
}

/**
 * Execute a shell command with live input/output streaming
 */
export function liveExec(
    command: string,
    options: LiveExecOptions = {}
): Promise<LiveExecResult> {
    const {
        cwd = process.cwd(),
        env = {},
        outputPrefix = "",
        interactive = isInteractiveCommand(command),
    } = options;

    return new Promise((resolve, reject) => {
        let wasTerminated = false;
        let isCleaningUp = false;
        let originalSigintListeners: NodeJS.SignalsListener[] = [];

        console.log(`${pretty.text.info("🚀 Running:")} ${command}`);

        // Spawn child process in its own process group for proper termination
        const child = spawn(command, {
            shell: true,
            cwd,
            env: {...process.env, ...env},
            stdio: ["pipe", "pipe", "pipe"],
            detached: true, // Create new process group
        });

        // Setup signal handling - always intercept SIGINT in live mode
        originalSigintListeners = process.listeners(
            "SIGINT"
        ) as NodeJS.SignalsListener[];
        process.removeAllListeners("SIGINT");

        const sigintHandler = () => {
            if (isCleaningUp) return;
            wasTerminated = true;
            cleanup();
        };
        process.on("SIGINT", sigintHandler);

        // Pipe child stdout to parent stdout with optional prefix
        child.stdout.on("data", (data) => {
            const output = data.toString();
            if (outputPrefix) {
                const lines = output.split("\n");
                const prefixedOutput = lines
                    .map((line: any) =>
                        line
                            ? `${pretty.prefix.command(outputPrefix)}${line}`
                            : line
                    )
                    .join("\n");
                process.stdout.write(prefixedOutput);
            } else {
                process.stdout.write(output);
            }
        });

        // Pipe child stderr to parent stderr with optional prefix
        child.stderr.on("data", (data) => {
            const output = data.toString();
            if (outputPrefix) {
                const lines = output.split("\n");
                const prefixedOutput = lines
                    .map((line: any) =>
                        line
                            ? `${pretty.prefix.command(outputPrefix)}${line}`
                            : line
                    )
                    .join("\n");
                process.stderr.write(prefixedOutput);
            } else {
                process.stderr.write(output);
            }
        });

        // Setup stdin forwarding only for interactive commands
        let inputHandler: ((data: Buffer) => void) | null = null;
        if (interactive && process.stdin.isTTY) {
            inputHandler = (data: Buffer) => {
                if (child.stdin && !child.stdin.destroyed) {
                    child.stdin.write(data);
                }
            };
            process.stdin.on("data", inputHandler);
        }

        // Cleanup function
        const cleanup = () => {
            if (isCleaningUp) return;
            isCleaningUp = true;

            // Kill child process and its entire process group
            if (child.pid && !child.killed) {
                try {
                    // Kill the entire process group
                    process.kill(-child.pid, "SIGTERM");

                    // If it doesn't die quickly, force kill it
                    setTimeout(() => {
                        if (!child.killed) {
                            try {
                                process.kill(-child.pid!, "SIGKILL");
                            } catch (e) {
                                // Process already dead, ignore
                            }
                        }
                    }, 1000);
                } catch (e) {
                    // Process already dead or not accessible, ignore
                }
            }

            // Clean up stdin listener
            if (inputHandler) {
                process.stdin.removeListener("data", inputHandler);
            }

            // Close child stdin if still open
            if (child.stdin && !child.stdin.destroyed) {
                child.stdin.end();
            }

            // Restore original SIGINT listeners
            process.removeAllListeners("SIGINT");
            originalSigintListeners.forEach((listener) => {
                process.on("SIGINT", listener);
            });
        };

        child.on("close", (exitCode) => {
            if (isCleaningUp) return;

            cleanup();

            if (wasTerminated) {
                pretty.stop(`Stopped: ${command}`);
            } else {
                if (exitCode === 0) {
                    pretty.success(`Completed: ${command}`);
                } else {
                    pretty.error(`Failed: ${command} (exit code: ${exitCode})`);
                }
            }

            resolve({
                exitCode: exitCode || 0,
                wasTerminated,
            });
        });

        child.on("error", (error) => {
            cleanup();
            pretty.error(`Error: ${command}`);
            reject(error);
        });

        // Handle child process being killed
        child.on("exit", (code, signal) => {
            if (signal && signal !== "SIGTERM" && signal !== "SIGKILL") {
                wasTerminated = true;
            }
        });

        // Handle uncaught exceptions and process exits
        const processExitHandler = () => {
            cleanup();
        };

        process.once("exit", processExitHandler);
        process.once("SIGTERM", processExitHandler);
        process.once("uncaughtException", processExitHandler);
    });
}

/**
 * Interactive shell that maintains state across commands
 */
export class InteractiveShell extends EventEmitter {
    private currentProcess: ChildProcess | null = null;
    private isLive = false;

    async execute(
        command: string,
        live = false
    ): Promise<
        LiveExecResult | {stdout: string; stderr: string; exitCode: number}
    > {
        if (live) {
            return this.executeLive(command);
        } else {
            return executeCommand(command);
        }
    }

    async executeLive(
        command: string,
        options?: LiveExecOptions
    ): Promise<LiveExecResult> {
        this.isLive = true;
        this.emit("liveStart", command);

        try {
            const result = await liveExec(command, options);
            this.emit("liveEnd", result);
            return result;
        } finally {
            this.isLive = false;
        }
    }

    isInLiveMode(): boolean {
        return this.isLive;
    }

    getCurrentProcess(): ChildProcess | null {
        return this.currentProcess;
    }
}

export const exec = executeCommand;
