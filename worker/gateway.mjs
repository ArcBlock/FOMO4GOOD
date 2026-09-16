import { ServiceBindingProxy } from "@aigne/afs-session";
const reply = (status, value, headers = {}) =>
	Response.json(value, {
		status,
		headers: {
			"Cache-Control": "no-store",
			"X-Content-Type-Options": "nosniff",
			...headers,
		},
	});
const tokenFor = (request) =>
	/(?:^|;\s*)fomo_practice=([a-f0-9]{64})(?:;|$)/.exec(
		request.headers.get("cookie") || "",
	)?.[1] || null;
const newToken = () =>
	Array.from(crypto.getRandomValues(new Uint8Array(32)), (n) =>
		n.toString(16).padStart(2, "0"),
	).join("");
async function input(request) {
	if (!request.headers.get("content-type")?.startsWith("application/json"))
		throw new Error("Expected JSON");
	const reader = request.body?.getReader();
	if (!reader) throw new Error("Expected JSON");
	const chunks = [];
	let size = 0;
	try {
		for (;;) {
			const { done, value } = await reader.read();
			if (done) break;
			size += value.length;
			if (size > 4096) {
				await reader.cancel();
				throw new Error("Request too large");
			}
			chunks.push(value);
		}
	} finally {
		reader.releaseLock();
	}
	const bytes = new Uint8Array(size);
	let offset = 0;
	for (const c of chunks) {
		bytes.set(c, offset);
		offset += c.length;
	}
	return JSON.parse(new TextDecoder().decode(bytes));
}
export default {
	async fetch(request, env) {
		const url = new URL(request.url),
			path = url.pathname;
		const game = new ServiceBindingProxy(
			"fomo4good",
			env.FOMO_PROVIDER,
			"fomo-gateway",
		);
		const token = tokenFor(request);
		try {
			if (path.startsWith("/api/")) {
				if (request.method === "GET" && path === "/api/fomo/state") {
					const r = await game.read("/real");
					return r.data
						? reply(200, r.data.content)
						: reply(503, { error: "Game unavailable" });
				}
				if (request.method === "GET" && path === "/api/practice/state") {
					const r = await game.exec("/practice/.actions/state", { token });
					return r.success
						? reply(200, r.data)
						: reply(503, { error: "Game unavailable" });
				}
				if (request.method !== "POST")
					return reply(404, { error: "Not found" });
				if (request.headers.get("origin") !== env.FOMO_ORIGIN)
					return reply(403, { error: "Origin not allowed" });
				// Native CF rate limiting at the public boundary; fail closed if not provisioned.
				if (!env.FOMO_RATE_LIMITER)
					return reply(503, { error: "Gateway not configured" });
				const limited = await env.FOMO_RATE_LIMITER.limit({
					key: request.headers.get("CF-Connecting-IP") || "unknown",
				});
				if (!limited.success)
					return reply(429, {
						error: "Too many requests. Try again in a minute.",
					});
				const body = await input(request);
				if (
					![
						"/api/practice/session",
						"/api/practice/donate",
						"/api/practice/refill",
					].includes(path)
				)
					return reply(409, {
						error:
							"Real donations are not open yet. Try Practice Round with FUSD.",
					});
				const action = path.split("/").pop();
				const identity = token || (action === "session" ? newToken() : null);
				// Ignore any caller-supplied identity, mode or ledger path.
				const r = await game.exec(`/practice/.actions/${action}`, {
					token: identity,
					input: body,
				});
				if (!r.success)
					return reply(400, { error: "Unable to complete practice request." });
				const headers =
					action === "session"
						? {
								"Set-Cookie": `fomo_practice=${identity}; HttpOnly; SameSite=Strict; Path=/api/practice; Max-Age=31536000${env.FOMO_ORIGIN.startsWith("https:") ? "; Secure" : ""}`,
							}
						: {};
				return reply(200, r.data, headers);
			}
			if (path === "/")
				return Response.redirect(new URL("/arc", env.FOMO_ORIGIN), 302);
			const match = path.match(
				/^\/arc(?:\/(practice))?(?:\/(rules|teams|leaderboard))?\/?$/,
			);
			const asset =
				/^\/(?:_arc\/assets\/|media\/|aup(?:-core|-app|-ssr|-inspect-bridge)?\.[a-z0-9]+\.(?:js|css)$|favicon.ico$|logo.svg$)/.test(
					path,
				);
			if (!["GET", "HEAD"].includes(request.method) || (!match && !asset))
				return reply(404, { error: "Not found" });
			const upstream = new URL(env.FOMO_ARC_ORIGIN);
			upstream.pathname = match ? "/en/" : path;
			upstream.search = url.search;
			// Service Binding target is deployment-owned. Browser cannot select a host.
			const response = await env.ARC_SITE.fetch(
				new Request(upstream, { method: request.method }),
			);
			const headers = new Headers();
			for (const name of [
				"content-type",
				"cache-control",
				"content-security-policy",
				"x-content-type-options",
				"referrer-policy",
				"permissions-policy",
			])
				if (response.headers.has(name))
					headers.set(name, response.headers.get(name));
			if (request.method === "HEAD")
				return new Response(null, { status: response.status, headers });
			if (!headers.get("content-type")?.includes("text/html"))
				return new Response(response.body, {
					status: response.status,
					headers,
				});
			const view = match?.[2] || "play",
				mode = match?.[1] ? "practice" : "real";
			let html = await response.text();
			html = html
				.replace(
					/(<div\b[^>]*\bdata-fomo\b[^>]*\bdata-view=)"play"/,
					`$1"${view}"`,
				)
				.replace(
					/(<div\b[^>]*\bdata-fomo\b[^>]*\bdata-mode=)"real"/,
					`$1"${mode}"`,
				)
				.replace(`data-nav="${view}"`, `data-nav="${view}" aria-current="page"`)
				.replace(
					/<!-- inspect-bridge-start -->[\s\S]*?<!-- inspect-bridge-end -->/g,
					"",
				);
			html = html
				.split(new URL("/en/", env.FOMO_ARC_ORIGIN).href)
				.join(env.FOMO_ORIGIN + path)
				.split(new URL("/media/", env.FOMO_ARC_ORIGIN).href)
				.join(env.FOMO_ORIGIN + "/media/");
			return new Response(html, { status: response.status, headers });
		} catch {
			return reply(503, { error: "Service temporarily unavailable." });
		}
	},
};
