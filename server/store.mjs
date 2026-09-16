import { analytics } from "./analytics.mjs";
import { randomInt, randomUUID } from "node:crypto";
import { UNIT, units, amount } from "./money.mjs";
export { UNIT, units, amount } from "./money.mjs";
const sum = (rows) => rows.reduce((n, r) => n + BigInt(r.units), 0n);
const PATH = "/campaign/ledger.json";
export class Store {
	constructor(afs, config) {
		this.afs = afs;
		this.config = config;
		this.queue = Promise.resolve();
	}
	binding() {
		const c = this.config;
		return JSON.stringify({
			mode: c.mode,
			chainId: c.chainId,
			recipient: c.recipient,
			startBlock: c.startBlock,
			startsAt: c.startsAt,
			endsAt: c.endsAt,
			rogueTeam: c.rogueTeam,
			roundMs: c.roundMs,
			teams: c.charities,
		});
	}
	async init() {
		try {
			await this.read();
		} catch (e) {
			if (e.code !== "AFS_NOT_FOUND") throw e;
			// Called only after acquiring the service's exclusive listener, before accepting requests.
			await this.afs.write(PATH, {
				content: JSON.stringify({
					schema: 1,
					binding: this.binding(),
					intents: [],
					payments: [],
					rounds: [],
					round: null,
					cursor: null,
					chainTime: 0,
					visits: 0,
				}),
			});
		}
	}
	async read() {
		const { data } = await this.afs.read(PATH);
		const state = JSON.parse(data.content);
		if (state.schema !== 1 || state.binding !== this.binding())
			throw new Error(
				"DID Space campaign configuration mismatch. Use the original configuration or a new campaign instance.",
			);
		if (!data.meta?.version)
			throw new Error("DID Space must expose write preconditions.");
		return { state, version: data.meta.version };
	}
	update(fn) {
		const work = this.queue.then(async () => {
			for (let tries = 0; tries < 12; tries++) {
				const { state, version } = await this.read();
				const before = JSON.stringify(state);
				const result = fn(state);
				const content = JSON.stringify(state);
				if (content === before) return result;
				try {
					await this.afs.write(PATH, { content }, { ifMatch: version });
					return result;
				} catch (e) {
					if (e.code !== "AFS_CONFLICT") throw e;
				}
			}
			throw new Error("Campaign busy; retry shortly.");
		});
		this.queue = work.catch(() => {});
		return work;
	}
	closeAt(s, time) {
		if (s.round && time >= s.round.endsAt) {
			s.rounds.push({ ...s.round, closedAt: s.round.endsAt });
			s.round = null;
		}
	}
	async intent(input, now = Date.now()) {
		const c = this.config;
		const base = units(input.amount);
		if (!c.charities.some((t) => t.id === input.team))
			throw new Error("Choose a team.");
		const name = String(input.name || "").trim();
		if (name.length > 32 || /[\x00-\x1f\x7f]/.test(name))
			throw new Error("Display name must be at most 32 characters.");
		let url = String(input.url || "").trim();
		if (url) {
			const parsed = new URL(url);
			if (
				!["https:", "http:"].includes(parsed.protocol) ||
				parsed.username ||
				parsed.password ||
				url.length > 200
			)
				throw new Error(
					"Use a public http or https URL, at most 200 characters.",
				);
			url = parsed.href;
		}
		return this.update((s) => {
			if ((c.startsAt && now < c.startsAt) || (c.endsAt && now >= c.endsAt))
				throw new Error("The campaign is not accepting donations.");
			// Never reuse an exact amount during the campaign: late payments cannot steal a new intent.
			const used = new Set(s.intents.map((i) => i.units));
			const offset = randomInt(9999);
			let exact;
			for (let j = 0; j < 9999; j++) {
				const candidate = String(
					base + BigInt(1 + ((offset + j) % 9999)) * 10n ** 12n,
				);
				if (!used.has(candidate)) {
					exact = candidate;
					break;
				}
			}
			if (!exact)
				throw new Error(
					"This donation amount is busy. Try another base amount.",
				);
			const intent = {
				id: randomUUID(),
				team: input.team,
				name,
				url,
				base: amount(base),
				units: exact,
				amount: amount(exact),
				createdAt: now,
				expiresAt: Math.min(now + c.intentMs, c.endsAt || Infinity),
				paymentId: null,
			};
			s.intents.push(intent);
			return intent;
		});
	}
	ingest(s, event) {
		if (s.payments.some((p) => p.id === event.id)) return;
		const c = this.config;
		if (BigInt(event.units) <= 0n) return;
		this.closeAt(s, event.at);
		const inside =
			(!c.startsAt || event.at >= c.startsAt) &&
			(!c.endsAt || event.at < c.endsAt);
		const intent = inside
			? s.intents.find(
					(i) =>
						!i.paymentId &&
						i.units === event.units &&
						event.at >= Math.floor(i.createdAt / 1000) * 1000 &&
						event.at < i.expiresAt,
				)
			: null;
		const p = {
			...event,
			amount: amount(event.units),
			intentId: intent?.id || null,
			team: intent?.team || c.rogueTeam,
			name: intent?.name || "",
			url: intent?.url || "",
			rogue: !intent,
			roundId: null,
			lastMinute: false,
		};
		if (intent) {
			if (!s.round)
				s.round = {
					id: s.rounds.length + 1,
					startedAt: event.at,
					endsAt: 0,
					units: "0",
					team: intent.team,
					lastDonor: null,
				};
			p.lastMinute = s.round.endsAt > 0 && s.round.endsAt - event.at <= 60_000;
			s.round.units = String(BigInt(s.round.units) + BigInt(p.units));
			s.round.endsAt = Math.min(event.at + c.roundMs, c.endsAt || Infinity);
			s.round.team = intent.team;
			s.round.lastDonor = { name: p.name, address: p.from, url: p.url };
			p.roundId = s.round.id;
			intent.paymentId = p.id;
		}
		s.payments.push(p);
	}
	async batch(events, cursor, chainTime) {
		return this.update((s) => {
			if (s.cursor && cursor.block <= s.cursor.block) return;
			for (const e of events) this.ingest(s, e);
			this.closeAt(s, chainTime);
			s.cursor = cursor;
			s.chainTime = chainTime;
		});
	}
	async simulate(id, now = Date.now()) {
		if (!this.config.preview) throw new Error("Simulation disabled.");
		return this.update((s) => {
			const i = s.intents.find((x) => x.id === id);
			if (!i) throw new Error("Intent not found.");
			if (i.paymentId) return s.payments.find((x) => x.id === i.paymentId);
			const event = {
				id: `preview:${randomUUID()}`,
				txHash: null,
				block: 0,
				logIndex: 0,
				blockHash: null,
				at: now,
				from: "0x000000000000000000000000000000000000dEaD",
				units: i.units,
			};
			this.ingest(s, event);
			this.closeAt(s, now);
			s.chainTime = now;
			return s.payments.at(-1);
		});
	}
	async status(id) {
		const { state: s } = await this.read();
		const i = s.intents.find((x) => x.id === id);
		if (!i) return null;
		return {
			...i,
			payment: s.payments.find((p) => p.id === i.paymentId) || null,
		};
	}
	async state(now = Date.now(), { settle = true } = {}) {
		if (this.config.preview && settle) await this.update((s) => this.closeAt(s, now));
		const { state: s } = await this.read();
    return this.projectState(s, now);
  }
  projectState(s, now) {
		const rank = (rows, limit = 10) => {
			const groups = new Map();
			for (const p of rows) {
				const key = p.from.toLowerCase();
				const r = groups.get(key) || {
					address: p.from,
					units: 0n,
					count: 0,
					name: p.name,
					url: p.url,
				};
				r.units += BigInt(p.units);
				r.count++;
				r.name = p.name;
				r.url = p.url;
				groups.set(key, r);
			}
			return [...groups.values()]
				.sort((a, b) => (a.units > b.units ? -1 : a.units < b.units ? 1 : 0))
				.slice(0, limit)
				.map((r) => ({
					...r,
					units: String(r.units),
					amount: amount(r.units),
				}));
		};
		const regular = s.payments.filter((p) => !p.rogue),
			rogues = s.payments.filter((p) => p.rogue);
		const teams = this.config.charities.map((t) => {
			const rounds = s.rounds.filter((r) => r.team === t.id);
			const allocated =
				sum(rounds) + sum(rogues.filter((p) => p.team === t.id));
			const topUp = allocated < 100n * UNIT ? 100n * UNIT - allocated : 0n;
			return {
				...t,
				allocated: amount(allocated),
				topUp: amount(topUp),
				wins: rounds.length,
				topDonors: rank(regular.filter((p) => p.team === t.id), 3),
			};
		});
		const round = s.round
			? { ...s.round, amount: amount(s.round.units) }
			: null;
		return {
			now,
			mode: this.config.mode,
			round,
			teams,
			community: amount(sum(s.payments)),
			rogueTotal: amount(sum(rogues)),
			topDonors: rank(regular),
			roundDonors: rank(regular.filter((p) => p.roundId === round?.id)),
			rogueDonors: rank(rogues),
			recent: s.payments
				.slice(-10)
				.reverse()
				.map(({ intentId, ...p }) => p),
			history: s.rounds
				.slice(-20)
				.reverse()
				.map((r) => ({ ...r, amount: amount(r.units) })),
			watcher: {
				block: s.cursor?.block || null,
				chainTime: s.chainTime,
				stale: !this.config.preview && now - s.chainTime > 30_000,
			},
			campaign: {
				startsAt: this.config.startsAt,
				endsAt: this.config.endsAt,
				ended: !!this.config.endsAt && now >= this.config.endsAt,
			},
			metrics: analytics(s),
			receipts: s.receipts || [],
			payment: {
				recipient: this.config.recipient,
				networkName: this.config.preview
					? "LOCAL PREVIEW"
					: "Circle Arc Testnet",
				chainId: this.config.chainId,
				explorer: this.config.explorer,
			},
		};
	}
}
