import { AFS } from "@aigne/afs";
import { AFSEVM } from "@aigne/afs-evm";
import { CloudflareDIDSpace } from "@aigne/afs-did-space/cloudflare";
import { Store } from "../server/store.mjs";
import { PracticeStore, unavailableRealState } from "../server/practice.mjs";
import { Watcher } from "../server/payment.mjs";
import { chainRpc } from "../server/evm.mjs";
import { FomoProvider } from "../providers/fomo4good/provider.ts";
import { workerConfig, practiceConfig } from "./config.mjs";

/** Private service-bound Worker. No workers.dev or public route. */
export default {
	async fetch(request, env) {
		// One actor per explicitly configured campaign. Caller cannot choose another scope.
		const config = workerConfig(env);
		return env.FOMO_CAMPAIGN.get(
			env.FOMO_CAMPAIGN.idFromName(config.instanceDid),
		).fetch(request);
	},
};
export class FomoCampaign {
	constructor(ctx, env) {
		this.ctx = ctx;
		this.env = env;
		this.queue = Promise.resolve();
	}
	async init() {
		if (this.ready) return this.ready;
		this.ready = this.open().catch((e) => {
			this.ready = null;
			throw e;
		});
		return this.ready;
	}
	async open() {
		const config = workerConfig(this.env);
		// All application persistence stays behind the ARC DID Space SDK.
		const space = new CloudflareDIDSpace({
			userDid: config.ownerDid,
			objectStore: this.env.FOMO_OBJECTS,
			indexDb: this.env.FOMO_INDEX,
		});
		const store = new Store(
			await space.getInstanceSpace({
				instanceDid: config.instanceDid,
				role: "system",
			}),
			config,
		);
		const pc = practiceConfig(config);
		const practice = new PracticeStore(
			await space.getInstanceSpace({
				instanceDid: pc.instanceDid,
				role: "system",
			}),
			pc,
		);
		await store.init();
		await practice.init();
		const afs = new AFS();
		let watcher = null;
		if (!config.preview) {
			await afs.mount(
				new AFSEVM({
					endpoint: config.rpcUrl,
					chainId: String(config.chainId),
				}),
				"/dev/chain/arc",
			);
			watcher = new Watcher(config, store, chainRpc(afs));
		}
		this.config = config;
		this.watcher = watcher;
		this.practice = practice;
		this.provider = new FomoProvider({
			config,
			store,
			practice,
			watcher,
			unavailableRealState,
		});
		// DO storage is only the runtime alarm; balances and cursors are in DID Space.
		if (watcher && (await this.ctx.storage.getAlarm()) === null)
			await this.ctx.storage.setAlarm(Date.now() + 2000);
	}
	serialize(fn) {
		const next = this.queue.then(fn);
		this.queue = next.catch(() => {});
		return next;
	}
	async fetch(request) {
		return this.serialize(async () => {
			try {
				await this.init();
				if (request.method !== "POST")
					return new Response("Not found", { status: 404 });
				const op = new URL(request.url).pathname;
				if (
					![
						"/afs/read",
						"/afs/list",
						"/afs/stat",
						"/afs/explain",
						"/afs/exec",
					].includes(op)
				)
					return new Response("Not found", { status: 404 });
				const raw = await request.text();
				if (raw.length > 8192)
					return new Response("Too large", { status: 413 });
				const input = JSON.parse(raw);
				const method = op.slice(5);
				const result = await this.provider[method](input.path, input.args);
				// Practice expiry must not depend on a browser staying open.
				const { state } = await this.practice.read();
				if (state.round) {
					const next = this.watcher
						? Math.min(Date.now() + 2000, state.round.endsAt)
						: state.round.endsAt;
					const current = await this.ctx.storage.getAlarm();
					if (current === null || next < current)
						await this.ctx.storage.setAlarm(next);
				}
				return Response.json(result);
			} catch (e) {
				return Response.json(
					{
						success: false,
						error: {
							code: e.code || "FOMO_ERROR",
							message: "Game request failed",
						},
					},
					{ status: 400 },
				);
			}
		});
	}
	async alarm() {
		return this.serialize(async () => {
			await this.init();
			try {
				await this.watcher?.tick();
				await this.practice.state();
			} finally {
				const { state } = await this.practice.read();
				if (this.watcher) await this.ctx.storage.setAlarm(Date.now() + 2000);
				else if (state.round)
					await this.ctx.storage.setAlarm(state.round.endsAt);
			}
		});
	}
}
