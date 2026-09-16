import { createRequire } from "node:module";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { arcHome } from "./runtime.mjs";
const require = createRequire(
	resolve(arcHome, "runtimes/cloudflare/package.json"),
);
const { build } = require("esbuild");
const aliases = {
	"@aigne/afs": resolve(arcHome, "packages/core/dist/index.mjs"),
	"@aigne/afs-testing": resolve(arcHome, "packages/testing/dist/index.mjs"),
	ufo: require.resolve("ufo"),
};
await build({
	entryPoints: ["providers/fomo4good/conformance.test.ts"],
	outfile: "dist/provider-conformance.test.mjs",
	bundle: true,
	platform: "node",
	format: "esm",
	external: ["bun:test", "bun"],
	tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
	plugins: [
		{
			name: "arc-checkout",
			setup(b) {
				b.onResolve({ filter: /^(@aigne\/afs(?:-testing)?|ufo)$/ }, (a) =>
					aliases[a.path] ? { path: aliases[a.path] } : null,
				);
			},
		},
	],
});
const result = spawnSync(
	"bun",
	["test", "dist/provider-conformance.test.mjs"],
	{ stdio: "inherit" },
);
if (result.error) throw result.error;
process.exit(result.status ?? 1);
