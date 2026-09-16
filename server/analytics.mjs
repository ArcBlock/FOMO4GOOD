import { amount, UNIT } from "./money.mjs";
export function analytics(s) {
	const paid = s.payments.filter((p) => !p.rogue),
		rogues = s.payments.filter((p) => p.rogue);
	const values = paid
		.map((p) => BigInt(p.units))
		.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
	const donors = new Map();
	for (const p of paid) {
		const d = donors.get(p.from) || { count: 0, units: 0n };
		d.count++;
		d.units += BigInt(p.units);
		donors.set(p.from, d);
	}
	const total = values.reduce((a, b) => a + b, 0n),
		n = values.length;
	const median = n
		? n % 2
			? values[(n - 1) / 2]
			: (values[n / 2 - 1] + values[n / 2]) / 2n
		: 0n;
	const biggest = [...donors.values()].reduce(
		(max, d) => (d.units > max ? d.units : max),
		0n,
	);
	const percent = (a, b) => (b ? Math.round((a / b) * 10000) / 100 : 0);
	return {
		visits: s.visits,
		intents: s.intents.length,
		paidIntents: n,
		donors: donors.size,
		repeatDonors: [...donors.values()].filter((d) => d.count > 1).length,
		rogueTransfers: rogues.length,
		rogueDonors: new Set(rogues.map((p) => p.from)).size,
		intentConversion: percent(n, s.intents.length),
		average: amount(n ? total / BigInt(n) : 0n),
		median: amount(median),
		lastMinuteMoves: paid.filter((p) => p.lastMinute).length,
		largestDonorShare: total ? Number((biggest * 10000n) / total) / 100 : 0,
		averageRoundSeconds: s.rounds.length
			? Math.round(
					s.rounds.reduce((a, r) => a + r.closedAt - r.startedAt, 0) /
						s.rounds.length /
						1000,
				)
			: 0,
	};
}
export function settlement(s, config) {
	const total = s.payments.reduce((n, p) => n + BigInt(p.units), 0n);
	const teams = config.charities.map((t) => {
		const closed = s.rounds
			.filter((r) => r.team === t.id)
			.reduce((n, r) => n + BigInt(r.units), 0n);
		const rogue = s.payments
			.filter((p) => p.rogue && p.team === t.id)
			.reduce((n, p) => n + BigInt(p.units), 0n);
		const community = closed + rogue,
			topUp = community < 100n * UNIT ? 100n * UNIT - community : 0n;
		return {
			team: t.id,
			charity: t.name,
			community: amount(community),
			arcblockTopUp: amount(topUp),
			due: amount(community + topUp),
			units: String(community),
			topUpUnits: String(topUp),
		};
	});
	const allocated = teams.reduce((n, t) => n + BigInt(t.units), 0n),
		open = BigInt(s.round?.units || 0);
	return {
		mode: config.mode,
		final:
			!!config.endsAt &&
			!s.round &&
			(config.preview
				? Date.now() >= config.endsAt
				: s.chainTime >= config.endsAt),
		community: amount(total),
		allocated: amount(allocated),
		openPool: amount(open),
		balanced: total === allocated + open,
		teams,
		receipts: s.receipts || [],
		metrics: analytics(s),
	};
}
