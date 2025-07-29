import {test, expect, describe, beforeEach} from "bun:test";
import {isPotentiallyASecret, hasSecrets, clearEntropyCache} from "./secrets";
import {randomBytes} from "crypto";

// Helper functions to generate realistic secret-like values
const generateRandomString = (
    length: number,
    charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
) => {
    const bytes = randomBytes(length);
    return Array.from(bytes, (byte) => charset[byte % charset.length]).join("");
};

const generateRandomHex = (length: number) => {
    return randomBytes(Math.ceil(length / 2))
        .toString("hex")
        .slice(0, length);
};

const generateRandomBase64 = (length: number) => {
    const bytes = randomBytes(Math.ceil((length * 3) / 4));
    return bytes.toString("base64").slice(0, length);
};

const generateAWSAccessKeyID = () => {
    return (
        "AKIA" +
        generateRandomString(16, "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789")
    );
};

const generateAWSSecretAccessKey = () => {
    return generateRandomString(
        40,
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    );
};

const generateAWSToken = () => {
    return "aws_" + generateRandomString(40);
};

const generateGitHubPAT = () => {
    return "ghp_" + generateRandomString(36);
};

const generateGitHubOAuth = () => {
    return "gho_" + generateRandomString(36);
};

const generateGitHubFineGrainedPAT = () => {
    const prefix = "github_pat_";
    const firstPart = generateRandomString(
        11,
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    );
    const separator = "_";
    const secondPart = generateRandomString(59);
    return prefix + firstPart + separator + secondPart;
};

const generateStripeSecretKey = (mode = "test") => {
    return `sk_${mode}_` + generateRandomString(24);
};

const generateStripePublishableKey = (mode = "live") => {
    return `pk_${mode}_` + generateRandomString(24);
};

const generateJWT = () => {
    const header = btoa(JSON.stringify({alg: "HS256", typ: "JWT"})).replace(
        /=/g,
        ""
    );
    const payload = btoa(
        JSON.stringify({
            sub: generateRandomString(10, "0123456789"),
            name: "Test User",
            iat: Math.floor(Date.now() / 1000),
        })
    ).replace(/=/g, "");
    const signature = generateRandomBase64(43).replace(/[+/=]/g, (c) =>
        c === "+" ? "-" : c === "/" ? "_" : ""
    );
    return `${header}.${payload}.${signature}`;
};

const generateSlackBotToken = () => {
    const num1 = Math.floor(Math.random() * 9000000000) + 1000000000;
    const num2 = Math.floor(Math.random() * 9000000000) + 1000000000;
    const suffix = generateRandomString(24);
    return `xoxb-${num1}-${num2}-${suffix}`;
};

const generateSlackUserToken = () => {
    const num1 = Math.floor(Math.random() * 9000000000) + 1000000000;
    const num2 = Math.floor(Math.random() * 9000000000) + 1000000000;
    const num3 = Math.floor(Math.random() * 9000000000) + 1000000000;
    const suffix = generateRandomString(32);
    return `xoxp-${num1}-${num2}-${num3}-${suffix}`;
};

const generateDiscordBotToken = () => {
    const id = generateRandomBase64(18).replace(/[+/=]/g, "");
    const timestamp = generateRandomString(6);
    const hmac = generateRandomString(27);
    return `${id}.${timestamp}.${hmac}`;
};

const generateGoogleAPIKey = () => {
    return "AIzaSy" + generateRandomString(33);
};

const generateHighEntropyString = (length = 64) => {
    return generateRandomString(length);
};

const generateLongAlphanumeric = (length = 48) => {
    return generateRandomString(length, "abcdefghijklmnopqrstuvwxyz0123456789");
};

const generatePrivateKeyPEM = () => {
    const keyData = generateRandomBase64(800);
    const lines = keyData.match(/.{1,64}/g);
    if (!lines) {
        throw new Error("Failed to generate private key PEM format");
    }
    return `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
};

const generateCertificatePEM = () => {
    const certData = generateRandomBase64(600);
    const lines = certData.match(/.{1,64}/g);
    if (!lines) {
        throw new Error("Failed to generate certificate PEM format");
    }
    return `-----BEGIN CERTIFICATE-----\n${lines.join("\n")}\n-----END CERTIFICATE-----`;
};

const generateSSHPublicKey = () => {
    return "ssh-rsa " + generateRandomBase64(400);
};

describe("Secret Detection", () => {
    beforeEach(() => {
        clearEntropyCache();
    });

    describe("Basic validation", () => {
        test("should reject empty or non-string values", () => {
            expect(isPotentiallyASecret("key", "")).toEqual({
                isSecret: false,
                reason: "Empty or non-string value",
                confidence: "high",
            });

            expect(isPotentiallyASecret("key", null)).toEqual({
                isSecret: false,
                reason: "Empty or non-string value",
                confidence: "high",
            });

            expect(isPotentiallyASecret("key", undefined)).toEqual({
                isSecret: false,
                reason: "Empty or non-string value",
                confidence: "high",
            });

            expect(isPotentiallyASecret("key", 123)).toEqual({
                isSecret: false,
                reason: "Empty or non-string value",
                confidence: "high",
            });
        });

        test("should reject very short values", () => {
            expect(isPotentiallyASecret("password", "abc")).toEqual({
                isSecret: false,
                reason: "Value too short",
                confidence: "high",
            });
        });
    });

    describe("Obvious non-secrets", () => {
        test("should reject boolean values", () => {
            const result = isPotentiallyASecret("enabled", "true");
            expect(result.isSecret).toBe(false);
            expect(result.reason).toBe("Matches common non-secret pattern");
        });

        test("should reject simple numbers", () => {
            const result = isPotentiallyASecret("port", "3000");
            expect(result.isSecret).toBe(false);
        });

        test("should reject URLs", () => {
            const result = isPotentiallyASecret("url", "https://example.com");
            expect(result.isSecret).toBe(false);
        });

        test("should reject file paths", () => {
            expect(
                isPotentiallyASecret("path", "/usr/local/bin").isSecret
            ).toBe(false);
            expect(
                isPotentiallyASecret("path", "C:\\Windows\\System32").isSecret
            ).toBe(false);
            expect(
                isPotentiallyASecret("path", "~/Documents/file.txt").isSecret
            ).toBe(false);
        });

        test("should reject email addresses", () => {
            const result = isPotentiallyASecret("email", "test@example.com");
            expect(result.isSecret).toBe(false);
        });

        test("should reject dates", () => {
            const result = isPotentiallyASecret("date", "2024-01-15");
            expect(result.isSecret).toBe(false);
        });

        test("should reject version numbers", () => {
            expect(isPotentiallyASecret("version", "1.2.3").isSecret).toBe(
                false
            );
            expect(isPotentiallyASecret("version", "v2.0.1").isSecret).toBe(
                false
            );
        });

        test("should reject common environment values", () => {
            expect(isPotentiallyASecret("env", "development").isSecret).toBe(
                false
            );
            expect(isPotentiallyASecret("env", "production").isSecret).toBe(
                false
            );
            expect(isPotentiallyASecret("level", "debug").isSecret).toBe(false);
        });

        test("should reject placeholder values", () => {
            expect(isPotentiallyASecret("value", "test").isSecret).toBe(false);
            expect(isPotentiallyASecret("value", "example").isSecret).toBe(
                false
            );
            expect(isPotentiallyASecret("value", "foo").isSecret).toBe(false);
        });
    });

    describe("AWS Secrets", () => {
        test("should detect AWS Access Key ID", () => {
            const awsKey = generateAWSAccessKeyID();
            const result = isPotentiallyASecret("aws_access_key", awsKey);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect AWS Secret Access Key", () => {
            const awsSecret = generateAWSSecretAccessKey();
            const result = isPotentiallyASecret("aws_secret", awsSecret);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });

        test("should detect AWS Token", () => {
            const awsToken = generateAWSToken();
            const result = isPotentiallyASecret("token", awsToken);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });
    });

    describe("GitHub Secrets", () => {
        test("should detect GitHub Personal Access Token", () => {
            const githubPAT = generateGitHubPAT();
            const result = isPotentiallyASecret("github_token", githubPAT);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect GitHub OAuth Token", () => {
            const githubOAuth = generateGitHubOAuth();
            const result = isPotentiallyASecret("oauth_token", githubOAuth);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect GitHub Fine-grained PAT", () => {
            const githubFinePAT = generateGitHubFineGrainedPAT();
            const result = isPotentiallyASecret("github_t", githubFinePAT);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("Stripe Secrets", () => {
        test("should detect Stripe Secret Key", () => {
            const stripeSecret = generateStripeSecretKey("test");
            const result = isPotentiallyASecret("stripe_key", stripeSecret);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect Stripe Publishable Key", () => {
            const stripePublishable = generateStripePublishableKey("live");
            const result = isPotentiallyASecret(
                "publishable_key",
                stripePublishable
            );
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("JWT Tokens", () => {
        test("should detect JWT tokens", () => {
            const jwt = generateJWT();
            const result = isPotentiallyASecret("token", jwt);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("Slack Tokens", () => {
        test("should detect Slack Bot Token", () => {
            const slackBot = generateSlackBotToken();
            const result = isPotentiallyASecret("slack_token", slackBot);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect Slack User Token", () => {
            const slackUser = generateSlackUserToken();
            const result = isPotentiallyASecret("token", slackUser);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });
    });

    describe("Discord Tokens", () => {
        test("should detect Discord Bot Token", () => {
            const discordToken = generateDiscordBotToken();
            const result = isPotentiallyASecret("discord_token", discordToken);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("Google API Keys", () => {
        test("should detect Google API Key", () => {
            const googleKey = generateGoogleAPIKey();
            const result = isPotentiallyASecret("google_api_key", googleKey);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });
    });

    describe("Database Connection Strings", () => {
        test("should not detect default MongoDB connection string", () => {
            const result = isPotentiallyASecret(
                "db_url",
                "mongodb://user:password@localhost:27017/database"
            );
            expect(result.isSecret).toBe(false);
            expect(result.confidence).toBe("high");
        });

        test("should detect MongoDB connection string with high entropy", () => {
            const secretValue = generateHighEntropyString(64);
            const result = isPotentiallyASecret(
                "db_url",
                `mongodb://user:${secretValue}@localhost:27017/database`
            );
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should not detect default PostgreSQL connection string", () => {
            const result = isPotentiallyASecret(
                "database_url",
                "postgresql://user:password@localhost:5432/database"
            );
            expect(result.isSecret).toBe(false);
            expect(result.confidence).toBe("high");
        });

        test("should detect PostgreSQL connection string with high entropy", () => {
            const secretValue = generateHighEntropyString(64);
            const result = isPotentiallyASecret(
                "database_url",
                `postgresql://user:${secretValue}@localhost:5432/database`
            );
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });
    });

    describe("Certificates and Keys", () => {
        test("should detect RSA Private Key", () => {
            const privateKey = generatePrivateKeyPEM();
            const result = isPotentiallyASecret("private_key", privateKey);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect X.509 Certificate", () => {
            const certificate = generateCertificatePEM();
            const result = isPotentiallyASecret("certificate", certificate);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect SSH Public Key", () => {
            const sshKey = generateSSHPublicKey();
            const result = isPotentiallyASecret("ssh_key", sshKey);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("URL Parameter Detection", () => {
        test("fake secrets in URL parameters", () => {
            const url =
                "https://api.example.com/endpoint?token=abc123secretkey&other=value";
            const result = isPotentiallyASecret("api_url", url);
            expect(result.isSecret).toBe(false);
            expect(result.confidence).toBe("high");
        });

        test("should detect secrets in URL parameters", () => {
            const secretValue = generateHighEntropyString(64);
            const url = `https://api.example.com/endpoint?token=${secretValue}&other=value`;
            const result = isPotentiallyASecret("api_url", url);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should detect secrets in various URL parameter formats", () => {
            const secretValue = generateHighEntropyString(64);
            const testCases = [
                `?api_key=${secretValue}`,
                `&password=${secretValue}`,
                `?access_token=${secretValue}`,
                `&secret=${secretValue}`,
            ];

            testCases.forEach((url) => {
                const result = isPotentiallyASecret("url", url);
                expect(result.isSecret).toBe(true);
            });
        });
    });

    describe("Keyword-based Detection", () => {
        test("should detect secrets with secret keywords", () => {
            const secretValue = generateRandomString(16);
            const result = isPotentiallyASecret("api_secret", secretValue);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should reject test values even with secret keywords", () => {
            const result = isPotentiallyASecret(
                "password",
                "test_password_example"
            );
            expect(result.isSecret).toBe(false);
            expect(result.reason).toBe("Matches common non-secret pattern");
        });

        test("should detect various secret keywords", () => {
            const secretKeywords = [
                "password",
                "api_key",
                "secret",
                "token",
                "private_key",
                "access_token",
                "client_secret",
            ];

            secretKeywords.forEach((keyword) => {
                const secretValue = generateRandomString(16);
                const result = isPotentiallyASecret(keyword, secretValue);
                expect(result.isSecret).toBe(true);
                expect(result.confidence).toBe("high");
            });
        });
    });

    describe("Entropy-based Detection", () => {
        test("should detect high entropy strings", () => {
            const highEntropyString = generateHighEntropyString(64);
            const result = isPotentiallyASecret(
                "high_entropy",
                highEntropyString
            );
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });

        test("should not detect low entropy strings", () => {
            const lowEntropyString = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
            const result = isPotentiallyASecret("value", lowEntropyString);
            expect(result.isSecret).toBe(false);
        });
    });

    describe("Long Alphanumeric Strings", () => {
        test("should detect long alphanumeric strings", () => {
            const longString = generateLongAlphanumeric(48);
            const result = isPotentiallyASecret("identifier", longString);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("Hexadecimal Strings", () => {
        test("should detect long hex strings", () => {
            const hexString = generateRandomHex(64);
            const result = isPotentiallyASecret("key", hexString);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });

        test("should detect SHA-256 length hex strings", () => {
            const sha256 = generateRandomHex(64);
            const result = isPotentiallyASecret("hash", sha256);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("medium");
        });
    });

    describe("Base64 Detection", () => {
        test("should detect valid base64 strings with high entropy", () => {
            const base64String = generateRandomBase64(32) + "="; // Add padding for valid base64
            const result = isPotentiallyASecret("encoded_key", base64String);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });

        test("should not detect low entropy base64", () => {
            const lowEntropyBase64 =
                "YWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWE=";
            const result = isPotentiallyASecret("data", lowEntropyBase64);
            expect(result.isSecret).toBe(false);
        });
    });

    describe("Custom Token Detection", () => {
        test("should detect UUID-like tokens with extra characters", () => {
            const uuid = randomBytes(16).toString("hex");
            const formattedUuid = `${uuid.slice(0, 8)}-${uuid.slice(8, 12)}-${uuid.slice(12, 16)}-${uuid.slice(16, 20)}-${uuid.slice(20, 32)}`;
            const extraChars = generateRandomString(12);
            const customToken = formattedUuid + extraChars;
            const result = isPotentiallyASecret("session_id", customToken);
            expect(result.isSecret).toBe(true);
        });
    });

    describe("Prefix Detection", () => {
        test("should detect known secret prefixes", () => {
            const prefixes = [
                {value: "sk_test_" + generateRandomString(24), prefix: "sk_"},
                {value: "pk_live_" + generateRandomString(24), prefix: "pk_"},
                {value: "AIzaSy" + generateRandomString(33), prefix: "AIza"},
            ];

            prefixes.forEach(({value, prefix}) => {
                const result = isPotentiallyASecret("key", value);
                expect(result.isSecret).toBe(true);
            });
        });
    });

    describe("hasSecrets helper function", () => {
        test("should detect secrets in data object", () => {
            const data = {
                username: "john_doe",
                password: generateRandomString(16),
                api_url: "https://api.example.com",
            };

            expect(hasSecrets(data, "testing").hasSecrets).toBe(true);
        });

        test("should not detect secrets in clean data", () => {
            const data = {
                username: "john_doe",
                port: "3000",
                url: "https://example.com",
                environment: "development",
            };

            expect(hasSecrets(data, "testing").hasSecrets).toBe(false);
        });
    });

    describe("Complex pattern detection", () => {
        test("should detect mixed complexity with secret keywords", () => {
            // Generate a complex string with mixed case, numbers, and special chars
            const complexKey =
                generateRandomString(8) +
                "!" +
                generateRandomString(8, "0123456789") +
                generateRandomString(8);
            const result = isPotentiallyASecret("encryption_key", complexKey);
            expect(result.isSecret).toBe(true);
            expect(result.confidence).toBe("high");
        });
    });

    describe("Edge cases", () => {
        test("should handle very long strings", () => {
            const veryLongString = "a".repeat(1000);
            const result = isPotentiallyASecret("data", veryLongString);
            expect(result.isSecret).toBe(false);
        });

        test("should handle strings with whitespace", () => {
            const secretValue = generateRandomString(12);
            const stringWithSpaces = `   ${secretValue}   `;
            const result = isPotentiallyASecret("secret", stringWithSpaces);
            expect(result.isSecret).toBe(true);
        });

        test("should handle special characters", () => {
            const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?";
            const result = isPotentiallyASecret("symbols", specialChars);
            expect(result.isSecret).toBe(false);
        });
    });

    describe("Performance considerations", () => {
        test("should handle entropy cache", () => {
            const testString = generateRandomString(32);

            // First call should calculate entropy
            const result1 = isPotentiallyASecret("key", testString);

            // Second call should use cached entropy
            const result2 = isPotentiallyASecret("key", testString);

            expect(result1).toEqual(result2);
        });

        test("should clear entropy cache", () => {
            const testString = generateRandomString(32);
            isPotentiallyASecret("key", testString);

            // This should not throw
            expect(() => clearEntropyCache()).not.toThrow();
        });
    });

    describe("Real-world scenarios", () => {
        test("should handle configuration files", () => {
            const config = {
                app_name: "MyApp",
                port: "3000",
                database_url: "postgresql://user:password@localhost:5432/myapp",
                jwt_secret: generateRandomString(32),
                debug: "true",
                environment: "development",
            };

            expect(hasSecrets(config, "testing").hasSecrets).toBe(true);
        });

        test("should handle environment variables", () => {
            const envVars = {
                NODE_ENV: "production",
                PORT: "8080",
                API_KEY: generateStripeSecretKey("live"),
                LOG_LEVEL: "info",
                TIMEOUT: "30000",
            };

            expect(hasSecrets(envVars, "testing").hasSecrets).toBe(true);
        });

        test("should not flag common development values", () => {
            const devConfig = {
                hostname: "localhost",
                port: "3000",
                protocol: "http",
                environment: "development",
                debug: "true",
                log_level: "debug",
            };

            expect(hasSecrets(devConfig, "testing").hasSecrets).toBe(false);
        });
    });
});
