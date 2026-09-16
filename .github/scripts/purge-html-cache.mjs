// Purge the Cloudflare edge cache for the campaign pages after a deploy.
//
// `arc deploy` updates the DID Space origin but never purges the edge, and
// HTML ships with s-maxage=86400 — so a hot URL keeps serving the previous
// page for up to a day while the deploy reports success. Observed on the first
// staging publish (2026-09-16): /rules/ and /practice/teams/ were CF HITs of
// HTML that referenced an unpublished asset build.
//
// Warnings, not failures: the deploy already happened; a missing token or a
// purge hiccup must not paint a shipped release red.
const host = process.env.FETCH_HOST;
const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE_NAME || host?.split(".").slice(-2).join(".");
if (!host) {
	console.log("::notice::FETCH_HOST unset — nothing to purge.");
	process.exit(0);
}
if (!token) {
	console.log(`::warning::CLOUDFLARE_API_TOKEN unset — cannot purge ${host} HTML cache; pages may stay stale for s-maxage.`);
	process.exit(0);
}
const api = (path, init) =>
	fetch(`https://api.cloudflare.com/client/v4${path}`, {
		...init,
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...init?.headers },
	}).then((r) => r.json());
const zones = await api(`/zones?name=${zoneName}`);
const zone = zones.result?.[0]?.id;
if (!zone) {
	console.log(`::warning::Could not resolve Cloudflare zone id for ${zoneName} — HTML cache not purged.`);
	process.exit(0);
}
// Every campaign page, in the three spellings the edge may have cached
// (bare, trailing slash, ARC's locale-prefixed canonical), plus the site
// artifacts pre-render regenerates — the sitemap kept naming the previous
// SEO host at the CI runner's PoP after the pages themselves were purged.
const pages = ["", "teams", "leaderboard", "rules", "practice", "practice/teams", "practice/leaderboard", "practice/rules"];
const artifacts = ["/sitemap.xml", "/sitemap-pages.xml", "/sitemap-practice.xml", "/robots.txt", "/llms.txt", "/llms-full.txt"];
const files = [...new Set([...pages.flatMap((p) => [`/${p}`, `/${p}/`, `/en/${p}/`].map((u) => u.replace(/\/+/g, "/"))), ...artifacts].map((u) => `https://${host}${u}`))];
const result = await api(`/zones/${zone}/purge_cache`, { method: "POST", body: JSON.stringify({ files }) });
if (result.success) console.log(`purged ${files.length} HTML URLs on ${host}`);
else console.log(`::warning::HTML edge cache purge failed: ${JSON.stringify(result.errors).slice(0, 400)}`);
