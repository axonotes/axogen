/**
 * Research-based secret detection
 */

export interface SecretDetectionResult {
    isSecret: boolean;
    reason: string;
    confidence: "low" | "medium" | "high";
    category?: string;
}

// Pre-compiled regex patterns for performance
class CompiledPatterns {
    // Exclusion patterns
    static readonly obviouslyNotSecrets = [
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
        /^\/[a-zA-Z0-9\/_.-]*$/,
        /^[a-zA-Z]:[\\\/]/, // Windows paths
        /^~\/[a-zA-Z0-9\/_.-]*$/, // Unix home paths

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

    // Known secret patterns with metadata
    static readonly knownSecrets = [
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

        // Generic patterns
        {
            pattern: /^[0-9a-fA-F]{32,128}$/,
            type: "Long Hexadecimal String",
            confidence: "medium" as const,
        },
    ];

    // Certificate patterns
    static readonly certificatePatterns = [
        {
            pattern:
                /-----BEGIN[\s\S]*?PRIVATE KEY[\s\S]*?-----END[\s\S]*?PRIVATE KEY-----/,
            type: "RSA/EC Private Key",
            confidence: "high" as const,
        },
        {
            pattern:
                /-----BEGIN[\s\S]*?CERTIFICATE[\s\S]*?-----END[\s\S]*?CERTIFICATE-----/,
            type: "X.509 Certificate",
            confidence: "high" as const,
        },
        {
            pattern:
                /-----BEGIN[\s\S]*?OPENSSH PRIVATE KEY[\s\S]*?-----END[\s\S]*?OPENSSH PRIVATE KEY-----/,
            type: "OpenSSH Private Key",
            confidence: "high" as const,
        },
        {
            pattern: /ssh-(rsa|dss|ed25519|ecdsa)[A-Za-z0-9+/=\s]+/,
            type: "SSH Public Key",
            confidence: "medium" as const,
        },
    ];

    // Base64 pattern
    static readonly base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;

    // Alphanumeric pattern
    static readonly alphanumericPattern = /^[A-Za-z0-9_+=/-]+$/;

    // Hex pattern
    static readonly hexPattern = /^[0-9a-fA-F]+$/;

    // URL parameter pattern
    static readonly urlParameterPattern =
        /[?&](token|key|secret|password|auth|pass|pwd|credential|cred|bearer|authorization|access|refresh|session|signature|cert|certificate|private|api)[=:]([^&\s#]+)/gi;

    // Character type patterns
    static readonly hasNumbers = /\d/;
    static readonly hasLowerCase = /[a-z]/;
    static readonly hasUpperCase = /[A-Z]/;
    static readonly hasSpecialChars = /[^a-zA-Z0-9]/;
}

// Secret keywords
const SECRET_KEYWORDS = new Set([
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
]);

// Entropy calculation cache for performance
const entropyCache = new Map<string, number>();

function calculateEntropy(str: string): number {
    if (entropyCache.has(str)) {
        return entropyCache.get(str)!;
    }

    if (!str || str.length < 2) return 0;

    // Clean string for better entropy calculation
    const cleanStr = str
        .replace(/([a-zA-Z])\1{4,}/g, "$1$1$1") // Remove excessive repetition
        .replace(/12345678/g, "") // Remove sequential numbers
        .replace(/abcdefgh/gi, "") // Remove keyboard patterns
        .replace(/qwerty/gi, "");

    if (cleanStr.length < 2) return 0;

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

    // Cache the result
    if (entropyCache.size > 1000) {
        entropyCache.clear(); // Prevent memory leak
    }
    entropyCache.set(str, entropy);

    return entropy;
}

function hasVeryLowEntropy(str: string): boolean {
    // Check for excessive repetition
    const uniqueChars = new Set(str).size;
    if (uniqueChars <= 2 && str.length > 10) {
        return true;
    }

    // Check entropy
    const entropy = calculateEntropy(str);
    if (entropy < 1.5) {
        return true;
    }

    return false;
}

function isValidBase64(str: string): boolean {
    try {
        // Check if it matches base64 pattern
        if (!CompiledPatterns.base64Pattern.test(str)) {
            return false;
        }

        // Try to decode it
        const decoded = atob(str);

        // Check if re-encoding gives us the same result
        const reencoded = btoa(decoded);
        return reencoded === str;
    } catch {
        return false;
    }
}

function checkUrlParameters(value: string): SecretDetectionResult | null {
    const matches = [...value.matchAll(CompiledPatterns.urlParameterPattern)];

    for (const match of matches) {
        const paramName = match[1].toLowerCase();
        const paramValue = match[2];

        if (
            paramValue &&
            paramValue.length >= 8 &&
            !hasVeryLowEntropy(paramValue)
        ) {
            // Check for obvious fake/test patterns in URL parameters
            const testPatterns = [
                /^(test|demo|sample|example|fake|placeholder)/i,
                /^(abc123|123abc|password123|secret123)/i,
                /^(foo|bar|baz).*key/i,
                /(test|demo|sample|example|fake)$/i,
            ];

            const isFakePattern = testPatterns.some((pattern) =>
                pattern.test(paramValue)
            );
            if (isFakePattern) {
                return null; // Don't flag as secret
            }

            const entropy = calculateEntropy(paramValue);
            if (entropy >= 3.0) {
                // Ensure high entropy for URL parameters
                return {
                    isSecret: true,
                    reason: `Secret detected in URL parameter '${paramName}'`,
                    confidence: "high",
                    category: "URL Parameter Detection",
                };
            }
        }
    }

    return null;
}

function checkConnectionStrings(value: string): SecretDetectionResult | null {
    // General connection string patterns that contain credentials
    const connectionPatterns = [
        // protocol://user:password@host:port/database
        /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:\/\s]+:([^@\s]+)@[^\/\s]+/,
        // protocol://user:password@host/database
        /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^:\/\s]+:([^@\s]+)@[^\/\s]+/,
        // protocol://:password@host (no username)
        /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/:([^@\s]+)@[^\/\s]+/,
        // user:password@host:port (no protocol)
        /^[^:\/\s]+:([^@\s]+)@[^\/\s]+:\d+/,
        // user:password@host (no protocol, no port)
        /^[^:\/\s]+:([^@\s]+)@[^\/\s]+$/,
    ];

    for (const pattern of connectionPatterns) {
        const match = value.match(pattern);
        if (match && match[1]) {
            const credential = match[1];

            // Skip obvious placeholders or common weak passwords
            const placeholderPatterns = [
                /^(password|secret|pass|pwd|test|demo|example|placeholder|changeme|admin|root|user|guest)$/i,
                /^(123456|password123|admin123|test123)$/i,
                /^(abc|xyz|foo|bar|baz)$/i,
                /^(abc123|test123|demo123|example123)/i,
                /secretkey$/i, // ends with "secretkey"
                /^fake/i, // starts with "fake"
                /^sample/i, // starts with "sample"
            ];

            if (placeholderPatterns.some((p) => p.test(credential))) {
                return null;
            }

            // Check credential length and entropy
            if (credential.length >= 8) {
                const entropy = calculateEntropy(credential);
                if (entropy >= 3.0) {
                    return {
                        isSecret: true,
                        reason: `Connection string with high-entropy credential (${entropy.toFixed(2)} entropy)`,
                        confidence: "high",
                        category: "Connection String",
                    };
                }
            }
        }
    }

    // Also check for credentials in query parameters of connection strings
    const queryParamMatch = value.match(
        /[?&](password|pwd|pass|token|key|secret|auth|credential)=([^&\s#]+)/i
    );
    if (queryParamMatch && queryParamMatch[2]) {
        const paramValue = queryParamMatch[2];

        // Enhanced placeholder detection for query parameters
        const queryPlaceholderPatterns = [
            /^(abc123|test123|demo123|example123|fake123)/i,
            /secretkey$/i,
            /^(password|secret|test|demo|example|fake|sample)/i,
            /123$/i, // ends with 123
        ];

        const isPlaceholder = queryPlaceholderPatterns.some((p) =>
            p.test(paramValue)
        );
        if (isPlaceholder) {
            return null;
        }

        if (paramValue.length >= 8 && !hasVeryLowEntropy(paramValue)) {
            const entropy = calculateEntropy(paramValue);
            if (entropy >= 3.5) {
                // Higher threshold for query params
                return {
                    isSecret: true,
                    reason: `Connection string with high-entropy credential in query parameter`,
                    confidence: "high",
                    category: "Connection String",
                };
            }
        }
    }

    return null;
}

function checkCertificatesAndKeys(value: string): SecretDetectionResult | null {
    for (const {
        pattern,
        type,
        confidence,
    } of CompiledPatterns.certificatePatterns) {
        if (pattern.test(value)) {
            return {
                isSecret: true,
                reason: `Detected ${type}`,
                confidence,
                category: "Certificate/Key Detection",
            };
        }
    }
    return null;
}

function checkKnownPatterns(value: string): SecretDetectionResult | null {
    for (const {pattern, type, confidence} of CompiledPatterns.knownSecrets) {
        if (pattern.test(value)) {
            return {
                isSecret: true,
                reason: `Matches ${type} pattern`,
                confidence,
                category: type,
            };
        }
    }
    return null;
}

function checkObviousNonSecrets(value: string): boolean {
    for (const pattern of CompiledPatterns.obviouslyNotSecrets) {
        if (pattern.test(value)) {
            return true;
        }
    }
    return false;
}

function hasSecretKeyword(key: string): boolean {
    const lowerKey = key.toLowerCase();
    for (const keyword of SECRET_KEYWORDS) {
        if (lowerKey.includes(keyword)) {
            return true;
        }
    }
    return false;
}

function analyzeComplexity(value: string): number {
    return [
        CompiledPatterns.hasNumbers.test(value),
        CompiledPatterns.hasLowerCase.test(value),
        CompiledPatterns.hasUpperCase.test(value),
        CompiledPatterns.hasSpecialChars.test(value),
    ].filter(Boolean).length;
}

export function isPotentiallyASecret(
    key: string,
    value: any
): SecretDetectionResult {
    // Early validation
    if (typeof value !== "string" || !value.trim()) {
        return {
            isSecret: false,
            reason: "Empty or non-string value",
            confidence: "high",
        };
    }

    const trimmedValue = value.trim();
    const length = trimmedValue.length;

    // Quick length check for performance
    if (length < 4) {
        return {
            isSecret: false,
            reason: "Value too short",
            confidence: "high",
        };
    }

    // Early exit for very low entropy strings
    if (length >= 20 && hasVeryLowEntropy(trimmedValue)) {
        return {
            isSecret: false,
            reason: "Very low entropy (repetitive content)",
            confidence: "high",
        };
    }

    // 1. Check for URL parameters
    const urlResult = checkUrlParameters(trimmedValue);
    if (urlResult) return urlResult;

    // 2. Check connection strings with credentials
    const connectionResult = checkConnectionStrings(trimmedValue);
    if (connectionResult) return connectionResult;

    // 3. Check for obvious non-secrets first (fastest check)
    if (checkObviousNonSecrets(trimmedValue)) {
        return {
            isSecret: false,
            reason: "Matches common non-secret pattern",
            confidence: "high",
        };
    }

    // 4. Check certificates and private keys
    const certResult = checkCertificatesAndKeys(trimmedValue);
    if (certResult) return certResult;

    // 5. Check known secret patterns
    const knownResult = checkKnownPatterns(trimmedValue);
    if (knownResult) return knownResult;

    // 6. Check for secret context keywords
    const hasKeyword = hasSecretKeyword(key);

    // 7. High-confidence keyword check
    if (hasKeyword && length >= 8) {
        // Additional validation for test values
        const testKeywords = [
            "test",
            "example",
            "demo",
            "placeholder",
            "sample",
        ];
        if (
            testKeywords.some((keyword) =>
                trimmedValue.toLowerCase().includes(keyword)
            )
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

    // 8. Entropy analysis (only for longer strings to save computation)
    if (length >= 12) {
        const entropy = calculateEntropy(trimmedValue);

        // Dynamic entropy thresholds
        let entropyThreshold = 3.8;
        if (length >= 32) entropyThreshold = 4.2;
        if (length >= 64) entropyThreshold = 4.7;

        if (entropy >= entropyThreshold) {
            const complexityScore = analyzeComplexity(trimmedValue);

            if (complexityScore >= 2) {
                return {
                    isSecret: true,
                    reason: `High entropy (${entropy.toFixed(2)}) with character complexity in ${length}-char string`,
                    confidence: "medium",
                    category: "Entropy-based detection",
                };
            }
        }
    }

    // 9. Long alphanumeric strings
    if (
        length >= 24 &&
        CompiledPatterns.alphanumericPattern.test(trimmedValue) &&
        !/\s/.test(trimmedValue)
    ) {
        // Check entropy before flagging as secret
        const entropy = calculateEntropy(trimmedValue);
        if (entropy < 2.5) {
            return {
                isSecret: false,
                reason: "Low entropy alphanumeric string",
                confidence: "medium",
            };
        }

        // Exclude obvious hashes without secret context
        if (
            CompiledPatterns.hexPattern.test(trimmedValue) &&
            length === 32 &&
            !hasKeyword
        ) {
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

    // 10. Hex strings
    if (length >= 32 && CompiledPatterns.hexPattern.test(trimmedValue)) {
        const entropy = calculateEntropy(trimmedValue);
        if (entropy < 2.0) {
            return {
                isSecret: false,
                reason: "Low entropy hexadecimal string",
                confidence: "medium",
            };
        }

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

    // 11. Improved Base64 detection
    if (length >= 20 && length % 4 === 0) {
        if (isValidBase64(trimmedValue)) {
            const entropy = calculateEntropy(trimmedValue);
            if (entropy >= 3.5) {
                return {
                    isSecret: true,
                    reason: `${length}-character valid base64 string with high entropy`,
                    confidence: "medium",
                    category: "Base64 detection",
                };
            } else {
                return {
                    isSecret: false,
                    reason: "Valid base64 but low entropy",
                    confidence: "medium",
                };
            }
        }
    }

    // 12. UUID-like but extended (custom tokens)
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

    // 13. Mixed complexity with keyword context
    if (length >= 20 && hasKeyword) {
        const entropy = calculateEntropy(trimmedValue);
        if (entropy >= 3.0) {
            const complexityScore = analyzeComplexity(trimmedValue);
            if (complexityScore >= 3) {
                return {
                    isSecret: true,
                    reason: `Secret keyword with mixed complexity (${entropy.toFixed(2)} entropy)`,
                    confidence: "medium",
                    category: "Complex pattern detection",
                };
            }
        }
    }

    // 14. Known secret prefixes
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

    // Default: not a secret
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

// Utility function to clear entropy cache (for memory management)
export function clearEntropyCache(): void {
    entropyCache.clear();
}
