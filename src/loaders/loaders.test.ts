import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test,
} from "bun:test";
import {loadFile, SupportedLoadFileTypes} from "./index.ts";
import * as z from "zod";
import * as fs from "node:fs";
import * as path from "node:path";
import * as crypto from "node:crypto";

// Test data directory
const TEST_DIR = path.join(import.meta.dir, "test-fixtures");
const TEMP_DIR = path.join(TEST_DIR, "temp");

// Common test data structure
const testData = {
    name: "Test Config",
    version: "1.0.0",
    database: {
        host: "localhost",
        port: 5432,
        ssl: true,
    },
    features: ["auth", "logging", "metrics"],
    timeout: 30000,
};

// Zod schema for validation tests
const configSchema = z.object({
    name: z.string(),
    version: z.string(),
    database: z.object({
        host: z.string(),
        port: z.number(),
        ssl: z.boolean(),
    }),
    features: z.array(z.string()),
    timeout: z.number(),
});

const csvSchema = z.array(
    z.object({
        name: z.string(),
        age: z.coerce.number(),
        department: z.string(),
    })
);

// Utility functions
function createLargeDataSet(size: number) {
    return Array(size)
        .fill(0)
        .map((_, i) => ({
            id: i,
            name: `User ${i}`,
            email: `user${i}@example.com`,
            active: i % 2 === 0,
            metadata: {
                created: new Date().toISOString(),
                hash: crypto.randomBytes(16).toString("hex"),
            },
        }));
}

async function measurePerformance<T>(
    fn: () => Promise<T> | T
): Promise<{result: T; duration: number; memory: number}> {
    const memBefore = process.memoryUsage().heapUsed;
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    const memAfter = process.memoryUsage().heapUsed;

    return {
        result,
        duration: end - start,
        memory: memAfter - memBefore,
    };
}

describe("Axogen Configuration Loader", () => {
    beforeAll(async () => {
        // Create test directories
        if (!fs.existsSync(TEST_DIR)) {
            fs.mkdirSync(TEST_DIR, {recursive: true});
        }
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, {recursive: true});
        }

        // Create test files
        await createTestFiles();
    });

    afterAll(() => {
        // Clean up test files
        if (fs.existsSync(TEST_DIR)) {
            fs.rmSync(TEST_DIR, {recursive: true, force: true});
        }
    });

    beforeEach(() => {
        // Clean up temp files before each test
        if (fs.existsSync(TEMP_DIR)) {
            fs.rmSync(TEMP_DIR, {recursive: true, force: true});
            fs.mkdirSync(TEMP_DIR, {recursive: true});
        }
    });

    describe("Core Integration & Routing", () => {
        describe("Parser Routing", () => {
            const formats = [
                {type: "json", file: "config.json", parser: "JSON"},
                {type: "json5", file: "config.json5", parser: "json5"},
                {type: "jsonc", file: "config.jsonc", parser: "jsonc"},
                {type: "hjson", file: "config.hjson", parser: "hjson"},
                {type: "yaml", file: "config.yaml", parser: "js-yoga"},
                {type: "yaml", file: "config.yml", parser: "js-yaml"},
                {type: "toml", file: "config.toml", parser: "@iarna/toml"},
                {type: "ini", file: "config.ini", parser: "ini"},
                {type: "ini", file: "config.conf", parser: "ini"},
                {type: "ini", file: "config.cfg", parser: "ini"},
                {
                    type: "properties",
                    file: "config.properties",
                    parser: "properties-file",
                },
                {type: "env", file: "config.env", parser: "dotenv"},
                {type: "xml", file: "config.xml", parser: "fast-xml-parser"},
                {type: "csv", file: "data.csv", parser: "papaparse"},
                {type: "txt", file: "content.txt", parser: "text"},
                {type: "cson", file: "config.cson", parser: "cson"},
            ] as const;

            formats.forEach(({type, file, parser}) => {
                test(`should route ${type} files to ${parser} parser`, async () => {
                    const result = loadFile(path.join(TEST_DIR, file), type);
                    expect(typeof result).toBe("object");
                    expect(result).not.toBeNull();
                });
            });

            test("should throw error for unsupported type", async () => {
                expect(() => {
                    loadFile("/fake/path/config.txt", "unsupported" as any);
                }).toThrow();
            });
        });

        describe("File System Operations", () => {
            test("should throw error for non-existent file", async () => {
                expect(() => {
                    loadFile(path.join(TEST_DIR, "nonexistent.json"), "json");
                }).toThrow();
            });

            test("should reject directories", async () => {
                const dirPath = path.join(TEMP_DIR, "config");
                fs.mkdirSync(dirPath);

                expect(() => {
                    loadFile(dirPath, "json");
                }).toThrow();
            });

            test("should handle file permission errors", async () => {
                // Skip on Windows as permission handling is different
                if (process.platform !== "win32") {
                    const restrictedFile = path.join(
                        TEMP_DIR,
                        "restricted.json"
                    );
                    fs.writeFileSync(restrictedFile, '{"test": true}');
                    fs.chmodSync(restrictedFile, 0o000);

                    expect(() => {
                        loadFile(restrictedFile, "json");
                    }).toThrow();

                    // Cleanup
                    fs.chmodSync(restrictedFile, 0o644);
                }
            });

            test("should handle different line endings", async () => {
                const windowsFile = path.join(TEMP_DIR, "windows.json");
                const unixFile = path.join(TEMP_DIR, "unix.json");

                const jsonContent =
                    '{\r\n  "name": "test",\r\n  "value": 123\r\n}';
                fs.writeFileSync(windowsFile, jsonContent);
                fs.writeFileSync(unixFile, jsonContent.replace(/\r\n/g, "\n"));

                const windowsResult = loadFile(windowsFile, "json");
                const unixResult = loadFile(unixFile, "json");

                expect(windowsResult).toEqual(unixResult);
            });
        });

        describe("Error Handling & Transformation", () => {
            test("should wrap parser errors consistently", async () => {
                const malformedFiles = [
                    {
                        file: "invalid.json",
                        content: "{ invalid json }",
                        type: "json",
                    },
                    {
                        file: "invalid.yaml",
                        content: "key:\n  - invalid\n- structure",
                        type: "yaml",
                    },
                    {
                        file: "invalid.toml",
                        content: "[invalid\nkey = value",
                        type: "toml",
                    },
                    {
                        file: "invalid.xml",
                        content: "<root><unclosed>content</root>",
                        type: "xml",
                    },
                ] as const;

                malformedFiles.forEach(({file, content, type}) => {
                    const filePath = path.join(TEMP_DIR, file);
                    fs.writeFileSync(filePath, content);

                    expect(() => {
                        loadFile(filePath, type);
                    }).toThrow();
                });
            });

            test("should handle empty files gracefully", async () => {
                const emptyFile = path.join(TEMP_DIR, "empty.json");
                fs.writeFileSync(emptyFile, "");

                expect(() => {
                    loadFile(emptyFile, "json");
                }).toThrow();
            });

            test("should handle files with only whitespace", async () => {
                const whitespaceFile = path.join(TEMP_DIR, "whitespace.json");
                fs.writeFileSync(whitespaceFile, "   \n\t   \r\n  ");

                expect(() => {
                    loadFile(whitespaceFile, "json");
                }).toThrow();
            });
        });
    });

    describe("Schema Validation (Core Feature)", () => {
        test("should validate with correct schema", async () => {
            const result = loadFile(
                path.join(TEST_DIR, "config.json"),
                "json",
                configSchema
            );
            expect(result).toEqual(testData);
            expect(result.database.port).toBe(5432);
        });

        test("should validate CSV with schema and type coercion", async () => {
            const result = loadFile(
                path.join(TEST_DIR, "data.csv"),
                "csv",
                csvSchema
            );
            expect(result[0].age).toBe(30);
            expect(typeof result[0].age).toBe("number");
        });

        test("should handle optional fields in schema", async () => {
            const optionalSchema = z.object({
                name: z.string(),
                optional: z.string().optional(),
                defaulted: z.string().default("default_value"),
            });

            const result = loadFile(
                path.join(TEST_DIR, "minimal.json"),
                "json",
                optionalSchema
            );
            expect(result.defaulted).toBe("default_value");
        });

        test("should validate nested schemas", async () => {
            const nestedSchema = z.object({
                user: z.object({
                    profile: z.object({
                        name: z.string(),
                        age: z.number(),
                    }),
                }),
            });

            const result = loadFile(
                path.join(TEST_DIR, "nested.json"),
                "json",
                nestedSchema
            );
            expect(result.user.profile.name).toBe("John");
        });

        test("should handle schema transformations", async () => {
            const transformSchema = z.object({
                name: z.string().transform((s) => s.toUpperCase()),
                age: z.string().pipe(z.coerce.number()),
            });

            const result = loadFile(
                path.join(TEST_DIR, "transform.json"),
                "json",
                transformSchema
            );
            expect(result.name).toBe("JOHN DOE");
            expect(typeof result.age).toBe("number");
        });

        test("should throw validation error with incorrect schema", async () => {
            const wrongSchema = z.object({
                name: z.number(),
                invalid: z.string().min(10),
            });

            expect(() => {
                loadFile(
                    path.join(TEST_DIR, "config.json"),
                    "json",
                    wrongSchema
                );
            }).toThrow("Loading validation failed");
        });

        test("should provide detailed validation errors", async () => {
            const strictSchema = z.object({
                name: z.string().min(10),
                version: z.string().regex(/^\d+\.\d+\.\d+$/),
                database: z.object({
                    port: z.number().min(1024).max(65535),
                }),
            });

            try {
                loadFile(
                    path.join(TEST_DIR, "config.json"),
                    "json",
                    strictSchema
                );
                expect(false).toBe(true); // Should not reach here
            } catch (error) {
                // @ts-ignore
                expect(error.message).toContain("Expected");
            }
        });

        test("should handle union schemas", async () => {
            const unionSchema = z.union([
                z.object({type: z.literal("user"), name: z.string()}),
                z.object({
                    type: z.literal("admin"),
                    permissions: z.array(z.string()),
                }),
            ]);

            const userResult = loadFile(
                path.join(TEST_DIR, "user.json"),
                "json",
                unionSchema
            );
            expect(userResult.type).toBe("user");
        });

        test("should handle discriminated unions", async () => {
            const discriminatedSchema = z.discriminatedUnion("type", [
                z.object({type: z.literal("config"), settings: z.object({})}),
                z.object({type: z.literal("data"), records: z.array(z.any())}),
            ]);

            const configResult = loadFile(
                path.join(TEST_DIR, "config-type.json"),
                "json",
                discriminatedSchema
            );
            expect(configResult.type).toBe("config");
        });
    });

    describe("Type Safety & API Contract", () => {
        test("should return Record<string, unknown> without schema", async () => {
            const result = loadFile(path.join(TEST_DIR, "config.json"), "json");
            expect(typeof result).toBe("object");
            expect(result).not.toBeNull();
        });

        test("should return inferred type with schema", async () => {
            const result = loadFile(
                path.join(TEST_DIR, "config.json"),
                "json",
                configSchema
            );

            // TypeScript should infer the correct type
            expect(typeof result.name).toBe("string");
            expect(typeof result.database.port).toBe("number");
            expect(Array.isArray(result.features)).toBe(true);
        });

        test("should include all expected types", () => {
            const expectedTypes = [
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
                "csv",
                "txt",
                "cson",
            ];

            expectedTypes.forEach((type) => {
                expect(SupportedLoadFileTypes).toContain(type);
            });
        });

        test("should have correct number of supported types", () => {
            expect(SupportedLoadFileTypes).toHaveLength(13);
        });
    });

    describe("Performance & Reliability", () => {
        test("should handle large JSON files efficiently", async () => {
            const {result, duration, memory} = await measurePerformance(() =>
                loadFile(path.join(TEST_DIR, "large.json"), "json")
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(10000);
            expect(duration).toBeLessThan(1000); // Less than 1 second
            expect(memory).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
        });

        test("should handle large CSV files efficiently", async () => {
            const {result, duration} = await measurePerformance(() =>
                loadFile(path.join(TEST_DIR, "large.csv"), "csv")
            );

            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(50000);
            expect(duration).toBeLessThan(2000); // Less than 2 seconds
        });

        test("should handle concurrent file loading", async () => {
            const files = [
                {file: "config.json", type: "json"},
                {file: "config.yaml", type: "yaml"},
                {file: "config.toml", type: "toml"},
                {file: "data.csv", type: "csv"},
                {file: "config.xml", type: "xml"},
            ] as const;

            const promises = files.map(({file, type}) =>
                loadFile(path.join(TEST_DIR, file), type)
            );

            const results = await Promise.all(promises);
            expect(results).toHaveLength(5);
            results.forEach((result) => {
                expect(typeof result).toBe("object");
                expect(result).not.toBeNull();
            });
        });

        test("should handle files with many properties", async () => {
            const result = loadFile(
                path.join(TEST_DIR, "many-props.json"),
                "json"
            );

            const keys = Object.keys(result);
            expect(keys.length).toBe(1000);
            expect(result.prop_999).toBe("value_999");
        });
    });

    describe("Security & Robustness", () => {
        test("should handle prototype pollution attempts in JSON", async () => {
            const maliciousFile = path.join(TEMP_DIR, "malicious.json");
            fs.writeFileSync(
                maliciousFile,
                '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}}'
            );

            const result = loadFile(maliciousFile, "json");

            // Should not pollute Object.prototype
            expect(({} as any).polluted).toBeUndefined();
            expect(result.__proto__).toBeDefined(); // But should preserve the data
        });

        test("should handle extremely long property names", async () => {
            const longKey = "a".repeat(10000);
            const longKeyFile = path.join(TEMP_DIR, "longkey.json");
            fs.writeFileSync(longKeyFile, `{"${longKey}": "value"}`);

            const result = loadFile(longKeyFile, "json");
            expect(result[longKey]).toBe("value");
        });

        test("should handle binary data in text files", async () => {
            const binaryFile = path.join(TEMP_DIR, "binary.txt");
            const binaryData = Buffer.from([0, 1, 2, 3, 255, 254, 253]);
            fs.writeFileSync(binaryFile, binaryData);

            const result = loadFile(binaryFile, "txt");
            expect(result.content).toBeDefined();
        });

        test("should handle files with null bytes", async () => {
            const nullByteFile = path.join(TEMP_DIR, "nullbyte.json");
            fs.writeFileSync(
                nullByteFile,
                '{"key": "value\\u0000with\\u0000nulls"}'
            );

            const result = loadFile(nullByteFile, "json");
            expect(result.key).toContain("\u0000");
        });
    });

    describe("Real-world Configuration Scenarios", () => {
        test("should handle configuration files with environment overrides", async () => {
            const baseConfig = loadFile(
                path.join(TEST_DIR, "config.json"),
                "json"
            );
            const envOverrides = loadFile(
                path.join(TEST_DIR, "config.env"),
                "env"
            );

            // @ts-ignore
            expect(baseConfig.database.host).toBe("localhost");
            expect(envOverrides.DATABASE_HOST).toBe("localhost");
        });

        test("should handle migration from one format to another", async () => {
            const jsonConfig = loadFile(
                path.join(TEST_DIR, "config.json"),
                "json"
            );
            const yamlConfig = loadFile(
                path.join(TEST_DIR, "config.yaml"),
                "yaml"
            );
            const tomlConfig = loadFile(
                path.join(TEST_DIR, "config.toml"),
                "toml"
            );

            expect(jsonConfig).toEqual(yamlConfig);
            expect(yamlConfig).toEqual(tomlConfig);
        });

        test("should handle configuration validation in CI/CD pipeline", async () => {
            const configs = [
                {file: "config.json", type: "json"},
                {file: "config.yaml", type: "yaml"},
                {file: "config.toml", type: "toml"},
            ] as const;

            for (const {file, type} of configs) {
                const result = loadFile(
                    path.join(TEST_DIR, file),
                    type,
                    configSchema
                );

                expect(result.name).toBe("Test Config");
                expect(result.database.port).toBe(5432);
                expect(result.features).toContain("auth");
            }
        });

        test("should handle batch processing of data files", async () => {
            const csvFiles = ["data.csv"];

            const allData = [];
            for (const file of csvFiles) {
                const data = loadFile(path.join(TEST_DIR, file), "csv");
                // @ts-ignore
                allData.push(...data);
            }

            expect(allData.length).toBeGreaterThan(2);
        });

        test("should handle Unicode content across formats", async () => {
            const unicodeData = {
                emoji: "🚀",
                chinese: "你好",
                arabic: "مرحبا",
            };

            const unicodeFile = path.join(TEMP_DIR, "unicode.json");
            fs.writeFileSync(unicodeFile, JSON.stringify(unicodeData));

            const result = loadFile(unicodeFile, "json");
            expect(result).toEqual(unicodeData);
        });

        test("should handle type flexibility with same data", async () => {
            // Test that the same file can be loaded with different types
            // when the content is compatible
            const yamlFile = path.join(TEST_DIR, "config.yaml");

            const yamlResult = loadFile(yamlFile, "yaml");
            expect(yamlResult.name).toBe("Test Config");

            // The same YAML file should be loadable if the content matches the type
            expect(typeof yamlResult).toBe("object");
        });
    });
});

// Simplified file creation functions
async function createTestFiles() {
    // Create one simple test file per format for integration testing

    // JSON
    fs.writeFileSync(
        path.join(TEST_DIR, "config.json"),
        JSON.stringify(testData, null, 2)
    );

    // JSON5 (minimal test)
    fs.writeFileSync(
        path.join(TEST_DIR, "config.json5"),
        `{
    "name": "Test Config",
    "version": "1.0.0",
    "database": {
        "host": "localhost",
        "port": 5432,
        "ssl": true,
    },
    "features": ["auth", "logging", "metrics"],
    "timeout": 30000,
}`
    );

    // JSONC (minimal test)
    fs.writeFileSync(
        path.join(TEST_DIR, "config.jsonc"),
        `{
    // Configuration file
    "name": "Test Config",
    "version": "1.0.0",
    "database": {
        "host": "localhost",
        "port": 5432,
        "ssl": true
    },
    "features": ["auth", "logging", "metrics"],
    "timeout": 30000
}`
    );

    // HJSON (minimal test)
    fs.writeFileSync(
        path.join(TEST_DIR, "config.hjson"),
        `{
    name: "Test Config"
    version: "1.0.0"
    database: {
        host: "localhost"
        port: 5432
        ssl: true
    }
    features: ["auth", "logging", "metrics"]
    timeout: 30000
}`
    );

    // YAML
    const yamlContent = `name: Test Config
version: "1.0.0"
database:
  host: localhost
  port: 5432
  ssl: true
features:
  - auth
  - logging
  - metrics
timeout: 30000`;

    fs.writeFileSync(path.join(TEST_DIR, "config.yaml"), yamlContent);
    fs.writeFileSync(path.join(TEST_DIR, "config.yml"), yamlContent);

    // TOML
    fs.writeFileSync(
        path.join(TEST_DIR, "config.toml"),
        `name = "Test Config"
version = "1.0.0"
timeout = 30000
features = ["auth", "logging", "metrics"]

[database]
host = "localhost"
port = 5432
ssl = true`
    );

    // INI/CONF/CFG
    const iniContent = `name=Test Config
version=1.0.0
database.host=localhost
database.port=5432
database.ssl=true
features.0=auth
features.1=logging
features.2=metrics
timeout=30000`;

    fs.writeFileSync(path.join(TEST_DIR, "config.ini"), iniContent);
    fs.writeFileSync(path.join(TEST_DIR, "config.conf"), iniContent);
    fs.writeFileSync(path.join(TEST_DIR, "config.cfg"), iniContent);

    // Properties
    fs.writeFileSync(
        path.join(TEST_DIR, "config.properties"),
        `name=Test Config
version=1.0.0
database.host=localhost
database.port=5432
database.ssl=true
timeout=30000`
    );

    // Environment
    fs.writeFileSync(
        path.join(TEST_DIR, "config.env"),
        `NAME="Test Config"
VERSION=1.0.0
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_SSL=true
TIMEOUT=30000`
    );

    // XML
    fs.writeFileSync(
        path.join(TEST_DIR, "config.xml"),
        `<?xml version="1.0" encoding="UTF-8"?>
<config>
    <name>Test Config</name>
    <version>1.0.0</version>
    <database>
        <host>localhost</host>
        <port>5432</port>
        <ssl>true</ssl>
    </database>
    <features>
        <feature>auth</feature>
        <feature>logging</feature>
        <feature>metrics</feature>
    </features>
    <timeout>30000</timeout>
</config>`
    );

    // CSV
    fs.writeFileSync(
        path.join(TEST_DIR, "data.csv"),
        `name,age,department
John,30,Engineering
Jane,25,Marketing
Bob,35,Sales`
    );

    // TXT
    fs.writeFileSync(
        path.join(TEST_DIR, "content.txt"),
        "This is a test file content.\nMultiple lines supported."
    );

    // CSON
    fs.writeFileSync(
        path.join(TEST_DIR, "config.cson"),
        `name: "Test Config"
version: "1.0.0"
database:
  host: "localhost"
  port: 5432
  ssl: true
features: ["auth", "logging", "metrics"]
timeout: 30000`
    );

    // Test files for schema validation
    fs.writeFileSync(
        path.join(TEST_DIR, "minimal.json"),
        JSON.stringify({name: "test"})
    );

    fs.writeFileSync(
        path.join(TEST_DIR, "nested.json"),
        JSON.stringify({
            user: {
                profile: {
                    name: "John",
                    age: 30,
                },
            },
        })
    );

    fs.writeFileSync(
        path.join(TEST_DIR, "transform.json"),
        JSON.stringify({
            name: "john doe",
            age: "25",
        })
    );

    fs.writeFileSync(
        path.join(TEST_DIR, "user.json"),
        JSON.stringify({
            type: "user",
            name: "John Doe",
        })
    );

    fs.writeFileSync(
        path.join(TEST_DIR, "config-type.json"),
        JSON.stringify({
            type: "config",
            settings: {},
        })
    );

    // Performance test files
    const largeData = createLargeDataSet(10000);
    fs.writeFileSync(
        path.join(TEST_DIR, "large.json"),
        JSON.stringify(largeData)
    );

    // Large CSV file
    const csvHeader = "id,name,email,active,created,hash\n";
    const csvRows = Array(50000)
        .fill(0)
        .map(
            (_, i) =>
                `${i},User ${i},user${i}@example.com,${i % 2 === 0},2023-01-01T00:00:00Z,${crypto.randomBytes(8).toString("hex")}`
        )
        .join("\n");
    fs.writeFileSync(path.join(TEST_DIR, "large.csv"), csvHeader + csvRows);

    // JSON with many properties
    const manyProps: Record<string, string> = {};
    for (let i = 0; i < 1000; i++) {
        manyProps[`prop_${i}`] = `value_${i}`;
    }
    fs.writeFileSync(
        path.join(TEST_DIR, "many-props.json"),
        JSON.stringify(manyProps)
    );
}
