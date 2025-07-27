/**
 * Research-based secret detection
 */

export interface SecretDetectionResult {
    isSecret: boolean;
    reason: string;
    confidence: "low" | "medium" | "high";
    category?: string;
}

export function isPotentiallyASecret(
    key: string,
    value: any
): SecretDetectionResult {
    // Handle non-string or empty values
    if (typeof value !== "string" || !value.trim()) {
        return {
            isSecret: false,
            reason: "Empty or non-string value",
            confidence: "high",
        };
    }

    const trimmedValue = value.trim();
    const lowerKey = key.toLowerCase();

    // 1. IMMEDIATE EXCLUSIONS
    const obviouslyNotSecrets = [
        // Booleans and common values
        /^(true|false|null|undefined)$/i,
        /^(yes|no|on|off|enabled?|disabled?)$/i,
        /^\d{1,5}$/, // Simple numbers

        // Network/URLs - major source of false positives
        /^localhost$/i,
        /^(127\.0\.0\.1|0\.0\.0\.0|::1)$/i,
        /^https?:\/\//,
        /^ftp:\/\//,
        /\.(com|org|net|edu|gov|io|co\.uk)$/i,

        // File paths and system patterns
        /^\/[a-zA-Z0-9\/_-]*$/,
        /^[a-zA-Z]:[\\\/]/, // Windows paths
        /^~\/[a-zA-Z0-9\/_-]*$/, // Unix home paths

        // HTTP and common values
        /^(GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)$/i,
        /^(development|production|staging|test|dev|prod|local)$/i,
        /^(debug|info|warn|error|fatal|trace)$/i,

        // Common patterns that aren't secrets
        /^[a-zA-Z0-9]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email addresses
        /^\d{4}-\d{2}-\d{2}$/, // Dates
        /^v?\d+\.\d+\.\d+/, // Version numbers

        // Database/SQL - major false positive source
        /^(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i,

        // CSS/HTML/JS patterns
        /^#[0-9a-fA-F]{3,6}$/, // Hex colors
        /^rgb\(/,
        /^[a-zA-Z-]+:\s*[^;]+;?$/, // CSS properties

        // Common placeholder values
        /^(test|demo|sample|example|placeholder)/i,
        /^(foo|bar|baz|qux)/i,
        /^(lorem|ipsum)/i,
    ];

    for (const pattern of obviouslyNotSecrets) {
        if (pattern.test(trimmedValue)) {
            return {
                isSecret: false,
                reason: "Matches common non-secret pattern",
                confidence: "high",
            };
        }
    }

    // 2. KNOWN SECRET PATTERNS
    const knownSecretPatterns = [
        // AWS
        {
            pattern: /^AKIA[0-9A-Z]{16}$/,
            type: "AWS Access Key ID",
            confidence: "high" as const,
        },
        {
            pattern: /^[A-Za-z0-9/+=]{40}$/,
            type: "AWS Secret Access Key",
            confidence: "medium" as const,
        },
        {
            pattern: /^aws_[a-zA-Z0-9+/=]{40,}$/,
            type: "AWS Token",
            confidence: "high" as const,
        },

        // GitHub
        {
            pattern: /^ghp_[A-Za-z0-9]{36}$/,
            type: "GitHub Personal Access Token",
            confidence: "high" as const,
        },
        {
            pattern: /^gho_[A-Za-z0-9]{36}$/,
            type: "GitHub OAuth Token",
            confidence: "high" as const,
        },
        {
            pattern: /^ghu_[A-Za-z0-9]{36}$/,
            type: "GitHub User Token",
            confidence: "high" as const,
        },
        {
            pattern: /^ghs_[A-Za-z0-9]{36}$/,
            type: "GitHub Server Token",
            confidence: "high" as const,
        },
        {
            pattern: /^ghr_[A-Za-z0-9]{36}$/,
            type: "GitHub Refresh Token",
            confidence: "high" as const,
        },
        {
            pattern: /^github_pat_[A-Za-z0-9_]{82}$/,
            type: "GitHub Fine-grained PAT",
            confidence: "high" as const,
        },

        // Stripe
        {
            pattern: /^sk_(test_|live_)[0-9a-zA-Z]{24,}$/,
            type: "Stripe Secret Key",
            confidence: "high" as const,
        },
        {
            pattern: /^pk_(test_|live_)[0-9a-zA-Z]{24,}$/,
            type: "Stripe Publishable Key",
            confidence: "medium" as const,
        },
        {
            pattern: /^rk_(test_|live_)[0-9a-zA-Z]{24,}$/,
            type: "Stripe Restricted Key",
            confidence: "high" as const,
        },

        // JWT
        {
            pattern: /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,
            type: "JWT Token",
            confidence: "medium" as const,
        },

        // Slack
        {
            pattern: /^xoxb-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{24}$/,
            type: "Slack Bot Token",
            confidence: "high" as const,
        },
        {
            pattern:
                /^xoxp-[0-9]{10,13}-[0-9]{10,13}-[0-9]{10,13}-[A-Za-z0-9]{32}$/,
            type: "Slack User Token",
            confidence: "high" as const,
        },

        // Discord
        {
            pattern:
                /^[MNO][A-Za-z0-9]{23}\.[A-Za-z0-9]{6}\.[A-Za-z0-9_-]{27}$/,
            type: "Discord Bot Token",
            confidence: "high" as const,
        },

        // Google
        {
            pattern: /^AIza[0-9A-Za-z_-]{35}$/,
            type: "Google API Key",
            confidence: "high" as const,
        },

        // Private Keys
        {
            pattern:
                /-----BEGIN[\s\S]*PRIVATE KEY[\s\S]*-----END[\s\S]*PRIVATE KEY-----/,
            type: "Private Key",
            confidence: "high" as const,
        },

        // Database URLs
        {
            pattern: /^(mongodb|mysql|postgresql|redis):\/\/[^\s]+$/,
            type: "Database Connection String",
            confidence: "high" as const,
        },

        // Generic but high-confidence patterns
        {
            pattern: /^[0-9a-fA-F]{32,128}$/,
            type: "Long Hexadecimal String",
            confidence: "medium" as const,
        },
    ];

    for (const {pattern, type, confidence} of knownSecretPatterns) {
        if (pattern.test(trimmedValue)) {
            return {
                isSecret: true,
                reason: `Matches ${type} pattern`,
                confidence,
                category: type,
            };
        }
    }

    // 3. SECRET CONTEXT KEYWORDS
    const secretKeywords = [
        // High confidence keywords
        "password",
        "passwd",
        "pwd",
        "passphrase",
        "secret",
        "private_key",
        "privatekey",
        "api_key",
        "apikey",
        "api_secret",
        "apisecret",
        "access_token",
        "accesstoken",
        "auth_token",
        "authtoken",
        "bearer_token",
        "client_secret",
        "clientsecret",

        // Medium confidence keywords
        "key",
        "token",
        "auth",
        "credential",
        "cred",
        "authorization",
        "refresh_token",
        "session_key",
        "encryption_key",
        "signature",

        // Database specific
        "db_password",
        "database_password",
        "mysql_password",
        "postgres_password",
        "connection_string",
        "dsn",

        // Certificate specific
        "cert",
        "certificate",
        "pem",
        "p12",
        "pfx",
        "keystore",
    ];

    const hasSecretKeyword = secretKeywords.some((keyword) =>
        lowerKey.includes(keyword)
    );

    // 4. ENTROPY ANALYSIS
    function calculateImprovedEntropy(str: string): number {
        if (!str) return 0;

        const cleanStr = str
            .replace(/([a-zA-Z])\1{4,}/g, "$1$1$1") // Only remove 4+ repeated chars, keep some
            .replace(/12345678/g, "") // Only remove longer sequential numbers
            .replace(/abcdefgh/gi, "") // Keep shorter sequences
            .replace(/qwerty/gi, ""); // Remove keyboard patterns

        if (cleanStr.length < 4) return 0;

        const freq: {[char: string]: number} = {};
        for (const char of cleanStr) {
            freq[char] = (freq[char] || 0) + 1;
        }

        let entropy = 0;
        const length = cleanStr.length;

        for (const count of Object.values(freq)) {
            const probability = count / length;
            entropy -= probability * Math.log2(probability);
        }

        return entropy;
    }

    const entropy = calculateImprovedEntropy(trimmedValue);
    const length = trimmedValue.length;

    // 5. SMART DETECTION RULES - Reduced false positives

    // Rule 1: High-confidence secret keywords + reasonable value
    if (hasSecretKeyword && length >= 8) {
        // Additional validation for known false positives
        if (
            trimmedValue.includes("test") ||
            trimmedValue.includes("example") ||
            trimmedValue.includes("demo") ||
            trimmedValue.includes("placeholder")
        ) {
            return {
                isSecret: false,
                reason: "Contains test/demo/example keywords",
                confidence: "medium",
            };
        }

        return {
            isSecret: true,
            reason: `Secret keyword '${key}' with ${length}-char value`,
            confidence: "high",
            category: "Keyword-based detection",
        };
    }

    // Rule 2: Improved entropy thresholds
    let entropyThreshold = 3.8;
    if (length >= 32) entropyThreshold = 4.2;
    if (length >= 64) entropyThreshold = 4.7;

    if (entropy >= entropyThreshold && length >= 12) {
        // Additional checks to reduce false positives
        const hasNumbers = /\d/.test(trimmedValue);
        const hasLowerCase = /[a-z]/.test(trimmedValue);
        const hasUpperCase = /[A-Z]/.test(trimmedValue);
        const hasSpecialChars = /[^a-zA-Z0-9]/.test(trimmedValue);

        const complexityScore = [
            hasNumbers,
            hasLowerCase,
            hasUpperCase,
            hasSpecialChars,
        ].filter(Boolean).length;

        if (complexityScore >= 2) {
            return {
                isSecret: true,
                reason: `High entropy (${entropy.toFixed(2)}) with character complexity in ${length}-char string`,
                confidence: "medium",
                category: "Entropy-based detection",
            };
        }
    }

    // Rule 3: Long alphanumeric strings
    if (
        length >= 24 &&
        /^[A-Za-z0-9_+=/-]+$/.test(trimmedValue) &&
        !/\s/.test(trimmedValue)
    ) {
        // Lowered from 32
        // Only exclude obvious hashes with very specific patterns
        if (
            /^[0-9a-f]+$/i.test(trimmedValue) &&
            length === 32 &&
            !hasSecretKeyword
        ) {
            // Likely MD5 hash, but still flag if it has secret keyword
            return {
                isSecret: false,
                reason: "Likely MD5 hash without secret context",
                confidence: "medium",
            };
        }

        return {
            isSecret: true,
            reason: `Long (${length} chars) alphanumeric string`,
            confidence: "low",
            category: "Pattern-based detection",
        };
    }

    // Rule 4: Hex strings
    if (length >= 32 && /^[0-9a-fA-F]+$/.test(trimmedValue)) {
        // Common hash lengths: 32 (MD5), 40 (SHA1), 64 (SHA256), etc.
        const commonHashLengths = [32, 40, 56, 64, 96, 128];
        if (commonHashLengths.includes(length)) {
            return {
                isSecret: true,
                reason: `${length}-character hexadecimal string (likely hash or key)`,
                confidence: "medium",
                category: "Hash detection",
            };
        }
    }

    // Rule 5: Base64-like strings
    if (
        length >= 20 &&
        length % 4 === 0 &&
        /^[A-Za-z0-9+/]*={0,2}$/.test(trimmedValue)
    ) {
        // Check if it's actually base64 encoded data
        try {
            const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
            if (base64Regex.test(trimmedValue) && entropy >= 3.5) {
                return {
                    isSecret: true,
                    reason: `${length}-character base64-like string with high entropy`,
                    confidence: "medium",
                    category: "Base64 detection",
                };
            }
        } catch {
            // Fallback: treat as potential secret if it looks like base64
            if (entropy >= 3.5) {
                return {
                    isSecret: true,
                    reason: `${length}-character base64-like string with high entropy`,
                    confidence: "medium",
                    category: "Base64 detection",
                };
            }
        }
    }

    // Rule 6: UUID-like but extended (custom tokens)
    if (
        /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}[0-9a-fA-F]+$/.test(
            trimmedValue
        )
    ) {
        return {
            isSecret: true,
            reason: "UUID-like format with extra characters (custom token)",
            confidence: "medium",
            category: "Token detection",
        };
    }

    // Rule 7: Mixed complexity
    if (length >= 20 && hasSecretKeyword && entropy >= 3.0) {
        const hasNumbers = /\d/.test(trimmedValue);
        const hasLowerCase = /[a-z]/.test(trimmedValue);
        const hasUpperCase = /[A-Z]/.test(trimmedValue);
        const hasSpecialChars = /[^a-zA-Z0-9]/.test(trimmedValue);

        if (
            [hasNumbers, hasLowerCase, hasUpperCase, hasSpecialChars].filter(
                Boolean
            ).length >= 3
        ) {
            return {
                isSecret: true,
                reason: `Secret keyword with mixed complexity (${entropy.toFixed(2)} entropy)`,
                confidence: "medium",
                category: "Complex pattern detection",
            };
        }
    }

    // Rule 8: Known secret prefixes
    const secretPrefixes = [
        {prefix: "sk_", minLength: 16, confidence: "high" as const},
        {prefix: "pk_", minLength: 16, confidence: "medium" as const},
        {prefix: "rk_", minLength: 16, confidence: "high" as const},
        {prefix: "xoxb-", minLength: 20, confidence: "high" as const},
        {prefix: "xoxp-", minLength: 20, confidence: "high" as const},
        {prefix: "ghp_", minLength: 20, confidence: "high" as const},
        {prefix: "gho_", minLength: 20, confidence: "high" as const},
        {prefix: "AIza", minLength: 20, confidence: "high" as const},
    ];

    for (const {prefix, minLength, confidence} of secretPrefixes) {
        if (trimmedValue.startsWith(prefix) && length >= minLength) {
            return {
                isSecret: true,
                reason: `Starts with known secret prefix '${prefix}'`,
                confidence,
                category: "Prefix detection",
            };
        }
    }

    // If we get here, probably not a secret
    return {
        isSecret: false,
        reason: "No secret patterns detected",
        confidence: "high",
    };
}

// Helper function for integration
export function hasSecrets(data: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === "string") {
            const result = isPotentiallyASecret(key, value);
            if (result.isSecret && result.confidence !== "low") {
                return true;
            }
        }
    }
    return false;
}
