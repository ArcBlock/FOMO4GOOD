import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configuration } from "../server/config.mjs";
import { openSpace } from "../server/space.mjs";
import { Store } from "../server/store.mjs";
import { createApp } from "../server/app.mjs";

async function listen(t, extra = {}) {
	const root = await mkdtemp(join(tmpdir(), "fomo-app-"));
	const config = {
		...configuration({
			FOMO_MODE: "preview",
			FOMO_SPACE_ROOT: root,
		}),
		origin: "http://fomo.test",
		...extra,
	};
	const space = await openSpace(config);
	const store = new Store(space.afs, config);
	await store.init();
	const server = createApp(config, store, null, null);
	await new Promise((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", resolve);
	});
	server.ready = true;
	const { port } = server.address();
	t.after(async () => {
		await new Promise((resolve) => server.close(resolve));
		await space.close();
		await rm(root, { recursive: true, force: true });
	});
	const call = (path, { method = "GET", body } = {}) =>
		fetch(`http://127.0.0.1:${port}${path}`, {
			method,
			headers: body
				? {
						"Content-Type": "application/json",
						Origin: config.origin,
					}
				: {},
			body: body ? JSON.stringify(body) : undefined,
		});
	return { call, store, config };
}

test("real donation APIs stay closed without FOMO_ACCEPT_REAL", async (t) => {
	const { call } = await listen(t);
	const state = await (await call("/arc/api/fomo/state")).json();
	assert.equal(state.mode, "unavailable");
	assert.equal(state.campaign.accepting, false);
	assert.equal(
		(await call("/arc/api/fomo/intents", { method: "POST", body: { amount: "1", team: "dogs" } })).status,
		409,
	);
});

test("loopback testnet opens intents and GET /arc/api/fomo/intents/:id", async (t) => {
	const { call, store } = await listen(t, {
		acceptReal: true,
		mode: "testnet",
		preview: false,
		recipient: "0xed738956c3f0afc89044a99c8fb8eeda352db353",
		startsAt: Date.parse("2026-01-01T00:00:00.000Z"),
		endsAt: Date.parse("2027-01-01T00:00:00.000Z"),
	});
	await store.batch([], { block: 10, hash: "0xabc" }, Date.now());
	const state = await (await call("/arc/api/fomo/state")).json();
	assert.equal(state.mode, "testnet");
	assert.equal(state.campaign.accepting, true);
	assert.equal(state.payment.recipient, "0xed738956c3f0afc89044a99c8fb8eeda352db353");
	const created = await call("/arc/api/fomo/intents", {
		method: "POST",
		body: { amount: "1", team: "dogs", name: "Local tester" },
	});
	assert.equal(created.status, 201);
	const intent = await created.json();
	assert.match(intent.amount, /^1\.\d{1,6}$/);
	const fetched = await call(`/arc/api/fomo/intents/${intent.id}`);
	assert.equal(fetched.status, 200);
	assert.equal((await fetched.json()).id, intent.id);
	assert.equal(
		(await call(`/api/fomo/intents/${intent.id}`)).status,
		404,
	);
});
