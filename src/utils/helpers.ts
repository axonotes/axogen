import * as z from "zod";

export type ZodIssueError = {
    field: string;
    message: string;
    type: "missing" | "invalid" | "type";
};

/**
 * Converts Zod validation issues to user-friendly error objects
 * Supports all Zod v4 issue types with comprehensive error handling
 */
export function zodIssuesToErrors(issues: z.core.$ZodIssue[]): ZodIssueError[] {
    return issues.map((issue) => {
        const field = formatFieldPath(issue.path);

        // Determine error type based on Zod error codes
        let type: "missing" | "invalid" | "type" = "invalid";
        let message = issue.message;

        // Handle each issue type with specific logic and user-friendly messages
        switch (issue.code) {
            case "invalid_type": {
                const typedIssue = issue as any;

                // Check if it's actually a missing field by looking at the message content
                const isMissing =
                    issue.message.includes("received undefined") ||
                    issue.message.includes("Required") ||
                    issue.message.includes("required");

                type = isMissing ? "missing" : "type";

                if (type === "missing") {
                    message = field
                        ? `${field} is required`
                        : "This field is required";
                } else {
                    // It's a type mismatch - extract expected type from issue or message
                    if (typedIssue.expected) {
                        message = field
                            ? `${field} must be a ${typedIssue.expected}`
                            : `Must be a ${typedIssue.expected}`;
                    } else {
                        // Fallback: try to extract from the default message
                        const match = issue.message.match(/expected (\w+)/);
                        const expectedType = match ? match[1] : "valid value";
                        message = field
                            ? `${field} must be a ${expectedType}`
                            : `Must be a ${expectedType}`;
                    }
                }
                break;
            }

            case "too_small": {
                const sizeIssue = issue as any;

                if (sizeIssue.minimum !== undefined) {
                    if (field.includes(".") || field.includes("[")) {
                        // For nested fields, use generic "too small" messages
                        if (sizeIssue.inclusive) {
                            message = field
                                ? `${field} must be at least ${sizeIssue.minimum}`
                                : `Must be at least ${sizeIssue.minimum}`;
                        } else {
                            message = field
                                ? `${field} must be greater than ${sizeIssue.minimum}`
                                : `Must be greater than ${sizeIssue.minimum}`;
                        }
                    } else {
                        // For top-level fields, try to determine type from context
                        const minValue = sizeIssue.minimum;
                        if (
                            typeof minValue === "number" &&
                            minValue < 1000 &&
                            minValue > -1000
                        ) {
                            // Likely a string length or array length
                            const unit =
                                minValue === 1 ? "character" : "characters";
                            message = field
                                ? `${field} must be at least ${minValue} ${unit}`
                                : `Must be at least ${minValue} ${unit}`;
                        } else {
                            // Likely a number value
                            const comparator = sizeIssue.inclusive ? ">=" : ">";
                            message = field
                                ? `${field} must be ${comparator} ${minValue}`
                                : `Must be ${comparator} ${minValue}`;
                        }
                    }
                }
                break;
            }

            case "too_big": {
                const sizeIssue = issue as any;

                if (sizeIssue.maximum !== undefined) {
                    if (field.includes(".") || field.includes("[")) {
                        // For nested fields, use generic "too big" messages
                        if (sizeIssue.inclusive) {
                            message = field
                                ? `${field} must be at most ${sizeIssue.maximum}`
                                : `Must be at most ${sizeIssue.maximum}`;
                        } else {
                            message = field
                                ? `${field} must be less than ${sizeIssue.maximum}`
                                : `Must be less than ${sizeIssue.maximum}`;
                        }
                    } else {
                        // For top-level fields, try to determine type from context
                        const maxValue = sizeIssue.maximum;
                        if (
                            typeof maxValue === "number" &&
                            maxValue < 1000 &&
                            maxValue > 0
                        ) {
                            // Likely a string length or array length
                            const unit =
                                maxValue === 1 ? "character" : "characters";
                            message = field
                                ? `${field} must be at most ${maxValue} ${unit}`
                                : `Must be at most ${maxValue} ${unit}`;
                        } else {
                            // Likely a number value
                            const comparator = sizeIssue.inclusive ? "<=" : "<";
                            message = field
                                ? `${field} must be ${comparator} ${maxValue}`
                                : `Must be ${comparator} ${maxValue}`;
                        }
                    }
                }
                break;
            }

            case "invalid_format": {
                const formatIssue = issue as any;

                if (formatIssue.format) {
                    const formatMessages: Record<string, string> = {
                        email: "valid email address",
                        url: "valid URL",
                        uuid: "valid UUID",
                        regex: "valid format",
                        cuid: "valid CUID",
                        cuid2: "valid CUID2",
                        ulid: "valid ULID",
                        datetime: "valid datetime",
                        ip: "valid IP address",
                        base64: "valid base64 string",
                        nanoid: "valid NanoID",
                    };

                    const formatName =
                        formatMessages[formatIssue.format] || "valid format";
                    message = field
                        ? `${field} must be a ${formatName}`
                        : `Must be a ${formatName}`;
                }
                break;
            }

            case "invalid_value": {
                const valueIssue = issue as any;

                if (valueIssue.options && Array.isArray(valueIssue.options)) {
                    message = field
                        ? `${field} must be one of: ${valueIssue.options.join(", ")}`
                        : `Must be one of: ${valueIssue.options.join(", ")}`;
                } else if (valueIssue.expected) {
                    message = field
                        ? `${field} must be ${valueIssue.expected}`
                        : `Must be ${valueIssue.expected}`;
                }
                break;
            }

            case "unrecognized_keys": {
                const keysIssue = issue as any;

                if (keysIssue.keys && Array.isArray(keysIssue.keys)) {
                    const keys = keysIssue.keys.join(", ");
                    message = field
                        ? `${field} contains unrecognized keys: ${keys}`
                        : `Unrecognized keys: ${keys}`;
                }
                break;
            }

            case "invalid_union": {
                message = field
                    ? `${field} does not match any of the expected types`
                    : "Does not match any of the expected types";
                break;
            }

            case "invalid_key": {
                message = field
                    ? `${field} contains an invalid key`
                    : "Contains an invalid key";
                break;
            }

            case "invalid_element": {
                message = field
                    ? `${field} contains an invalid element`
                    : "Contains an invalid element";
                break;
            }

            case "not_multiple_of": {
                const multipleIssue = issue as any;

                if (multipleIssue.multipleOf !== undefined) {
                    message = field
                        ? `${field} must be a multiple of ${multipleIssue.multipleOf}`
                        : `Must be a multiple of ${multipleIssue.multipleOf}`;
                }
                break;
            }

            case "custom": {
                // For custom validations, use the provided message or fall back to a generic one
                if (!message || message === "Invalid input") {
                    message = field ? `${field} is invalid` : "Invalid value";
                }
                break;
            }

            // Handle any additional or unknown issue codes
            default: {
                if (!message || message === "Invalid input") {
                    message = field ? `${field} is invalid` : "Invalid value";
                }
                break;
            }
        }

        return {
            field,
            message,
            type,
        };
    });
}

/**
 * Formats the field path from Zod's path array into a readable string
 * Examples:
 * - [] -> ""
 * - ["name"] -> "name"
 * - ["user", "address", "street"] -> "user.address.street"
 * - ["items", 0, "name"] -> "items[0].name"
 */
function formatFieldPath(path: PropertyKey[]): string {
    if (path.length === 0) return "";

    return path.reduce<string>((acc, segment, index) => {
        if (typeof segment === "number") {
            return `${acc}[${segment}]`;
        }

        if (index === 0) {
            return String(segment);
        }

        return `${acc}.${String(segment)}`;
    }, "");
}
