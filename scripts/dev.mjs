import { spawn, spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { cli, sdk, requireRuntime } from "./runtime.mjs";
requireRuntime();
const port = Number(process.env.ARC_PORT || 4930),
	blocklet = resolve("blocklets/fomo4good");
const statusResult = spawnSync(
	process.execPath,
	[cli, "service", "status", "--instance", "fomo4good-local", "--json"],
	{ encoding: "utf8" },
);
let status;
try {
	const output = statusResult.stdout;
	status = JSON.parse(output.slice(output.indexOf("{")));
} catch {}
if (status?.status === "up") {
	if (status.port !== port || !status.blocklets?.includes(blocklet))
		throw new Error(
			"The fomo4good-local ARC instance belongs to another source directory or port. Stop that specific instance before starting this checkout.",
		);
	console.log(`Using existing ARC instance at ${status.url}`);
} else {
	const started = spawnSync(
		process.execPath,
		[
			cli,
			"service",
			"start",
			"--instance",
			"fomo4good-local",
			"--home",
			resolve("var/arc"),
			"--blocklet",
			blocklet,
			"--port",
			String(port),
		],
		{ stdio: "inherit" },
	);
	if (started.status !== 0) process.exit(started.status || 1);
}
const server = spawn(process.execPath, ["--watch", "server/index.mjs"], {
	stdio: "inherit",
	env: {
		...process.env,
		FOMO_MODE: "preview",
		ARC_DID_SPACE_MODULE: sdk,
		FOMO_ARC_URL: `http://127.0.0.1:${port}`,
	},
});
for (const signal of ["SIGINT", "SIGTERM"])
	process.on(signal, () => server.kill(signal));
server.on("error", (e) => {
	console.error(e.message);
	process.exitCode = 1;
});
server.on("exit", (exit) => {
	process.exitCode = exit || 0;
});
