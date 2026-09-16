// Local dev = the Blocklet served by a dedicated ARC instance. Nothing else:
// the pages are real ARC web-device pages now, so there is no proxy to run.
// The campaign service (`npm start`) is separate and optional until it moves
// onto ARC; without it the pages render in their "not open yet" state.
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { cli, requireRuntime } from "./runtime.mjs";
requireRuntime();
const instance = "fomo4good-local",
	port = Number(process.env.ARC_PORT || 4930),
	blocklet = resolve("blocklets/fomo4good");
const statusResult = spawnSync(
	process.execPath,
	[cli, "service", "status", "--instance", instance, "--json"],
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
			`The ${instance} ARC instance belongs to another source directory or port. Stop that specific instance before starting this checkout.`,
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
			instance,
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
console.log(`
FOMO4GOOD pages:
  http://fomo4good.localhost:${port}/            real campaign
  http://fomo4good.localhost:${port}/practice/   FUSD practice
Edit blocklets/fomo4good and reload. Stop with:
  node ${cli} service stop --instance ${instance}
`);
