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
			url: "http://fomo4good.localhost/",
			runScripts: "outside-only",
		});
		const w = dom.window;
		t.after(() => w.close());
		if (saved) w.localStorage.setItem("fomo4good.intent.v2", saved);
		w.AbortSignal = globalThis.AbortSignal;
		w.fetch = async (path, options) => {
			const data = options.body ? JSON.parse(options.body) : null;
			let result;
			if (path === "/arc/api/fomo/state") result = state;
			else if (path === "/arc/api/fomo/visit") result = { ok: true };
			else if (path === "/arc/api/fomo/intents" && data) {
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
			} else if (path === "/arc/api/fomo/preview-confirm") {
				assert.equal(data.intentId, intent.id);
				intent.payment = { rogue: false };
				state = {
					...state,
					metrics: { ...state.metrics, donors: 1, paidIntents: 1 },
				};
				result = intent.payment;
			} else if (path === `/arc/api/fomo/intents/${intent?.id}`) result = intent;
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
 const dom = new JSDOM(render({ props: { view: "rules" } }).html, { url: "http://fomo4good.localhost/rules?lang=zh-Hant", runScripts: "outside-only" });
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
 assert.match(q('[data-nav="teams"]').href, /\/teams\?lang=zh-Hant$/);
 assert.match(q('.f-livebar a').href, /\/\?lang=zh-Hant#donate$/);
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

test('practice uses only its API, preserves real receipts, spends FUSD and offers a real-money link after a round', async context => {
 const state = { ...empty(), mode: 'practice', currency: 'FUSD', wallet: { id: 'practice-player', balance: '1000' } };
 state.round = { id: 2, endsAt: Date.now() + 600000, amount: '30', team: 'dogs', lastDonor: { address: 'robot', name: '🤖 Tiny Wallet Energy' } };
 state.history = [{ id: 1, team: 'dogs', amount: '45', lastDonor: { address: 'practice-player', name: 'Me' } }];
 const dom = new JSDOM(render({ props: { mode: "practice" } }).html, { url: 'http://fomo4good.localhost/practice?lang=en', runScripts: 'outside-only' });
 context.after(() => dom.window.close());
 const w = dom.window; w.AbortSignal = globalThis.AbortSignal;
 w.localStorage.setItem('fomo4good.intent.v2', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
 let plays = 0;
 w.fetch = async (path, options) => {
  assert.ok(path.startsWith('/arc/api/practice/'), path);
  let result = state;
  if (path === '/arc/api/practice/session') result = state.wallet;
  if (path === '/arc/api/practice/donate') {
   plays++;
   const input = JSON.parse(options.body);
   assert.equal(input.amount, '5'); assert.equal(input.team, 'dogs'); assert.match(input.requestId, /^[a-f0-9-]{36}$/);
   state.wallet.balance = String(1000 - plays * 5); result = { wallet: state.wallet };
  }
  return { ok: true, json: async () => structuredClone(result) };
 };
 w.eval(script);
 const q = s => w.document.querySelector(s);
 await waitFor(() => q('[name="team"]'));
 assert.equal(q('[name="team"]:checked')?.value, 'dogs');
 assert.match(q('[data-balance]').textContent, /1,000.00 FUSD/);
 assert.equal(q('[data-practice-result]').hidden, false);
 assert.match(q('[data-practice-result]').textContent, /YOU WON/);
 assert.match(q('[data-practice-result] a').href, /\/\?lang=en#donate$/);
 assert.match(q('[data-nav="leaderboard"]').href, /\/practice\/leaderboard\?lang=en$/);
 q('[name="team"]').checked = true;
 q('[data-form]').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
 await waitFor(() => q('[data-balance]').textContent === '995.00 FUSD');
 assert.equal(plays, 1);
 await waitFor(()=>q('.f-confetti'));
 assert.equal(q('.f-confetti').getAttribute('aria-hidden'),'true');
 q('.f-confetti').remove();
 w.matchMedia=()=>({matches:true});
 await waitFor(() => !q('[data-submit]').disabled);
 assert.match(q('[data-refill-hint]').textContent, /next round/);
 q('[data-form]').reset();
 await waitFor(() => q('[name="team"]').checked);
 assert.equal(q('[data-submit]').disabled, false);
 q('[data-form]').dispatchEvent(new w.Event('submit', { bubbles: true, cancelable: true }));
 await waitFor(() => q('[data-balance]').textContent === '990.00 FUSD');
 assert.equal(plays, 2);
 assert.equal(q('.f-confetti'),null);
 assert.equal(q('[data-refill]').disabled, true);
 assert.equal(q('[data-payment]').hidden, true);
 assert.equal(w.localStorage.getItem('fomo4good.intent.v2'), 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
 assert.match(q('[data-live-pool]').textContent, /FUSD/);
 assert.equal(q('[data-practice-result] a').textContent, 'PLAY FOR REAL — 1 USDC ↗');
 assert.match(q('.f-legal [data-practice-only]').textContent, /ZERO CHARITY PAYOUT/);
 assert.match(q('[data-leading]').textContent, /imaginary pool/);
 assert.equal(new URL(q('.f-team-play').href).searchParams.get('team'),'dogs');
 assert.equal(new URL(q('.f-team-play').href).hash,'#donate');
});

test('review-critical copy and participation anchors distinguish real funds from practice', () => {
 const real=new JSDOM(render({props:{mode:'real'}}).html,{url:'https://fomo4good.com/arc/'}).window.document;
 const practice=new JSDOM(render({props:{mode:'practice'}}).html,{url:'https://fomo4good.com/arc/practice/'}).window.document;
 assert.match(real.querySelector('.f-funds-promise').textContent,/100% OF ELIGIBLE ARC USDC WILL BE DONATED/);
 assert.match(real.querySelector('.f-funds-promise').textContent,/December 31, 2026/);
 assert.equal(real.querySelector('.f-livebar a').hash,'#donate');
 assert.ok(real.querySelector('#donate'));
 assert.match(real.querySelector('.f-arc-pair a:first-child small').textContent,/AGENTIC REALM COMPUTER BY ARCBLOCK/);
 assert.match(real.querySelector('.f-arc-pair a:last-child small').textContent,/USDC ON ARC BY CIRCLE/);
 assert.match(practice.querySelector('.f-legal [data-practice-only]').textContent,/ZERO CHARITY PAYOUT/);
 assert.match(practice.querySelector('.f-legal p[data-practice-only]').textContent,/no charity receives money/);
});

test('practice rejects an over-balance amount locally with a specific message', async context => {
 const state={...empty(),mode:'practice',currency:'FUSD',wallet:{id:'small-wallet',balance:'10'}};
 const dom=new JSDOM(render({props:{mode:'practice'}}).html,{url:'http://fomo4good.localhost/arc/practice/',runScripts:'outside-only'});
 context.after(()=>dom.window.close());const w=dom.window;w.AbortSignal=globalThis.AbortSignal;let donations=0;
 w.fetch=async path=>{if(path.endsWith('/donate'))donations++;return {ok:true,json:async()=>structuredClone(path.endsWith('/session')?state.wallet:state)}};
 w.eval(script);const q=s=>w.document.querySelector(s);
 await waitFor(()=>q('[name="team"]'));
 q('[name="amount"]').value='11';q('[name="amount"]').dispatchEvent(new w.Event('input',{bubbles:true}));
 assert.equal(q('[data-submit]').disabled,true);
 assert.match(q('[data-amount-feedback]').textContent,/Not enough FUSD/);
 q('[data-form]').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));
 assert.equal(donations,0);
 assert.match(q('[data-feedback]').textContent,/Not enough FUSD/);
});

test("pages-only deployment: a 404 campaign API renders the shipped teams, disables play and never reports an outage", async (context) => {
	const props = { view: "play", mode: "real", teams: [{ id: "dogs", team: "DOGS", name: "Best Friends Animal Society", emoji: "🐶", tagline: "Objectively good boys.", url: "https://bestfriends.org", order: 2 }, { id: "kids", team: "KIDS", name: "Save the Children", emoji: "👶", tagline: "They're the future.", url: "https://www.savethechildren.org", order: 1 }] };
	for (const mode of ["real", "practice"]) {
		const dom = new JSDOM(render({ props: { ...props, mode } }).html, { url: `http://fomo4good.localhost/${mode === "practice" ? "practice" : ""}`, runScripts: "outside-only" });
		context.after(() => dom.window.close());
		const w = dom.window;
		w.AbortSignal = globalThis.AbortSignal;
		let requests = 0;
		w.fetch = async () => { requests++; return { ok: false, status: 404, json: async () => { throw new Error("not json"); } }; };
		w.eval(script);
		const q = (s) => w.document.querySelector(s);
		await waitFor(() => q('[name="team"]'));
		assert.deepEqual([...w.document.querySelectorAll('[name="team"]')].map((r) => r.value), ["kids", "dogs"]);
		assert.equal(w.document.querySelectorAll(".f-team-card").length, 2);
		assert.equal(q("[data-submit]").disabled, true);
		assert.equal(q("[data-notice]").classList.contains("error"), false);
		assert.match(q("[data-notice]").textContent, mode === "practice" ? /PRACTICE ROUND IS NOT OPEN YET/ : /REAL DONATIONS ARE NOT OPEN YET/);
		assert.equal(q("[data-unavailable]").hidden, mode === "practice");
		if (mode === "practice") {
			assert.equal(q("[data-balance]").textContent, "— FUSD");
			assert.match(q("[data-wallet-feedback]").textContent, /not connected/);
		}
		const before = requests;
		await new Promise((r) => setTimeout(r, 50));
		assert.equal(requests, before, "no polling while the service is absent");
	}
});

test('rank invitation uses the Top 10 cutoff minus existing contributions and prefills without donating', async context => {
 const state = { ...empty(), mode:'practice', currency:'FUSD', wallet:{id:'outside-top10',balance:'997',allTimeDonated:'3',roundDonated:'0'} };
 state.topDonors=Array.from({length:10},(_,i)=>({address:`player-${i}`,name:`Player ${i}`,amount:String(20-i),count:1}));
 const open = (url,view) => {
  const dom=new JSDOM(render({props:{mode:'practice',view}}).html,{url,runScripts:'outside-only'});
  const w=dom.window;context.after(()=>w.close());w.AbortSignal=globalThis.AbortSignal;
  w.fetch=async path=>{assert.ok(!path.endsWith('/donate'),'Prefilling must not submit');return {ok:true,json:async()=>structuredClone(path.endsWith('/session')?state.wallet:state)}};
  w.eval(script);return w;
 };
 const w=open('http://fomo4good.localhost/practice/leaderboard?lang=en','leaderboard');
 await waitFor(()=>w.document.querySelector('[data-rank-cta]').textContent.includes('8.01'));
 assert.equal(w.document.querySelectorAll('[data-leaderboard] .f-board-row').length,10);
 const url=w.document.querySelector('[data-rank-cta]').href;
 assert.equal(new URL(url).searchParams.get('donate'),'8.01');
 assert.equal(new URL(url).searchParams.get('team'),'dogs');
 const target=open(url,'play');
 await waitFor(()=>target.document.querySelector('[name="team"]'));
 assert.equal(target.document.querySelector('[name="amount"]').value,'8.01');
 assert.ok(target.document.querySelector('[name="team"]:checked'),'A default team removes the dead-end');
 assert.equal(target.document.querySelector('[name="team"]:checked').value,'dogs');
 assert.equal(target.document.querySelector('[data-submit]').disabled,false);
});

test('profile draft survives page changes before donation and deliberately cleared fields stay clear', async context => {
 const open=saved=>{const dom=new JSDOM(render({props:{mode:'practice'}}).html,{url:'http://fomo4good.localhost/practice',runScripts:'outside-only'});context.after(()=>dom.window.close());const w=dom.window;w.AbortSignal=globalThis.AbortSignal;if(saved)w.localStorage.setItem('fomo4good.profile.v1',saved);w.fetch=async()=>({ok:true,json:async()=>({...empty(),mode:'practice',wallet:{id:'test',balance:'1000'}})});w.eval(script);return w;};
 const w=open();
 const name=w.document.querySelector('[name="name"]'),url=w.document.querySelector('[name="url"]');
 name.value='Remember me';name.dispatchEvent(new w.Event('input',{bubbles:true}));
 url.value='https://example.com/me';url.dispatchEvent(new w.Event('input',{bubbles:true}));
 const next=open(w.localStorage.getItem('fomo4good.profile.v1'));
 assert.equal(next.document.querySelector('[name="name"]').value,'Remember me');
 assert.equal(next.document.querySelector('[name="url"]').value,'https://example.com/me');
 next.document.querySelector('[name="url"]').value='';next.document.querySelector('[name="url"]').dispatchEvent(new next.Event('input',{bubbles:true}));
 const cleared=open(next.localStorage.getItem('fomo4good.profile.v1'));
 assert.equal(cleared.document.querySelector('[name="url"]').value,'');
 assert.equal(cleared.document.querySelector('[name="name"]').value,'Remember me');
});

test('leaderboard scope stays consistent; sound defaults on and an explicit opt-out survives language changes', async context => {
 const state={...empty(),mode:'practice',wallet:{id:'me',balance:'980'},topDonors:[{address:'me',name:'Me',amount:'1020',count:4}],roundDonors:[{address:'other',name:'Other',amount:'5',count:1}]};
 const dom=new JSDOM(render({props:{mode:'practice',view:'leaderboard'}}).html,{url:'http://fomo4good.localhost/arc/practice/leaderboard',runScripts:'outside-only'});context.after(()=>dom.window.close());const w=dom.window;w.AbortSignal=globalThis.AbortSignal;
 w.fetch=async()=>({ok:true,json:async()=>structuredClone(state)});w.eval(script);const q=s=>w.document.querySelector(s);
 await waitFor(()=>q('[data-podium]').textContent.includes('1,020.00'));
 assert.equal(q('[data-sound]').getAttribute('aria-pressed'),'true');assert.match(q('[data-sound]').textContent,/ON/);
 assert.match(q('[data-leaderboard]').textContent,/1,020.00/);
 q('[data-ranking]').value='round';q('[data-ranking]').dispatchEvent(new w.Event('change'));
 assert.match(q('[data-board-scope]').textContent,/THIS ROUND/);assert.match(q('[data-podium]').textContent,/Other/);assert.doesNotMatch(q('[data-podium]').textContent,/1,020/);assert.match(q('[data-personal-rank]').textContent,/Not ranked/);
 assert.match(q('[data-podium]').textContent,/1 donation/);assert.doesNotMatch(q('[data-podium]').textContent,/1 donations/);
 q('[data-sound]').click();assert.equal(w.localStorage.getItem('fomo4good.sound'),'off');
 q('[data-language]').value='zh-Hant';q('[data-language]').dispatchEvent(new w.Event('change'));
 assert.equal(q('[data-sound]').getAttribute('aria-pressed'),'false');assert.match(q('[data-sound]').textContent,/關/);
 assert.match(q('.f-legal').textContent,/沒有夥伴關係/);
 assert.equal(new URL(q('[data-share-x]').href).searchParams.get('url'),'https://fomo4good.com/arc/practice/leaderboard/?lang=zh-Hant');
 assert.match(q('.f-source-cat').src,/^data:image\/svg\+xml;base64,/);
 assert.equal(q('a[href="https://www.arcblock.io"] .f-link-favicon')?.src,'https://www.arcblock.io/favicon.ico');
 assert.match(q('a[href="https://arc.io/"] .f-link-favicon')?.src || '',/arc-favicon-test\.png$/);
});

test('every public ARC view declares a dedicated 1200x630 social card', async () => {
 const cards={
  'pages/arc/seo/og-image':'og-arc.jpg',
  'pages/arc/teams/seo/og-image':'og-arc-teams.jpg',
  'pages/arc/leaderboard/seo/og-image':'og-arc-leaderboard.jpg',
  'pages/arc/rules/seo/og-image':'og-arc-rules.jpg',
  'pages/arc/practice/seo/og-image':'og-practice.jpg',
  'pages/arc/practice/teams/seo/og-image':'og-practice-teams.jpg',
  'pages/arc/practice/leaderboard/seo/og-image':'og-practice-leaderboard.jpg',
  'pages/arc/practice/rules/seo/og-image':'og-practice-rules.jpg',
 };
 for(const [seo,card] of Object.entries(cards)) {
  assert.equal((await readFile(new URL(`../blocklets/fomo4good/${seo}`,import.meta.url),'utf8')).trim(),`/media/${card}`);
  const bytes=await readFile(new URL(`../blocklets/fomo4good/content/media/${card}`,import.meta.url));
  assert.deepEqual([...bytes.subarray(0,3)],[0xff,0xd8,0xff]);
  assert.ok(bytes.length>100_000,`${card} should contain the full illustrated card`);
 }
});
