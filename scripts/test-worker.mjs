import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { arcHome } from "./runtime.mjs";
const require = createRequire(
	resolve(arcHome, "runtimes/cloudflare/package.json"),
);
const { Miniflare } = require("miniflare");
const { applyMigrations, collectMigrations } = await import(
	resolve(arcHome, "runtimes/cloudflare/scripts/apply-d1-migrations.mjs")
);
const worker = {
	name: "fomo-provider",
	modules: [{ type: "ESModule", path: resolve("dist/worker/index.mjs") }],
	compatibilityDate: "2026-09-15",
	compatibilityFlags: ["nodejs_compat"],
	durableObjects: { FOMO_CAMPAIGN: "FomoCampaign" },
	d1Databases: { FOMO_INDEX: "fomo-test" },
	r2Buckets: { FOMO_OBJECTS: "fomo-test" },
	bindings: {
		FOMO_MODE: "practice",
		FOMO_ORIGIN: "http://localhost:4931",
		FOMO_OWNER_DID: "did:abt:fomo-worker-test",
		FOMO_INSTANCE_DID: "did:abt:fomo-campaign-test",
	},
};
const host = {
	name: "test-host",
	modules: [{ type: "ESModule", path: resolve("dist/worker/test-host.mjs") }],
	compatibilityDate: "2026-09-15",
	compatibilityFlags: ["nodejs_compat"],
	serviceBindings: { FOMO_PROVIDER: "fomo-provider" },
};
const gateway = {
	name: "gateway",
	modules: [{ type: "ESModule", path: resolve("dist/worker/gateway.mjs") }],
	compatibilityDate: "2026-09-15",
	compatibilityFlags: ["nodejs_compat"],
	bindings: {
		FOMO_ORIGIN: "https://game.test",
	},
	serviceBindings: {
		FOMO_PROVIDER: "fomo-provider",
	},
	ratelimits: { FOMO_RATE_LIMITER: { simple: { limit: 30, period: 60 } } },
};
const mf = new Miniflare({ workers: [host, worker, gateway] });
try {
	await mf.ready;
	await applyMigrations(
		await mf.getD1Database("FOMO_INDEX", "fomo-provider"),
		await collectMigrations({ owner: "did-space" }),
	);
	const call = async (method, path, args) => {
		const response = await mf.dispatchFetch("https://internal/afs/" + method, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ path, args }),
		});
		const result = await response.json();
		assert.equal(response.status, 200, JSON.stringify(result));
		return result;
	};
	const token = "a".repeat(64),
		input = {
			amount: "5",
			team: "dogs",
			name: "Worker test",
			requestId: crypto.randomUUID(),
		};
	assert.equal(
		(await call("exec", "/practice/.actions/session", { token })).data.balance,
		"1000",
	);
	assert.equal(
		(await call("exec", "/practice/.actions/donate", { token, input })).data
			.wallet.balance,
		"995",
	);
	assert.equal(
		(await call("exec", "/practice/.actions/donate", { token, input })).data
			.wallet.balance,
		"995",
	);
	const practice = (await call("read", "/practice")).data.content;
	assert.equal(practice.community, "5");
	assert.equal(practice.currency, "FUSD");
	assert.equal(practice.wallet, null);
	assert.equal((await call("read", "/real")).data.content.community, "0");
	await mf.setOptions({
		workers: [
			host,
			{ ...worker, bindings: { ...worker.bindings, TEST_RESTART: "2" } },
			gateway,
		],
	}); // Recreate isolates while retaining Miniflare storage.
	assert.equal(
		(await call("exec", "/practice/.actions/session", { token })).data.balance,
		"995",
	);
	const denied = await mf.dispatchFetch("https://internal/afs/read", {
		method: "POST",
		body: JSON.stringify({ path: "/campaign/ledger.json" }),
	});
	assert.equal((await denied.json()).success, false);
	const edge = await mf.getWorker("gateway");
	const post = (path, body, cookie = "", origin = "https://game.test") =>
		edge.fetch("https://game.test" + path, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Origin: origin,
				Cookie: cookie,
				"CF-Connecting-IP": "192.0.2.1",
			},
			body: JSON.stringify(body),
		});
	assert.equal(
		(await post("/api/practice/session", {}, "", "https://evil.test")).status,
		403,
	);
	const session = await post("/api/practice/session", {});
	assert.equal(session.status, 200);
	const cookie = session.headers.get("set-cookie").split(";")[0];
	assert.ok(session.headers.get("set-cookie").includes("HttpOnly"));
	assert.ok(session.headers.get("set-cookie").includes("Secure"));
	const gatewayInput = {
		...input,
		requestId: crypto.randomUUID(),
		token: "b".repeat(64),
	};
	const donated = await post("/api/practice/donate", gatewayInput, cookie);
	assert.equal((await donated.json()).wallet.balance, "995");
	const state = await edge.fetch("https://game.test/api/practice/state", {
		headers: { Cookie: cookie },
	});
	assert.equal((await state.json()).wallet.balance, "995");
	assert.equal(
		(await post("/api/fomo/intents", { amount: "1", team: "dogs" }, cookie))
			.status,
		409,
	);
	assert.equal((await edge.fetch("https://game.test/afs/read")).status, 404);
	// Pages belong to ARC's native site, never to the API gateway.
	for (const path of ["/", "/rules/", "/practice/rules/", "/arc/practice/rules", "/en/practice/rules/"])
		assert.equal((await edge.fetch(`https://game.test${path}`)).status, 404);

	console.log(
		"Gateway: service binding, origin/cookie identity, real-payment closure and API-only routing passed.",
	);
	console.log(
		"Workers runtime: DID Space persistence, retry dedup, restart, real/practice isolation and private-ledger denial passed.",
	);
} finally {
	await mf.dispose();
}
