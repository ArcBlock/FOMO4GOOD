import { randomBytes } from "node:crypto";
import { unavailableRealState } from "./practice.mjs";
import { createServer, request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
const HEADERS = {
	"Content-Type": "application/json; charset=utf-8",
	"Cache-Control": "no-store",
	"X-Content-Type-Options": "nosniff",
};
const send = (res, status, value) => {
	res.writeHead(status, HEADERS);
	res.end(JSON.stringify(value));
};
async function body(req) {
	if (!String(req.headers["content-type"] || "").startsWith("application/json"))
		throw new Error("Expected JSON.");
	let data = "";
	for await (const chunk of req) {
		data += chunk;
		if (data.length > 4096) throw new Error("Request too large.");
	}
	return JSON.parse(data);
}
export function createApp(config, store, watcher, practice) {
	const limits = new Map();
	const realAvailable = config.acceptReal === true;
	const server = createServer(async (req, res) => {
		try {
			if (!server.ready) return send(res, 503, { error: "Campaign starting." });
			if (
				!req.url.startsWith("/") ||
				req.url.startsWith("//") ||
				req.url.includes("\\")
			)
				return send(res, 400, { error: "Invalid path." });
			const url = new URL(req.url, config.origin),
				path = url.pathname;
			if (path === "/") {
				res.writeHead(302, { Location: "/arc/" });
				res.end();
				return;
			}
			// The eight campaign pages are real ARC pages (`blocklets/fomo4good/pages`);
			// this service only passes them through so the API stays same-origin.
			const pageMatch = path.match(
				/^\/arc(?:\/practice)?(?:\/(?:rules|teams|leaderboard))?\/?$/,
			);
			if (!path.startsWith("/arc/api/fomo/") && !path.startsWith("/arc/api/practice/")) {
				if (
					!["GET", "HEAD"].includes(req.method) ||
					!(
						!!pageMatch ||
						/^\/(?:_arc\/assets\/|media\/)/.test(path) ||
						/^\/aup(?:-core|-app|-ssr|-fallback|-inspect-bridge)?\.[a-z0-9]+\.(?:js|css)$/.test(
							path,
						) ||
						/^\/(?:favicon\.(?:ico|svg)|logo\.svg)$/.test(path)
					)
				)
					return send(res, 404, { error: "Not found." });
				const upstream = new URL(config.arcUrl);
				upstream.pathname = path;
				upstream.search = url.search;
				// node:fetch may discard an overridden Host header. ARC selects the site by Host.
				const response = await new Promise((resolve, reject) => {
					const request = (
						upstream.protocol === "https:" ? httpsRequest : httpRequest
					)(
						upstream,
						{ headers: { Host: "fomo4good.localhost" } },
						(result) => {
							const chunks = [];
							let bytes = 0;
							result.on("data", (chunk) => {
								bytes += chunk.length;
								if (bytes > 10_000_000) {
									request.destroy(new Error("Upstream response too large."));
									return;
								}
								chunks.push(chunk);
							});
							result.on("end", () =>
								resolve({
									status: result.statusCode,
									headers: result.headers,
									body: Buffer.concat(chunks),
								}),
							);
							result.on("error", reject);
						},
					);
					request.setTimeout(15000, () => {
						const e = new Error("Upstream timeout.");
						e.code = "ETIMEDOUT";
						request.destroy(e);
					});
					request.on("error", reject);
					request.end();
				});
				const headers = {};
				for (const key of [
					"content-type",
					"cache-control",
					"content-security-policy",
					"x-content-type-options",
					"referrer-policy",
					"permissions-policy",
					"location",
				]) {
					const v = response.headers[key];
					if (v) headers[key] = v;
				}
				if (headers.location)
					headers.location = String(headers.location).replace(
						/^https?:\/\/fomo4good\.(?:com|localhost)(?::[0-9]+)?/i,
						config.origin,
					);
				let content = response.body;
				if (headers["content-type"]?.includes("text/html")) {
					content = Buffer.from(
						content
							.toString()
							.replace(
								/<!-- inspect-bridge-start -->[\s\S]*?<!-- inspect-bridge-end -->/g,
								"",
							)
							// Absolute self-links (canonical, og:url) name the SEO host baked at
							// pre-render (sites.domains[0]) or the dev host; this origin serves them.
							.replace(
								/https?:\/\/fomo4good\.(?:com|localhost)(?::[0-9]+)?\/en\//g,
								config.origin + "/",
							)
							.replace(
								/https?:\/\/fomo4good\.(?:com|localhost)(?::[0-9]+)?(\/arc\/)/g,
								config.origin + "$1",
							)
							.replace(
								/https?:\/\/fomo4good\.(?:com|localhost)(?::[0-9]+)?\/media\//g,
								config.origin + "/media/",
							),
					);
				}
				res.writeHead(response.status, headers);
				res.end(req.method === "HEAD" ? undefined : content);
				return;
			}
			const practiceToken = /(?:^|;\s*)fomo_practice=([a-f0-9]{64})(?:;|$)/.exec(req.headers.cookie || "")?.[1] || null;
			if (req.method === "GET" && path === "/arc/api/practice/state" && practice)
				return send(res, 200, await practice.state(Date.now(), practiceToken));
			if (req.method === "GET" && path === "/arc/api/fomo/state") {
				const state = realAvailable ? await store.state() : unavailableRealState(config);
				if (realAvailable && watcher?.lastError) state.watcher.stale = true;
				return send(res, 200, state);
			}
			if (
				realAvailable && req.method === "GET" &&
				/^\/arc\/api\/fomo\/intents\/[a-f0-9-]{36}$/.test(path)
			) {
				const intent = await store.status(path.split("/").pop());
				return send(
					res,
					intent ? 200 : 404,
					intent || { error: "Intent not found." },
				);
			}
			if (req.method !== "POST") return send(res, 404, { error: "Not found." });
			if (req.headers.origin !== config.origin)
				return send(res, 403, { error: "Origin not allowed." });
			const key = req.socket.remoteAddress,
				now = Date.now();
			let limit = limits.get(key);
			if (!limit || limit.until < now) {
				limit = { count: 0, until: now + 60000 };
				limits.set(key, limit);
			}
			if (++limit.count > 30)
				return send(res, 429, {
					error: "Too many requests. Try again in a minute.",
				});
			if (limits.size > 1000)
				for (const [ip, row] of limits) if (row.until < now) limits.delete(ip);
			const input = await body(req);
			if (path.startsWith("/arc/api/practice/") && practice) {
				if (path === "/arc/api/practice/session") {
					const token = practiceToken || randomBytes(32).toString("hex");
					const wallet = await practice.session(token);
					res.setHeader("Set-Cookie", `fomo_practice=${token}; HttpOnly; SameSite=Strict; Path=/arc/api/practice; Max-Age=31536000${config.origin.startsWith("https:") ? "; Secure" : ""}`);
					return send(res, 200, wallet);
				}
				if (path === "/arc/api/practice/donate") return send(res, 200, await practice.donate(practiceToken, input));
				if (path === "/arc/api/practice/refill") return send(res, 200, await practice.refill(practiceToken));
				return send(res, 404, { error: "Not found." });
			}
			if (!realAvailable) return send(res, 409, { error: "Real donations are not open yet. Try Practice Round with FUSD." });

			if (path === "/arc/api/fomo/intents") {
				const state = await store.state();
				if (!config.preview && (state.watcher.stale || watcher?.lastError))
					return send(res, 503, {
						error: "Watcher is catching up. Please try again shortly.",
					});
				return send(res, 201, await store.intent(input));
			}
			if (path === "/arc/api/fomo/visit") {
				await store.update((s) => s.visits++);
				return send(res, 200, { ok: true });
			}
			return send(res, 404, { error: "Not found." });
		} catch (error) {
			if (
				["TimeoutError", "AbortError"].includes(error.name) ||
				error.cause?.code === "ECONNREFUSED" ||
				["ECONNREFUSED", "ETIMEDOUT"].includes(error.code)
			)
				return send(res, 503, { error: "Service temporarily unavailable." });
			console.error(error.message);
			return send(res, 400, {
				error: error.code?.startsWith("AFS_")
					? "Storage unavailable. Please try again."
					: error.message || "Unable to complete request.",
			});
		}
	});
	server.ready = false;
	return server;
}
