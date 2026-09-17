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
const execFailed = (r) => r?.success === false || r?.data?.success === false;
const execMessage = (r) =>
	r.error?.message ||
	r.data?.error?.message ||
	(typeof r.error === "string" ? r.error : "") ||
	"Unable to complete request.";
const execStatus = (r) => {
	const msg = execMessage(r);
	if (/not open yet/i.test(msg)) return 409;
	if (/catching up/i.test(msg)) return 503;
	if (/not found/i.test(msg)) return 404;
	return 400;
};
const execAction = async (game, path, args) => {
	try {
		return await game.exec(path, args);
	} catch (error) {
		return {
			success: false,
			error: { message: error.message || "Unable to complete request." },
		};
	}
};
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
			if (path.startsWith("/arc/api/")) {
				if (request.method === "GET" && path === "/arc/api/fomo/state") {
					const r = await game.read("/real");
					return r.data
						? reply(200, r.data.content)
						: reply(503, { error: "Game unavailable" });
				}
				if (request.method === "GET" && path === "/arc/api/practice/state") {
					const r = await game.exec("/practice/.actions/state", { token });
					return r.success
						? reply(200, r.data)
						: reply(503, { error: "Game unavailable" });
				}
				if (
					request.method === "GET" &&
					/^\/arc\/api\/fomo\/intents\/[a-f0-9-]{36}$/.test(path)
				) {
					const r = await execAction(game, "/real/.actions/status", {
						id: path.split("/").pop(),
					});
					if (execFailed(r))
						return reply(execStatus(r), { error: execMessage(r) });
					return r.data
						? reply(200, r.data)
						: reply(404, { error: "Intent not found." });
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
				if (path === "/arc/api/fomo/intents") {
					const r = await execAction(game, "/real/.actions/intent", {
						input: body,
					});
					if (execFailed(r))
						return reply(execStatus(r), { error: execMessage(r) });
					return reply(201, r.data);
				}
				if (path === "/arc/api/fomo/visit") {
					const r = await execAction(game, "/real/.actions/visit", {});
					if (execFailed(r))
						return reply(execStatus(r), { error: execMessage(r) });
					return reply(200, r.data);
				}
				if (
					![
						"/arc/api/practice/session",
						"/arc/api/practice/donate",
						"/arc/api/practice/refill",
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
								"Set-Cookie": `fomo_practice=${identity}; HttpOnly; SameSite=Strict; Path=/arc/api/practice; Max-Age=31536000${env.FOMO_ORIGIN.startsWith("https:") ? "; Secure" : ""}`,
							}
						: {};
				return reply(200, r.data, headers);
			}
			return reply(404, { error: "Not found" });
		} catch (error) {
			console.error(error);
			return reply(503, {
				error: error.message || "Service temporarily unavailable.",
			});
		}
	},
};
