import assert from "node:assert/strict";
const origin = process.env.FOMO_ORIGIN || "http://localhost:4931";
async function api(path, input, headers = {}) {
	const r = await fetch(origin + path, {
		...(input
			? {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Origin: origin,
						...headers,
					},
					body: JSON.stringify(input),
				}
			: { redirect: "manual" }),
		signal: AbortSignal.timeout(20000),
	});
	return r;
}
const before = await (await api("/api/fomo/state")).json();
assert.equal(
	before.mode,
	"preview",
	"Smoke test only runs against local preview.",
);
const redirect = await api("/");
assert.equal(redirect.status, 302);
assert.equal(redirect.headers.get("location"), "/arc");
const html = await (await api("/arc")).text();
assert.match(html, /data-fomo/);
assert.match(html, /MAKE CRYPTO/);
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
const response = await api("/api/fomo/intents", {
	amount: "1",
	team: "dogs",
	name: "Smoke test · simulated",
	url: "https://example.com",
});
assert.equal(response.status, 201);
const i = await response.json();
assert.match(i.amount, /^1\.00\d+/);
assert.equal(
	(await api("/api/fomo/preview-confirm", { intentId: i.id })).status,
	200,
);
assert.equal(
	(await api("/api/fomo/preview-confirm", { intentId: i.id })).status,
	200,
);
const receipt = await (await api("/api/fomo/intents/" + i.id)).json();
assert.ok(receipt.payment);
assert.equal(receipt.payment.team, "dogs");
const after = await (await api("/api/fomo/state")).json();
assert.equal(after.metrics.paidIntents, before.metrics.paidIntents + 1);
assert.ok(after.round);
assert.equal(after.round.team, "dogs");
assert.equal(after.round.endsAt, receipt.payment.at + 600000);
assert.ok(
	!JSON.stringify(after).includes(i.id),
	"public state must not expose private intent ids",
);
console.log(
	"HTTP smoke passed: /arc, assets, origin check, private-route boundaries, exact amount, confirmation and retry deduplication.",
);
