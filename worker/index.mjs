import { createAFSHttpHandler } from "@aigne/afs-http";
import { AFS } from "@aigne/afs";
import { AFSEVM } from "@aigne/afs-evm";
import { CloudflareDIDSpace } from "@aigne/afs-did-space/cloudflare";
import { Store } from "../server/store.mjs";
import { PracticeStore, unavailableRealState } from "../server/practice.mjs";
import { Watcher } from "../server/payment.mjs";
import { chainRpc } from "../server/evm.mjs";
import { FomoProvider } from "../providers/fomo4good/provider.ts";
import { workerConfig, practiceConfig } from "./config.mjs";

if (typeof AbortSignal.timeout !== "function") {
	AbortSignal.timeout = (ms) => {
		const controller = new AbortController();
		setTimeout(() => controller.abort(), ms);
		return controller.signal;
	};
}
const rpcFetch = (input, init = {}) => {
	const { signal: _ignored, redirect: _redirect, ...rest } = init;
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), 20000);
	return globalThis
		.fetch(input, { ...rest, redirect: "follow", signal: controller.signal })
		.finally(() => clearTimeout(timer));
};

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
		let stage = "config";
		try {
		const config = workerConfig(this.env);
		// All application persistence stays behind the ARC DID Space SDK.
		stage = "space";
		const space = new CloudflareDIDSpace({
			userDid: config.ownerDid,
			objectStore: this.env.FOMO_OBJECTS,
			indexDb: this.env.FOMO_INDEX,
		});
		stage = "real-space";
		const store = new Store(
			await space.getInstanceSpace({
				instanceDid: config.instanceDid,
				role: "system",
			}),
			config,
		);
		const pc = practiceConfig(config);
		stage = "practice-space";
		const practice = new PracticeStore(
			await space.getInstanceSpace({
				instanceDid: pc.instanceDid,
				role: "system",
			}),
			pc,
		);
		stage = "real-init";
		await store.init();
		stage = "practice-init";
		await practice.init();
		const afs = new AFS();
		let watcher = null;
		if (!config.preview) {
			stage = "evm";
			await afs.mount(
				new AFSEVM({
					endpoint: config.rpcUrl,
					chainId: String(config.chainId),
					fetch: rpcFetch,
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
		this.handleAfs = createAFSHttpHandler({
			module: this.provider,
			protocol: "service-binding",
			maxBodySize: 8192,
		});
		// DO storage is only the runtime alarm; balances and cursors are in DID Space.
		// Do not await tick() here: mainnet catch-up can exceed the request CPU budget
		// and 503 the public API. Alarms and post-fetch waitUntil advance the cursor.
		if (watcher && (await this.ctx.storage.getAlarm()) === null)
			await this.ctx.storage.setAlarm(Date.now() + 2000);
		} catch (e) {
			throw new Error(`${stage}: ${e.message || e}`);
		}
	}
	serialize(fn) {
		const next = this.queue.then(fn);
		this.queue = next.catch(() => {});
		return next;
	}
	async fetch(request) {
		const response = await this.serialize(async () => {
			try {
				await this.init();
				// ARC owns parsing, dispatch, options, body limits and error serialization.
				const response = await this.handleAfs(request);
				// Practice expiry must not depend on a browser staying open.
				const { state } = await this.practice.read();
                // Recover delayed local/runtime alarms without making provider reads mutate.
                // Queue background settlement after this serialized request finishes.
                const agents = state.practiceAgents;
                const agentsDue = state.round && agents && agents.nextAt <= Date.now() && Date.now() - agents.lastHumanAt <= 1800000 && (agents.roundId !== state.round.id || (agents.plays < 4 && agents.spent < 8));
                if (state.round && (state.round.endsAt <= Date.now() || agentsDue))
                    this.ctx.waitUntil(this.alarm());
				if (state.round) {
					const agentAt = await this.practice.nextAgentAt();
                    const next = Math.min(agentAt || Infinity, this.watcher
						? Math.min(Date.now() + 2000, state.round.endsAt)
						: state.round.endsAt);
					const current = await this.ctx.storage.getAlarm();
					if (current === null || next < current)
						await this.ctx.storage.setAlarm(next);
				}
				return response;
			} catch (e) {
				console.error(e);
				return Response.json(
					{
						success: false,
						error: {
							code: e.code || "FOMO_ERROR",
							message: e.message || "Game request failed",
						},
					},
					{ status: 400 },
				);
			}
		});
		if (this.watcher)
			this.ctx.waitUntil(
				this.watcher.tick().catch((e) => {
					this.watcher.lastError = e.message;
					console.error("Watcher paused:", e.message);
				}),
			);
		return response;
	}
	async alarm() {
		try {
			await this.init();
		} catch (e) {
			console.error("Alarm init failed:", e.message);
			await this.ctx.storage.setAlarm(Date.now() + 5000);
			return;
		}
		if (this.watcher) await this.ctx.storage.setAlarm(Date.now() + 2000);
		else {
			const { state } = await this.practice.read();
			if (state.round)
				await this.ctx.storage.setAlarm(
					Math.min(
						state.round.endsAt,
						(await this.practice.nextAgentAt()) || Infinity,
					),
				);
		}
		this.ctx.waitUntil(
			(async () => {
				try {
					await this.watcher?.tick();
					await this.practice.agentTick();
					await this.practice.state();
				} catch (e) {
					if (this.watcher) this.watcher.lastError = e.message;
					console.error("Watcher paused:", e.message);
				}
			})(),
		);
	}
}
