import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { configuration } from "../server/config.mjs";
import { openSpace } from "../server/space.mjs";
import { Store, UNIT } from "../server/store.mjs";
import { Watcher, decodeLogs, SYSTEM_EMITTER } from "../server/payment.mjs";
import { Interface } from "ethers";
async function fixture(t, extra = {}) {
	const root = await mkdtemp(join(tmpdir(), "fomo-test-"));
	const config = {
		...configuration({
			...process.env,
			FOMO_MODE: "preview",
			FOMO_SPACE_ROOT: root,
		}),
		...extra,
	};
	const space = await openSpace(config),
		store = new Store(space.afs, config);
	await store.init();
	t.after(async () => {
		await space.close();
		await rm(root, { recursive: true, force: true });
	});
	return { store, config, space };
}
const event = (i, at, id, extra = {}) => ({
	id,
	txHash: "0x" + id.padStart(64, "0"),
	block: 1,
	logIndex: 0,
	from: "0x" + "1".repeat(40),
	units: i.units,
	at,
	...extra,
});
test("DID Space survives reopen; countdown resets; closed round remains immutable", async (t) => {
	const { store, space, config } = await fixture(t);
	assert.equal((await store.state(1000)).round, null);
	const first = await store.intent(
		{ amount: "5", team: "dogs", name: "Dog person" },
		1000,
	);
	await store.update((s) => store.ingest(s, event(first, 2000, "a")));
	const second = await store.intent({ amount: "1", team: "water" }, 500000);
	await store.update((s) => store.ingest(s, event(second, 550000, "b")));
	assert.equal((await store.state(550000)).round.endsAt, 1150000);
	await store.state(1150000);
	const snapshot = (await store.read()).state.rounds[0];
	assert.equal(snapshot.team, "water");
	assert.equal(
		snapshot.units,
		String(BigInt(first.units) + BigInt(second.units)),
	);
	const other = new Store(space.afs, config);
	await other.init();
	assert.deepEqual((await other.read()).state.rounds[0], snapshot);
	assert.equal((await other.state(1500000)).history.length, 1);
});
test("expired/duplicate payments become rogues exactly once, preserve full native precision", async (t) => {
	const { store } = await fixture(t);
	const i = await store.intent({ amount: "10", team: "trees" }, 1000);
	const e = event(i, i.expiresAt, "expired");
	await store.update((s) => {
		store.ingest(s, e);
		store.ingest(s, e);
		store.ingest(
			s,
			event({ units: String(UNIT + 1n) }, i.expiresAt + 1, "dust"),
		);
	});
	const state = await store.state(i.expiresAt + 2);
	assert.equal(state.round, null);
	assert.equal(state.recent.length, 2);
	assert.equal(state.rogueDonors[0].units, String(BigInt(i.units) + UNIT + 1n));
	assert.equal(
		state.teams.find((x) => x.id === "kids").allocated,
		state.community,
	);
});
test("one intent can be consumed only once, exact amounts never reused, concurrent commits preserved", async (t) => {
	const { store, space, config } = await fixture(t);
	const other = new Store(space.afs, config);
	const intents = await Promise.all(
		Array.from({ length: 16 }, (_, j) =>
			(j % 2 ? store : other).intent({ amount: "1", team: "kids" }, 1000),
		),
	);
	assert.equal(new Set(intents.map((i) => i.units)).size, 16);
	assert.equal((await store.read()).state.intents.length, 16);
	await store.update((s) => {
		store.ingest(s, event(intents[0], 2000, "1"));
		store.ingest(s, event(intents[0], 3000, "2"));
	});
	const { state } = await store.read();
	assert.equal(state.payments.filter((p) => !p.rogue).length, 1);
	assert.equal(state.payments.filter((p) => p.rogue).length, 1);
});
test("campaign end caps round and does not mix ArcBlock top-ups into community totals", async (t) => {
	const { store } = await fixture(t, { startsAt: 1000, endsAt: 10000 });
	const i = await store.intent({ amount: "1", team: "internet" }, 2000);
	await store.update((s) => store.ingest(s, event(i, 3000, "1")));
	const state = await store.state(10000);
	assert.equal(state.round, null);
	assert.equal(state.history[0].closedAt, 10000);
	assert.equal(state.community, i.amount);
	assert.equal(state.teams.find((t) => t.id === "dogs").topUp, "100");
	await assert.rejects(
		store.intent({ amount: "1", team: "kids" }, 10000),
		/not accepting/,
	);
});
test("fail closed on storage failure and campaign configuration drift", async (t) => {
	const { store, space, config } = await fixture(t);
	await assert.rejects(
		new Store(space.afs, { ...config, recipient: "changed" }).init(),
		/mismatch/,
	);
	const broken = new Store(
		{
			read: async () => {
				throw new Error("disk failed");
			},
		},
		config,
	);
	await assert.rejects(broken.init(), /disk failed/);
	await assert.rejects(store.intent({ amount: "1e2", team: "dogs" }));
	await assert.rejects(
		store.intent({ amount: "1", team: "dogs", url: "javascript:alert(1)" }),
	);
});
test("system emitter counts native + ERC20 once; 18-decimal values and log order retained", () => {
	const abi = new Interface([
		"event Transfer(address indexed from,address indexed to,uint256 value)",
	]);
	const from = "0x" + "1".repeat(40),
		to = "0x" + "2".repeat(40);
	const enc = abi.encodeEventLog(abi.getEvent("Transfer"), [
		from,
		to,
		UNIT + 1n,
	]);
	const base = {
		...enc,
		address: SYSTEM_EMITTER,
		blockNumber: "0x1",
		blockHash: "0xabc",
		transactionHash: "0xdef",
		transactionIndex: "0x0",
		logIndex: "0x2",
	};
	const events = decodeLogs(
		[{ ...base, address: "0x3600000000000000000000000000000000000000" }, base],
		to,
		new Map([[1, { hash: "0xabc", timestamp: "0xa" }]]),
	);
	assert.equal(events.length, 1);
	assert.equal(events[0].units, String(UNIT + 1n));
	assert.equal(events[0].at, 10000);
	assert.throws(
		() => decodeLogs([{ ...base, removed: true }], to, new Map()),
		/Removed/,
	);
});
test("watcher does not advance cursor on RPC failure; restart resumes from persisted block", async (t) => {
	const { store, config } = await fixture(t, {
		startBlock: 10,
		recipient: "0x" + "2".repeat(40),
	});
	const calls = [];
	let fail = true;
	const rpc = async (method, args) => {
		calls.push([method, args]);
		if (method === "eth_chainId") return "0x4cef52";
		if (method === "eth_getBlockByNumber")
			return { number: "0xa", hash: "0xabc", timestamp: "0x3e8" };
		if (method === "eth_getLogs") {
			if (fail) throw new Error("offline");
			return [];
		}
	};
	const watcher = new Watcher(config, store, rpc);
	await assert.rejects(watcher.tick(), /offline/);
	assert.equal((await store.read()).state.cursor, null);
	fail = false;
	await watcher.tick();
	assert.equal((await store.read()).state.cursor.block, 10);
	calls.length = 0;
	await new Watcher(config, store, rpc).tick();
	assert.equal(
		calls.some((c) => c[0] === "eth_getLogs"),
		false,
	);
});
