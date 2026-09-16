import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { JSDOM } from "jsdom";
import { render } from "../blocklets/fomo4good/.web/components/fomo-game/render.js";
const script = await readFile(
	new URL(
		"../blocklets/fomo4good/.web/components/fomo-game/script.js",
		import.meta.url,
	),
	"utf8",
);
const teams = [
	{
		id: "dogs",
		team: "DOGS",
		name: "Best Friends Animal Society",
		emoji: "🐶",
		tagline: "Objectively good boys.",
		url: "https://bestfriends.org",
		allocated: "0",
		topUp: "100",
		wins: 0,
	},
];
const empty = () => ({
	now: Date.now(),
	mode: "preview",
	round: null,
	teams,
	community: "0",
	topDonors: [],
	roundDonors: [],
	rogueDonors: [],
	recent: [],
	history: [],
	receipts: [],
	watcher: { stale: false },
	campaign: { ended: false },
	metrics: {
		visits: 1,
		intents: 0,
		donors: 0,
		paidIntents: 0,
		rogueTransfers: 0,
		intentConversion: 0,
		median: "0",
		lastMinuteMoves: 0,
	},
	payment: {
		recipient: "",
		networkName: "LOCAL PREVIEW",
		chainId: 5042002,
		explorer: "https://testnet.arcscan.app",
	},
});
const waitFor = async (predicate) => {
	for (let i = 0; i < 100; i++) {
		if (predicate()) return;
		await new Promise((r) => setTimeout(r, 5));
	}
	assert.fail("Client did not reach expected state");
};
test("client selects team, creates exact intent, simulates arrival and restores receipt after reload", async (t) => {
	let state = empty(),
		intent = null,
		creates = 0;
	function browser(saved) {
		const dom = new JSDOM(render().html, {
			url: "http://localhost:4931/arc",
			runScripts: "outside-only",
		});
		const w = dom.window;
		t.after(() => w.close());
		if (saved) w.localStorage.setItem("fomo4good.intent.v2", saved);
		w.AbortSignal = globalThis.AbortSignal;
		w.fetch = async (path, options) => {
			const data = options.body ? JSON.parse(options.body) : null;
			let result;
			if (path === "/api/fomo/state") result = state;
			else if (path === "/api/fomo/visit") result = { ok: true };
			else if (path === "/api/fomo/intents" && data) {
				creates++;
				assert.equal(data.team, "dogs");
				assert.equal(data.amount, "5");
				intent = {
					id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
					team: "dogs",
					name: data.name,
					amount: "5.004237",
					expiresAt: Date.now() + 600000,
					payment: null,
				};
				result = intent;
			} else if (path === "/api/fomo/preview-confirm") {
				assert.equal(data.intentId, intent.id);
				intent.payment = { rogue: false };
				state = {
					...state,
					metrics: { ...state.metrics, donors: 1, paidIntents: 1 },
				};
				result = intent.payment;
			} else if (path === `/api/fomo/intents/${intent?.id}`) result = intent;
			else throw new Error("Unexpected client request: " + path);
			return { ok: true, json: async () => structuredClone(result) };
		};
		w.eval(script);
		return w;
	}
	const w = browser();
	await waitFor(() => w.document.querySelector('[name="team"]'));
	const radio = w.document.querySelector('[name="team"]');
	radio.checked = true;
	radio.dispatchEvent(new w.Event("change", { bubbles: true }));
	assert.equal(w.document.querySelector("[data-submit]").disabled, false);
	w.document.querySelector('[name="name"]').value =
		"<img src=x onerror=alert(1)>";
	w.document
		.querySelector("[data-form]")
		.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true }));
	await waitFor(() => !w.document.querySelector("[data-payment]").hidden);
	assert.equal(
		w.document.querySelector("[data-exact]").textContent,
		"5.004237 USDC",
	);

	assert.equal(creates, 1);
	const language = w.document.querySelector('[data-language]');
	language.value = 'zh-Hant';
	language.dispatchEvent(new w.Event('change', { bubbles: true }));
	assert.equal(w.document.querySelector('[data-exact]').textContent, '5.004237 USDC');
	assert.match(w.document.querySelector('[data-network]').textContent, /請勿轉入資金/);
	assert.match(w.document.querySelector('[data-expiry]').textContent, /後到期/);
	language.value = 'en';
	language.dispatchEvent(new w.Event('change', { bubbles: true }));
	assert.equal(w.document.querySelector("[data-copy-address]").disabled, true);
	w.document.querySelector("[data-simulate]").click();
	await waitFor(() =>
		w.document
			.querySelector("[data-payment-status]")
			.textContent.includes("CONFIRMED"),
	);
	const id = w.localStorage.getItem("fomo4good.intent.v2");
	w.close();
	const resumed = browser(id);
	await waitFor(() =>
		resumed.document
			.querySelector("[data-payment-status]")
			.textContent.includes("CONFIRMED"),
	);
	assert.equal(creates, 1);
	assert.equal(resumed.document.querySelector("[data-simulate]").hidden, true);
});

test("language switch translates FAQs and live state, preserves input and user names, and follows inner-page links", async (testContext) => {
 const state = empty();
 state.round = { id: 2, endsAt: Date.now() + 420000, amount: "12.004237", team: "dogs", lastDonor: { name: "Nothing.", address: "0x123456789" } };
 state.topDonors = [{ name: "Nothing.", amount: "12.004237", count: 1 }];
 const dom = new JSDOM(render().html.replace('data-view="play"', 'data-view="rules"'), { url: "http://localhost:4931/arc/rules?lang=zh-Hant", runScripts: "outside-only" });
 testContext.after(() => dom.window.close());
 const w = dom.window;
 w.AbortSignal = globalThis.AbortSignal;
 w.fetch = async () => ({ ok: true, json: async () => structuredClone(state) });
 w.eval(script);
 await waitFor(() => w.document.querySelector('[name="team"]'));
 const q = (s) => w.document.querySelector(s);
 assert.equal(w.document.documentElement.lang, "zh-Hant");
 assert.match(q('[data-live-round]').textContent, /第 002 輪/);
 assert.match(q('[data-live-status]').textContent, /狗狗隊 領先/);
 assert.match(q('[data-notice]').textContent, /非真實捐款/);
 assert.equal(q('[data-leaderboard] strong').textContent, 'Nothing.');
 for (const summary of w.document.querySelectorAll('.f-faq summary')) assert.match(summary.textContent, /[\u3400-\u9fff]/);
 assert.match(q('[data-nav="teams"]').href, /\/arc\/teams\?lang=zh-Hant$/);
 assert.match(q('.f-livebar a').href, /\/arc\?lang=zh-Hant#play$/);
 q('[name="team"]').checked = true;
 q('[name="amount"]').value = '23.45';
 q('[name="name"]').value = 'Nothing.';
 q('[data-language]').value = 'en-x-slop';
 q('[data-language]').dispatchEvent(new w.Event('change', { bubbles: true }));
 assert.equal(w.document.documentElement.lang, 'en');
 assert.equal(q('[name="team"]').checked, true);
 assert.equal(q('[name="amount"]').value, '23.45');
 assert.equal(q('[name="name"]').value, 'Nothing.');
 assert.match(q('[data-submit]').textContent, /SHIP GOOD/);
 assert.equal(q('[data-leaderboard] strong').textContent, 'Nothing.');
 assert.equal(w.localStorage.getItem('fomo4good.language'), 'en-x-slop');
 q('[data-language]').value = 'en';
 q('[data-language]').dispatchEvent(new w.Event('change', { bubbles: true }));
 assert.equal(q('.f-faq summary').textContent, 'What does the winner get?');
 assert.match(q('[data-notice]').textContent, /NO REAL DONATIONS/);
});
