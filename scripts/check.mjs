import { spawnSync } from "node:child_process";
import { cli, requireRuntime } from "./runtime.mjs";
requireRuntime();
for (const args of [
	["dsl", "lint"],
	["dsl", "validate"],
	["blocklet", "check"],
	["blocklet", "build"],
]) {
	const result = spawnSync(
		process.execPath,
		[cli, ...args, "blocklets/fomo4good"],
		{ stdio: "inherit" },
	);
	if (result.error) throw result.error;
	if (result.status !== 0) process.exit(result.status || 1);
}
