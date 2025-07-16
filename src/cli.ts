import {Command} from "commander";
import {getVersion} from "./version.ts";

const cli = new Command();

cli.version(getVersion());

cli.parse();
