// Post-deploy smoke check for the FOMO4GOOD blocklet.
//
// Fails on the things a bad deploy silently breaks: a campaign page that does
// not render, a page rendered for the wrong view/mode, teams missing from the
// page, or a shell asset whose build hash was never published to the CDN
// (the first staging publish shipped HTML from an unreleased arc build and
// every page loaded without aup-core.css / aup-ssr.js — nothing in the deploy
// output said so).
//
// The canonical / sitemap host is NOT asserted: it is `sites[].domains[0]` from
// blocklet.yaml at pre-render time, and the campaign's public domain is not
// decided yet.
import assert from "node:assert/strict";
const host = process.env.FETCH_HOST;
if (!host) {
	console.log("::notice::FETCH_HOST unset — smoke check skipped.");
	process.exit(0);
}
const base = `https://${host}`;
const get = (path) => fetch(base + path, { redirect: "manual", signal: AbortSignal.timeout(30000) });
const pages = [
	["/", "play", "real"], ["/teams/", "teams", "real"], ["/leaderboard/", "leaderboard", "real"], ["/rules/", "rules", "real"],
	["/practice/", "play", "practice"], ["/practice/teams/", "teams", "practice"], ["/practice/leaderboard/", "leaderboard", "practice"], ["/practice/rules/", "rules", "practice"],
];
let failed = 0;
const check = async (label, fn) => {
	try { await fn(); console.log(`  ok   ${label}`); }
	catch (e) { failed++; console.log(`::error::smoke check failed: ${label} — ${e.message}`); }
};
const assets = new Set();
for (const [path, view, mode] of pages) {
	await check(`${path} renders as ${view}/${mode}`, async () => {
		const r = await get(path);
		assert.equal(r.status, 200);
		const html = await r.text();
		const root = html.match(/data-fomo data-view="([a-z]+)" data-mode="([a-z]+)"/);
		assert.ok(root, "no [data-fomo] root");
		assert.deepEqual(root.slice(1), [view, mode]);
		const teams = JSON.parse(html.match(/data-team-records>([^<]*)</)?.[1] || "[]");
		assert.equal(teams.length, 5, `expected 5 teams, got ${teams.length}`);
		assert.ok(html.includes(`data-nav="${view}" aria-current="page"`), "active nav not marked");
		for (const m of html.matchAll(/(?:src|href)="([^"]*\/aup[a-z-]*\.[a-z0-9]+\.(?:js|css))"/g)) assets.add(m[1]);
	});
}
for (const asset of assets) {
	await check(`asset ${asset}`, async () => {
		const r = await fetch(asset.startsWith("http") ? asset : base + asset, { method: "HEAD", signal: AbortSignal.timeout(30000) });
		assert.equal(r.status, 200);
	});
}
await check("/teams redirects to its canonical slash form", async () => {
	const r = await get("/teams");
	assert.equal(r.status, 308);
	assert.equal(r.headers.get("location"), "/teams/");
});
await check("launch artwork is served", async () => {
	const r = await get("/media/launch-pixel.jpg");
	assert.equal(r.status, 200);
	assert.match(r.headers.get("content-type") || "", /image\/jpeg/);
});
await check("sitemap is served", async () => assert.equal((await get("/sitemap.xml")).status, 200));
await check("unknown practice page is a 404", async () => assert.equal((await get("/practice/nope/")).status, 404));
console.log(`smoke: ${failed} failed`);
if (process.env.GITHUB_OUTPUT) {
	const { appendFileSync } = await import("node:fs");
	appendFileSync(process.env.GITHUB_OUTPUT, `failed=${failed}\n`);
}
process.exit(failed ? 1 : 0);
