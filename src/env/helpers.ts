import {exec} from "child_process";
import * as os from "os";
import * as path from "path";
import * as fs from "fs/promises";

function promisifyExec(command: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(command, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

export async function setPersistentEnvVariable(
    key: string,
    value: string
): Promise<void> {
    const platform = os.platform();

    switch (platform) {
        case "win32":
            await setWindowsPersistent(key, value);
            break;
        case "darwin":
        case "linux":
            await setUnixPersistent(key, value);
            break;
        default:
            throw new Error(
                `Cant set environment variable. Unsupported platform: ${platform}`
            );
    }

    // Also set for current process
    process.env[key] = value;
}

async function setWindowsPersistent(key: string, value: string): Promise<void> {
    try {
        // Set for current user
        await promisifyExec(`setx ${key} "${value}"`);
    } catch (error) {
        console.error(
            `Failed to set ${key} persistently for Windows user:`,
            error
        );
        throw new Error(`Failed to set environment variable ${key} on Windows`);
    }
}

async function setUnixPersistent(key: string, value: string): Promise<void> {
    const homeDir = os.homedir();
    const shell = process.env.SHELL || "/bin/bash";

    // Determine which profile file to update based on shell
    let profileFiles: string[];

    if (shell.includes("zsh")) {
        profileFiles = [".zshrc", ".zprofile"];
    } else if (shell.includes("bash")) {
        profileFiles = [".bashrc", ".bash_profile", ".profile"];
    } else if (shell.includes("fish")) {
        profileFiles = [".config/fish/config.fish"];
    } else {
        // Default fallback
        profileFiles = [".profile"];
    }

    const exportLine = `export ${key}="${value}"`;

    for (const profileFile of profileFiles) {
        const filePath = path.join(homeDir, profileFile);

        try {
            // Check if file exists
            await fs.access(filePath);

            // Read current content
            const content = await fs.readFile(filePath, "utf-8");

            // Check if variable already exists
            const regex = new RegExp(`^export ${key}=.*$`, "m");

            if (regex.test(content)) {
                // Replace existing
                const newContent = content.replace(regex, exportLine);
                await fs.writeFile(filePath, newContent);
            } else {
                // Append new
                await fs.appendFile(filePath, `\n${exportLine}\n`);
            }

            console.log(
                `---> Run 'source ~/${profileFile}' to apply changes or restart your terminal.`
            );
            break; // Only update the first existing profile file
        } catch (error) {
            // File doesn't exist or can't be accessed, try next one
        }
    }
}
