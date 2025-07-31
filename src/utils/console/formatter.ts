import chalk from "chalk";

export interface TreeNode {
    tag?: string;
    text?: string;
    children: TreeNode[];
}

export type TagTransformer = (content: string) => string;
export type TagTransformers<T extends string = string> = Record<
    T,
    TagTransformer
>;

class XMLParser {
    private readonly input: string;
    private position: number;

    constructor(input: string) {
        this.input = input;
        this.position = 0;
    }

    parse(): TreeNode[] {
        const root: TreeNode[] = [];
        const stack: TreeNode[] = [{children: root}];

        while (this.position < this.input.length) {
            // Check for escaped tag delimiter
            if (this.peek() === "\\" && this.peekNext() === "<") {
                // This is an escaped tag, treat as text
                const text = this.parseText();
                if (text.length > 0) {
                    const parent = stack[stack.length - 1];
                    if (!parent) {
                        throw new Error(
                            "No parent node found for text content"
                        );
                    }
                    parent.children.push({
                        text: text,
                        children: [],
                    });
                }
            } else if (this.peek() === "<") {
                const tag = this.parseTag();
                if (tag) {
                    if (tag.isClosing) {
                        // Pop from stack when closing tag found
                        if (stack.length > 1) {
                            stack.pop();
                        }
                    } else {
                        // Create new node and push to current parent
                        const node: TreeNode = {
                            tag: tag.name,
                            children: [],
                        };

                        const parent = stack[stack.length - 1];
                        if (!parent) {
                            throw new Error("No parent node found for new tag");
                        }
                        parent.children.push(node);

                        if (!tag.isSelfClosing) {
                            stack.push(node);
                        }
                    }
                }
            } else {
                // Parse text content - preserve ALL text, including whitespace
                const text = this.parseText();
                if (text.length > 0) {
                    // Changed from text.trim() to preserve whitespace
                    const parent = stack[stack.length - 1];
                    if (!parent) {
                        throw new Error(
                            "No parent node found for text content"
                        );
                    }
                    parent.children.push({
                        text: text,
                        children: [],
                    });
                }
            }
        }

        return root;
    }

    private peek(): string {
        return this.input[this.position] || "";
    }

    private peekNext(): string {
        return this.input[this.position + 1] || "";
    }

    private advance(): string {
        const char = this.input[this.position] || "";
        this.position++;
        return char;
    }

    private parseTag(): {
        name: string;
        isClosing: boolean;
        isSelfClosing: boolean;
    } | null {
        if (this.peek() !== "<") return null;

        this.advance(); // consume '<'

        let isClosing = false;
        if (this.peek() === "/") {
            isClosing = true;
            this.advance(); // consume '/'
        }

        let tagName = "";
        while (
            this.position < this.input.length &&
            this.peek() !== ">" &&
            this.peek() !== "/" &&
            !this.isWhitespace(this.peek())
        ) {
            tagName += this.advance();
        }

        // Skip any whitespace and attributes (simple approach)
        while (
            this.position < this.input.length &&
            this.peek() !== ">" &&
            this.peek() !== "/"
        ) {
            this.advance();
        }

        let isSelfClosing = false;
        if (this.peek() === "/") {
            isSelfClosing = true;
            this.advance(); // consume '/'
        }

        if (this.peek() === ">") {
            this.advance(); // consume '>'
        }

        return {
            name: tagName.trim(),
            isClosing,
            isSelfClosing,
        };
    }

    private parseText(): string {
        let text = "";
        while (this.position < this.input.length) {
            const current = this.peek();

            if (current === "\\") {
                const next = this.peekNext();
                if (next === "<" || next === ">") {
                    // Escaped angle bracket: \< becomes < and \> becomes >
                    text += next;
                    this.advance(); // consume '\'
                    this.advance(); // consume '<' or '>'
                } else if (next === "\\") {
                    // Escaped backslash: \\ becomes \
                    text += "\\";
                    this.advance(); // consume first '\'
                    this.advance(); // consume second '\'
                } else {
                    // Not an escape sequence, just a regular backslash
                    text += this.advance();
                }
            } else if (current === "<") {
                // Unescaped tag start, stop parsing text
                break;
            } else {
                // Regular character
                text += this.advance();
            }
        }
        return text;
    }

    private isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }
}

class TreeTransformer {
    private transformers: TagTransformers;

    constructor(transformers: TagTransformers) {
        this.transformers = transformers;
    }

    transform(nodes: TreeNode[]): string {
        return nodes.map((node) => this.transformNode(node)).join("");
    }

    private transformNode(node: TreeNode): string {
        // First, process all children (bottom-up approach)
        const childrenContent = node.children
            .map((child) => this.transformNode(child))
            .join("");

        // If this is a text node, return the text
        if (node.text !== undefined) {
            return node.text;
        }

        // If this is a tag node, apply transformation if available
        if (node.tag && this.transformers[node.tag]) {
            return this.transformers[node.tag]!(childrenContent);
        }

        console.warn(
            chalk.redBright(
                `No transformer found for tag: ${node.tag}. Returning content as-is.`
            )
        );

        // If no transformer found, return content as-is
        return childrenContent;
    }
}

// Main function to parse and transform XML-like strings
export function parseAndTransform(
    input: string,
    transformers: TagTransformers
): string {
    const parser = new XMLParser(input);
    const tree = parser.parse();
    const transformer = new TreeTransformer(transformers);
    return transformer.transform(tree);
}

// Utility function to test the parser
export function debugParse(input: string): TreeNode[] {
    const parser = new XMLParser(input);
    return parser.parse();
}
