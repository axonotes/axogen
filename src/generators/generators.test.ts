import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
    mock,
    spyOn,
} from "bun:test";
import {TargetGenerator, targetGenerator} from "./index.ts";
import type {ZodTarget} from "../config/types";
import * as fs from "node:fs";
import * as path from "node:path";
import {unsafe} from "../utils/secrets.ts";

// Test data directory
const TEST_DIR = path.join(import.meta.dir, "test-fixtures");
const TEMP_DIR = path.join(TEST_DIR, "temp");
const TEMPLATES_DIR = path.join(TEST_DIR, "templates");

// Simple test data (no secrets)
const testData = {
    name: "Test Config",
    version: "1.0.0",
    database: {
        host: "localhost",
        port: 5432,
        ssl: true,
    },
    features: ["auth", "logging"],
    timeout: 30000,
};

// CSV-compatible test data
const csvTestData = [
    {name: "John", age: 30, department: "Engineering"},
    {name: "Jane", age: 25, department: "Marketing"},
    {name: "Bob", age: 35, department: "Sales"},
];

// Test data with secrets (not wrapped in unsafe)
const rawSecretData = {
    app_name: "MyApp",
    api_key: "sk-1234567890abcdef",
    database_url: "postgres://user:password@localhost:5432/db",
    jwt_secret: "super-secret-jwt-key",
};

// Test data with secrets (wrapped in unsafe)
const safeSecretData = {
    app_name: "MyApp",
    api_key: unsafe("sk-1234567890abcdef", "test API key"),
    database_url: unsafe(
        "postgres://user:password@localhost:5432/db",
        "test database URL"
    ),
    jwt_secret: unsafe("super-secret-jwt-key", "test JWT secret"),
};

describe("TargetGenerator", () => {
    let generator: TargetGenerator;
    let gitIgnoreSpy: any;

    beforeAll(async () => {
        // Create test directories
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, {recursive: true});
        }
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, {recursive: true});
        }
        if (!fs.existsSync(TEMPLATES_DIR)) {
            fs.mkdirSync(TEMPLATES_DIR, {recursive: true});
        }

        // Create minimal test templates
        await createTestTemplates();
        generator = new TargetGenerator();
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, {recursive: true, force: true});
        }
    });

    beforeEach(async () => {
        gitIgnoreSpy?.mockRestore();

        // Clean up temp files before each test
        if (fs.existsSync(TEMP_DIR)) {
            fs.rmSync(TEMP_DIR, {recursive: true, force: true});
            fs.mkdirSync(TEMP_DIR, {recursive: true});
        }

        // Mock the git ignore checker
        const gitModule = await import("../git/ignore-checker.ts");
        gitIgnoreSpy = spyOn(gitModule, "isGitIgnored").mockReturnValue(true);
    });

    describe("Generator Routing", () => {
        const formats = [
            "json",
            "json5",
            "jsonc",
            "hjson",
            "yaml",
            "toml",
            "ini",
            "properties",
            "env",
            "xml",
        ] as const;

        formats.forEach((type) => {
            test(`should route ${type} files to appropriate generator`, async () => {
                const target: ZodTarget = {
                    type,
                    path: `test.${type}`,
                    variables: testData,
                    generate_meta: false,
                };

                const result = await generator.generate("test", target);

                expect(result).toHaveProperty("path");
                expect(result).toHaveProperty("content");
                expect(typeof result.content).toBe("string");
                expect(result.content.length).toBeGreaterThan(0);
            });
        });

        test("should route csv files to appropriate generator", async () => {
            const target: ZodTarget = {
                type: "csv",
                path: "test.csv",
                variables: {
                    csv: csvTestData,
                }, // Use CSV-compatible data
                generate_meta: false,
            };

            const result = await generator.generate("test", target);

            expect(result).toHaveProperty("path");
            expect(result).toHaveProperty("content");
            expect(typeof result.content).toBe("string");
            expect(result.content.length).toBeGreaterThan(0);
        });

        test("should route template files correctly", async () => {
            const target: ZodTarget = {
                type: "template",
                path: "test.conf",
                template: path.join(TEMPLATES_DIR, "config.njk"),
                engine: "nunjucks",
                variables: testData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toContain("Test Config");
        });

        test("should throw error for unsupported type", async () => {
            const target = {
                type: "unsupported",
                path: "test.unsupported",
                variables: testData,
            } as any;

            expect(generator.generate("test", target)).rejects.toThrow(
                "Unsupported target type: unsupported"
            );
        });
    });

    describe("File Operations", () => {
        test("should generate and write file to disk", async () => {
            const target: ZodTarget = {
                type: "json",
                path: path.join(TEMP_DIR, "generated.json"),
                variables: testData,
                generate_meta: false,
            };

            const outputPath = await generator.generateAndWrite("test", target);

            expect(fs.existsSync(outputPath)).toBe(true);
            const content = fs.readFileSync(outputPath, "utf-8");
            expect(content).toContain('"name": "Test Config"');
        });

        test("should create directories recursively", async () => {
            const target: ZodTarget = {
                type: "json",
                path: path.join(TEMP_DIR, "deep", "nested", "config.json"),
                variables: testData,
                generate_meta: false,
            };

            const outputPath = await generator.generateAndWrite("test", target);
            expect(fs.existsSync(outputPath)).toBe(true);
            expect(fs.existsSync(path.dirname(outputPath))).toBe(true);
        });

        test("should handle dry run mode", async () => {
            const target: ZodTarget = {
                type: "json",
                path: path.join(TEMP_DIR, "dryrun.json"),
                variables: testData,
                generate_meta: false,
            };

            const outputPath = await generator.generateAndWrite(
                "test",
                target,
                {
                    dryRun: true,
                }
            );

            expect(outputPath).toBe(target.path);
            expect(fs.existsSync(outputPath)).toBe(false);
        });

        test("should resolve relative paths with baseDir", async () => {
            const target: ZodTarget = {
                type: "json",
                path: "relative-config.json",
                variables: testData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target, {
                baseDir: TEMP_DIR,
            });

            expect(result.path).toBe(
                path.join(TEMP_DIR, "relative-config.json")
            );
        });
    });

    describe("Multiple Target Generation", () => {
        test("should generate multiple targets successfully", async () => {
            const targets: Record<string, ZodTarget> = {
                json_config: {
                    type: "json",
                    path: path.join(TEMP_DIR, "multi.json"),
                    variables: testData,
                    generate_meta: false,
                },
                yaml_config: {
                    type: "yaml",
                    path: path.join(TEMP_DIR, "multi.yaml"),
                    variables: testData,
                    generate_meta: false,
                },
            };

            const results = await generator.generateMultiple(targets);

            expect(results).toHaveLength(2);
            results.forEach((result) => {
                expect(result.success).toBe(true);
                expect(result.error).toBeUndefined();
                expect(fs.existsSync(result.path)).toBe(true);
            });
        });

        test("should handle mixed success/failure in multiple targets", async () => {
            const targets: Record<string, ZodTarget> = {
                good_target: {
                    type: "json",
                    path: path.join(TEMP_DIR, "good.json"),
                    variables: testData,
                    generate_meta: false,
                },
                bad_target: {
                    type: "unsupported" as any,
                    path: path.join(TEMP_DIR, "bad.txt"),
                    variables: testData,
                    generate_meta: false,
                },
            };

            const results = await generator.generateMultiple(targets);

            expect(results).toHaveLength(2);
            expect(results[0].success).toBe(true);
            expect(results[1].success).toBe(false);
            expect(results[1].error).toContain("Unsupported target type");
        });
    });

    describe("Security Features", () => {
        test("should detect secrets and throw error when not git ignored", async () => {
            gitIgnoreSpy.mockReturnValue(false);

            const target: ZodTarget = {
                type: "json",
                path: "secrets.json",
                variables: rawSecretData,
                generate_meta: false,
            };

            expect(generator.generate("test", target)).rejects.toThrow(
                'Target "test" contains secrets'
            );
        });

        test("should allow secrets when file is git ignored", async () => {
            gitIgnoreSpy.mockReturnValue(true);

            const target: ZodTarget = {
                type: "json",
                path: "secrets.json",
                variables: rawSecretData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toBeTruthy();
            expect(result.content).toContain("api_key");
        });

        test("should allow secrets wrapped in unsafe function", async () => {
            const target: ZodTarget = {
                type: "json",
                path: "safe-secrets.json",
                variables: safeSecretData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toBeTruthy();
            expect(result.content).toContain("sk-1234567890abcdef");
        });

        test("should handle git ignore check failure gracefully", async () => {
            gitIgnoreSpy.mockImplementation(() => {
                throw new Error("Git check failed");
            });

            const target: ZodTarget = {
                type: "json",
                path: "secrets.json",
                variables: rawSecretData,
                generate_meta: false,
            };

            expect(generator.generate("test", target)).rejects.toThrow(
                'Target "test" contains secrets'
            );
        });
    });

    describe("Metadata Generation", () => {
        test("should add metadata when enabled", async () => {
            const target: ZodTarget = {
                type: "json",
                path: "with-metadata.json",
                variables: testData,
                generate_meta: true,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toContain("_meta");
            expect(result.content).toContain("generator");
            expect(result.content).toContain("generated_at");
        });

        test("should skip metadata for CSV format", async () => {
            const target: ZodTarget = {
                type: "csv",
                path: "no-metadata.csv",
                variables: {
                    csv: csvTestData,
                }, // Use CSV-compatible data
                generate_meta: true,
            };

            const result = await generator.generate("test", target);
            expect(result.content).not.toContain("_meta");
            expect(result.content).toContain("name");
        });

        test("should add header comments for supported formats", async () => {
            const formats = [
                {type: "yaml" as const, comment: "# Generated by axogen"},
                {type: "env" as const, comment: "# Generated by axogen"},
                {type: "ini" as const, comment: "; Generated by axogen"},
            ];

            for (const {type, comment} of formats) {
                const target: ZodTarget = {
                    type,
                    path: `header.${type}`,
                    variables: testData,
                    generate_meta: false,
                };

                const result = await generator.generate("test", target);
                expect(result.content).toContain(comment);
            }
        });
    });

    describe("Template Generation", () => {
        test("should generate from Nunjucks template", async () => {
            const target: ZodTarget = {
                type: "template",
                path: "generated.conf",
                template: path.join(TEMPLATES_DIR, "config.njk"),
                engine: "nunjucks",
                variables: testData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toContain("server_name=Test Config");
            expect(result.content).toContain("db_host=localhost");
        });

        test("should generate from Handlebars template", async () => {
            const target: ZodTarget = {
                type: "template",
                path: "handlebars.conf",
                template: path.join(TEMPLATES_DIR, "config.hbs"),
                engine: "handlebars",
                variables: testData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toContain("App: Test Config");
            expect(result.content).toContain("Database: localhost:5432");
        });

        test("should add metadata to template context when enabled", async () => {
            const target: ZodTarget = {
                type: "template",
                path: "metadata.conf",
                template: path.join(TEMPLATES_DIR, "metadata.njk"),
                engine: "nunjucks",
                variables: testData,
                generate_meta: true,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toContain("generated_by=axogen");
            expect(result.content).toContain("target_path=metadata.conf");
        });

        test("should throw error for missing template file", async () => {
            const target: ZodTarget = {
                type: "template",
                path: "missing.conf",
                template: path.join(TEMPLATES_DIR, "nonexistent.njk"),
                engine: "nunjucks",
                variables: testData,
                generate_meta: false,
            };

            expect(generator.generate("test", target)).rejects.toThrow();
        });

        test("should throw error for unsupported template engine", async () => {
            const target: ZodTarget = {
                type: "template",
                path: "unsupported.conf",
                template: path.join(TEMPLATES_DIR, "config.njk"),
                engine: "unsupported" as any,
                variables: testData,
                generate_meta: false,
            };

            expect(generator.generate("test", target)).rejects.toThrow(
                "Unsupported template engine: unsupported"
            );
        });
    });

    describe("Error Handling", () => {
        test("should handle malformed target configuration", async () => {
            const malformedTarget = {
                path: "test.json",
                variables: testData,
                // Missing required 'type' property
            } as any;

            expect(
                generator.generate("test", malformedTarget)
            ).rejects.toThrow();
        });

        test("should handle circular references in variables", async () => {
            const circularData: any = {name: "test"};
            circularData.self = circularData;

            const target: ZodTarget = {
                type: "json",
                path: "circular.json",
                variables: circularData,
                generate_meta: false,
            };

            const result = await generator.generate("test", target);
            expect(result.content).toBeTruthy();
            // The generator should handle circular references gracefully
        });

        test("should provide meaningful error messages", async () => {
            const target: ZodTarget = {
                type: "json",
                path: "/root/invalid/path/file.json",
                variables: testData,
                generate_meta: false,
            };

            try {
                await generator.generateAndWrite("test", target);
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                expect(error).toBeTruthy();
                expect(error instanceof Error).toBe(true);
            }
        });
    });
});

async function createTestTemplates() {
    // Nunjucks config template
    fs.writeFileSync(
        path.join(TEMPLATES_DIR, "config.njk"),
        `server_name={{ name }}
version={{ version }}
db_host={{ database.host }}
db_port={{ database.port }}
timeout={{ timeout }}
`
    );

    // Handlebars config template
    fs.writeFileSync(
        path.join(TEMPLATES_DIR, "config.hbs"),
        `App: {{ name }}
Version: {{ version }}
Database: {{ database.host }}:{{ database.port }}
{{#if database.ssl}}
SSL: enabled
{{else}}
SSL: disabled
{{/if}}
`
    );

    // Template with metadata
    fs.writeFileSync(
        path.join(TEMPLATES_DIR, "metadata.njk"),
        `# Generated configuration
generated_by={{ _meta.generator }}
generated_at={{ _meta.generated_at }}
target_path={{ _meta.target_path }}

# Application config
app_name={{ name }}
app_version={{ version }}
`
    );
}
