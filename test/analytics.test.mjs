import test from "node:test";
import assert from "node:assert/strict";
import { analytics, settlement } from "../server/analytics.mjs";
import { UNIT } from "../server/store.mjs";
test("report reconciles community funds and guarantee separately, counts donors without ranking truncation", () => {
	const payments = Array.from({ length: 25 }, (_, i) => ({
		from: `address${i}`,
		units: String(UNIT),
		rogue: false,
		team: "kids",
		lastMinute: i < 2,
	}));
	payments.push({
		from: "address0",
		units: String(2n * UNIT),
		rogue: false,
		team: "kids",
		lastMinute: false,
	});
	payments.push({
		from: "rogue",
		units: String(3n * UNIT),
		rogue: true,
		team: "kids",
	});
	const state = {
		payments,
		intents: Array(30),
		visits: 100,
		rounds: [
			{
				units: String(27n * UNIT),
				team: "kids",
				startedAt: 1000,
				closedAt: 601000,
			},
		],
		round: null,
	};
	const m = analytics(state);
	assert.equal(m.donors, 25);
	assert.equal(m.repeatDonors, 1);
	assert.equal(m.median, "1");
	assert.equal(m.lastMinuteMoves, 2);
	assert.equal(m.averageRoundSeconds, 600);
	const report = settlement(state, {
		mode: "preview",
		charities: [
			{ id: "kids", name: "Kids" },
			{ id: "dogs", name: "Dogs" },
		],
	});
	assert.equal(report.community, "30");
	assert.equal(report.balanced, true);
	assert.equal(report.teams[0].arcblockTopUp, "70");
	assert.equal(report.teams[1].arcblockTopUp, "100");
});
