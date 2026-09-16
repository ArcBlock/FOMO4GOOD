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
const before = await (await api("/api/fomo/state")).json();
assert.equal(
	before.mode,
	"unavailable",
	"Smoke must never spend real funds.",
);
const redirect = await api("/");
assert.equal(redirect.status, 302);
assert.equal(redirect.headers.get("location"), "/arc");
const html = await (await api("/arc")).text();
assert.match(html, /data-fomo/);
assert.match(html, /MAKE CRYPTO/);
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
 assert.ok(body.includes('href="/arc#play"'));
 assert.ok(body.includes(`rel="canonical" href="${origin}/arc/${page}"`));
 assert.equal((await api(`/arc/${page}/`)).status, 200);
}
assert.equal((await api('/arc/unknown')).status, 404);

assert.ok(html.includes(`rel="canonical" href="${origin}/arc"`));
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
	"/api/fomo/confirm",
])
	assert.ok((await api(path)).status >= 400, path);
const denied = await api(
	"/api/fomo/intents",
	{ amount: "1", team: "dogs" },
	{ Origin: "https://other.example" },
);
assert.equal(denied.status, 403);

assert.equal((await api('/api/fomo/intents', { amount: '1', team: 'dogs' })).status, 409);
assert.equal((await api('/api/fomo/preview-confirm', { intentId: 'retired' })).status, 409);
assert.equal((await api('/api/practice/donate', { amount: '1', team: 'dogs', requestId: crypto.randomUUID() })).status, 400);
const session = await (await api('/api/practice/session', {})).json();
assert.equal(session.balance, '1000');
const again = await (await api('/api/practice/session', {})).json();
assert.equal(again.id, session.id);
const practiceBefore = await (await api('/api/practice/state')).json();
const input = { amount: '5', team: 'dogs', name: 'Smoke test · FUSD only', requestId: crypto.randomUUID() };
const first = await api('/api/practice/donate', input);
assert.equal(first.status, 200);
const receipt = await first.json();
assert.equal(receipt.wallet.balance, '995');
const repeated = await (await api('/api/practice/donate', input)).json();
assert.equal(repeated.wallet.balance, '995');
assert.equal(repeated.paymentId, receipt.paymentId);
const practiceAfter = await (await api('/api/practice/state')).json();
assert.equal(practiceAfter.mode, 'practice');
assert.equal(practiceAfter.currency, 'FUSD');
assert.equal(practiceAfter.wallet.balance, '995');
assert.equal(practiceAfter.metrics.paidIntents, practiceBefore.metrics.paidIntents + 1);
assert.ok(practiceAfter.teams.every(t => t.topUp === '0'));
const realAfter = await (await api('/api/fomo/state')).json();
assert.equal(realAfter.community, '0');
assert.equal(realAfter.topDonors.length, 0);
assert.equal(realAfter.round, null);
assert.ok(!JSON.stringify(realAfter).includes(receipt.paymentId));
console.log('HTTP smoke passed: eight campaign pages, isolated FUSD session/balance, exact-once practice play, real endpoints disabled, private routes protected.');
