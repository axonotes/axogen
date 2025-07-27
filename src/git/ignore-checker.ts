import {execSync} from "child_process";

class GitIgnoreChecker {
    private static instance: GitIgnoreChecker | null = null;
    isInGitRepo: boolean;

    private constructor() {
        // Check once if we're in a git repository
        try {
            execSync("git rev-parse --git-dir", {stdio: "ignore"});
            this.isInGitRepo = true;
        } catch {
            throw new Error(
                "Not in a git repository. Please run this command from within a git repository."
            );
        }
    }

    static getInstance(): GitIgnoreChecker {
        if (!GitIgnoreChecker.instance) {
            GitIgnoreChecker.instance = new GitIgnoreChecker();
        }
        return GitIgnoreChecker.instance;
    }

    /**
     * Check if a file is ignored by git
     * @param filePath - Path to the file to check
     * @returns true if ignored, false if not ignored
     */
    isIgnored(filePath: string): boolean {
        if (!this.isInGitRepo) {
            throw new Error(
                "Not in a git repository. Please run this command from within a git repository."
            );
        }

        try {
            execSync(`git check-ignore "${filePath}"`, {stdio: "ignore"});
            return true; // Exit code 0 = ignored
        } catch {
            return false; // Exit code 1 = not ignored
        }
    }
}

/**
 * Check if a file is ignored by git
 * @param filePath - Path to the file to check
 * @returns true if ignored, false if not ignored
 * @throws Error if not in a git repository
 */
export function isGitIgnored(filePath: string): boolean {
    const checker = GitIgnoreChecker.getInstance();
    return checker.isIgnored(filePath);
}

// Usage:
// console.log(isGitIgnored('dist/index.js'))     // true
// console.log(isGitIgnored('src/cli.ts'))        // false
// console.log(isGitIgnored('node_modules'))      // true
//
// If not in git repo, throws on first call:
// Error: Not in a git repository. Please run this command from within a git repository.
