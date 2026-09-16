import { builtinModules, createRequire } from "node:module";
import { resolve } from "node:path";
import { arcHome } from "./runtime.mjs";
const require = createRequire(
	resolve(arcHome, "runtimes/cloudflare/package.json"),
);
const { build } = require("esbuild");
const aliases = {
	"@aigne/afs-http": resolve(arcHome, "providers/basic/http/dist/index.mjs"),
	"@aigne/afs-session": resolve(arcHome, "packages/session/dist/index.mjs"),
	"@aigne/afs": resolve(arcHome, "packages/core/dist/index.mjs"),
	"@aigne/afs-evm": resolve(arcHome, "providers/runtime/evm/dist/index.mjs"),
	"@aigne/afs-did-space/cloudflare": resolve(
		arcHome,
		"providers/basic/did-space/dist/cloudflare.mjs",
	),
	ufo: require.resolve("ufo"),
};
await build({
	entryPoints: {
		gateway: "worker/gateway.mjs",
		index: "worker/index.mjs",
		"test-host": "test/fixtures/worker-host.mjs",
	},
	outdir: "dist/worker",
	outExtension: { ".js": ".mjs" },
	bundle: true,
	format: "esm",
	platform: "browser",
	target: "es2022",
	mainFields: ["module", "main"],
	conditions: ["workerd", "worker", "browser"],
	external: ["node:*", "cloudflare:*", ...builtinModules],
	plugins: [
		{
			name: "arc-checkout",
			setup(build) {
				build.onResolve({ filter: /^(node:)?module$/ }, (args) =>
					args.namespace === "worker-module"
						? { path: "node:module", external: true }
						: { path: "module", namespace: "worker-module" },
				);
				build.onLoad({ filter: /.*/, namespace: "worker-module" }, () => ({
					contents:
						"import { createRequire as native } from 'node:module'; export function createRequire() { return native('/worker/index.mjs'); }",
					loader: "js",
				}));
				build.onResolve(
					{
						filter:
							/^(@aigne\/afs(?:-http|-session|-evm|-did-space\/cloudflare)?|ufo)$/,
					},
					(args) => (aliases[args.path] ? { path: aliases[args.path] } : null),
				);
			},
		},
	],
	tsconfigRaw: { compilerOptions: { experimentalDecorators: true } },
	metafile: true,
}).then(async (result) => {
	const { writeFile } = await import("node:fs/promises");
	await writeFile(
		"dist/worker/meta.json",
		JSON.stringify(result.metafile, null, 2),
	);
});
console.log("Built private FOMO provider Worker. No deployment performed.");

const { collectMigrations } = await import(
	resolve(arcHome, "runtimes/cloudflare/scripts/apply-d1-migrations.mjs")
);
const { mkdir, writeFile } = await import("node:fs/promises");
await mkdir("dist/worker/migrations", { recursive: true });
for (const migration of await collectMigrations({ owner: "did-space" }))
	await writeFile(
		resolve("dist/worker/migrations", migration.name),
		migration.sql,
	);
