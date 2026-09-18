import assert from "node:assert/strict";
import { JSDOM } from "jsdom";
const origin = process.env.FOMO_ORIGIN || "http://localhost:4931";
let cookie = "";
async function api(path, input, headers = {}) {
	const r = await fetch(origin + path, {
		...(input
			? {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Origin: origin,
 Cookie: cookie,
						...headers,
					},
					body: JSON.stringify(input),
				}
			: { redirect: "manual", headers: { Cookie: cookie } }),
		signal: AbortSignal.timeout(20000),
	});
	if (r.headers.get("set-cookie")) cookie = r.headers.get("set-cookie").split(";")[0];
	return r;
}
const before = await (await api("/arc/api/fomo/state")).json();
if (before.mode !== "unavailable" || before.campaign?.accepting !== false) {
	console.error(
		`Smoke refuses to run while real collection is open (mode=${before.mode}).`,
	);
	process.exit(1);
}
assert.equal(
	before.mode,
	"unavailable",
	"Smoke must never spend real funds.",
);
const html = await (await api("/arc/")).text();
assert.match(html, /data-fomo/);
assert.match(html, /MAKE CRYPTO/);
const gaLoader = /googletagmanager\.com\/gtag\/js/;
const gaBlocking = /<script[^>]+src=["'][^"']*googletagmanager\.com\/gtag\/js/;
assert.match(html, /G-PFHNJD5JV6/);
assert.match(html, gaLoader);
assert.doesNotMatch(
	html,
	gaBlocking,
	"GA4 must stay on ARC idle injection — a head src= loader is visible to the preload scanner",
);
for (const page of ["rules", "teams", "leaderboard", "practice", "practice/rules", "practice/teams", "practice/leaderboard"]) {
 const view = page === "practice" ? "play" : page.split("/").pop();
 const response = await api(`/arc/${page}`);
 assert.equal(response.status, 200);
 const body = await response.text();
 const dom = new JSDOM(body);
 const document = dom.window.document;
 assert.equal(document.querySelector('[data-fomo]').dataset.view, view);
 assert.equal(document.querySelector('[data-fomo]').dataset.mode, page.startsWith("practice") ? "practice" : "real");
 assert.ok([...document.querySelectorAll('style')].some(style => style.textContent.includes('.fomo[data-view="play"]')));
 const visibleHeroes = [...document.querySelectorAll('h1')].filter(heading => {
  for (let node = heading; node; node = node.parentElement) if (dom.window.getComputedStyle(node).display === 'none') return false;
  return true;
 });
 assert.equal(visibleHeroes.length, 1, `${page} must show exactly one hero`);
 assert.equal(visibleHeroes[0].closest('[data-page]').dataset.page, view);
 dom.window.close();
 assert.ok(body.includes(`data-nav="${view}" aria-current="page"`));
 assert.ok(body.includes('data-live-timer'));
 assert.ok(body.includes('href="/#play"'));
 assert.ok(body.includes(`rel="canonical" href="${origin}/${page}/"`));
 assert.match(body, /G-PFHNJD5JV6/);
 assert.doesNotMatch(body, gaBlocking);
 assert.equal((await api(`/${page}/`)).status, 200);
}
assert.equal((await api('/unknown')).status, 404);
assert.equal((await api('/arc')).status, 404, 'the old /arc prefix is gone');

assert.ok(html.includes(`rel="canonical" href="${origin}/"`));
for (const match of html.matchAll(
	/(?:src|href)="(\/(?:_arc\/assets\/|aup[^"\s]*\.(?:css|js)|media\/)[^"]*)"/g,
)) {
	const r = await api(match[1]);
	assert.equal(r.status, 200, match[1]);
	assert.ok(
		!r.headers.get("content-type")?.includes("text/html"),
		match[1] + " returned HTML",
	);
}
assert.ok(html.includes('data:font/ttf;base64,') || html.includes('/_arc/assets/'), 'Pixel font is bundled into the ARC component CSS');
const image = await api("/media/launch-pixel.jpg");
assert.equal(image.status, 200);
assert.match(image.headers.get("content-type"), /image\/jpeg/);
for (const path of [
	"/api/afs/rpc",
	"/afs/",
	"/admin",
	"/_arc/../admin",
	"//example.com",
	"/arc/api/fomo/confirm",
])
	assert.ok((await api(path)).status >= 400, path);
const denied = await api(
	"/arc/api/fomo/intents",
	{ amount: "1", team: "dogs" },
	{ Origin: "https://other.example" },
);
assert.equal(denied.status, 403);

assert.equal((await api('/arc/api/fomo/intents', { amount: '1', team: 'dogs' })).status, 409);
assert.equal((await api('/arc/api/fomo/preview-confirm', { intentId: 'retired' })).status, 409);
assert.equal((await api('/arc/api/practice/donate', { amount: '1', team: 'dogs', requestId: crypto.randomUUID() })).status, 400);
const session = await (await api('/arc/api/practice/session', {})).json();
assert.equal(session.balance, '1000');
const again = await (await api('/arc/api/practice/session', {})).json();
assert.equal(again.id, session.id);
const practiceBefore = await (await api('/arc/api/practice/state')).json();
const input = { amount: '5', team: 'dogs', name: 'Smoke test · FUSD only', requestId: crypto.randomUUID() };
const first = await api('/arc/api/practice/donate', input);
assert.equal(first.status, 200);
const receipt = await first.json();
assert.equal(receipt.wallet.balance, '995');
const repeated = await (await api('/arc/api/practice/donate', input)).json();
assert.equal(repeated.wallet.balance, '995');
assert.equal(repeated.paymentId, receipt.paymentId);
const practiceAfter = await (await api('/arc/api/practice/state')).json();
assert.equal(practiceAfter.mode, 'practice');
assert.equal(practiceAfter.currency, 'FUSD');
assert.equal(practiceAfter.wallet.balance, '995');
assert.equal(practiceAfter.metrics.paidIntents, practiceBefore.metrics.paidIntents + 1);
assert.ok(practiceAfter.teams.every(t => t.topUp === '0'));
const realAfter = await (await api('/arc/api/fomo/state')).json();
assert.equal(realAfter.community, '0');
assert.equal(realAfter.topDonors.length, 0);
assert.equal(realAfter.round, null);
assert.ok(!JSON.stringify(realAfter).includes(receipt.paymentId));
console.log('HTTP smoke passed: eight campaign pages, isolated FUSD session/balance, exact-once practice play, real endpoints disabled, private routes protected.');
