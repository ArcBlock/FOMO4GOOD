import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
export const arcHome = resolve(
	process.env.ARC_HOME || fileURLToPath(new URL("../../arc/", import.meta.url)),
);
export const cli =
	process.env.ARC_CLI || resolve(arcHome, "runtimes/node/dist/cli.mjs");
export const sdk =
	process.env.ARC_DID_SPACE_MODULE ||
	resolve(arcHome, "providers/basic/did-space/dist/local.mjs");
export function requireRuntime() {
	if (!existsSync(cli) || !existsSync(sdk))
		throw new Error(
			"Built ARC runtime required. Set ARC_HOME to your arc checkout, or ARC_CLI and ARC_DID_SPACE_MODULE explicitly.",
		);
}
