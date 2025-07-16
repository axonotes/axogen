import {foo, version} from "./index.ts";

const args = process.argv.slice(2);

if (args.includes("--version")) {
    console.log(`axogen v${version}`);
} else if (args.includes("--test")) {
    console.log(foo("CLI"));
} else {
    console.log("axogen CLI is working! 🎉");
    console.log("Try: axogen --version or axogen --test");
}
