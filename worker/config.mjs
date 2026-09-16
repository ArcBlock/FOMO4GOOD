import charities from "../config/charities.json" with { type: "json" };
export function workerConfig(env) {
	if (!["practice", "testnet"].includes(env.FOMO_MODE))
		throw new Error(
			"Worker supports practice or testnet; real collection remains closed.",
		);
	if (!env.FOMO_OWNER_DID || !env.FOMO_INSTANCE_DID)
		throw new Error("Explicit owner and campaign DIDs required");
	const preview = env.FOMO_MODE === "practice";
	const config = {
		mode: preview ? "preview" : "testnet",
		preview,
		ownerDid: env.FOMO_OWNER_DID,
		instanceDid: env.FOMO_INSTANCE_DID,
		chainId: 5042002,
		rpcUrl: env.FOMO_RPC_URL || "https://rpc.testnet.arc.io",
		recipient: (env.FOMO_RECIPIENT || "").toLowerCase(),
		startBlock: Number(env.FOMO_START_BLOCK || 0),
		startsAt: Date.parse(env.FOMO_STARTS_AT || "") || 0,
		endsAt: Date.parse(env.FOMO_ENDS_AT || "") || 0,
		explorer: "https://testnet.arcscan.app",
		roundMs: 600000,
		intentMs: 600000,
		charities,
		rogueTeam: "kids",
	};
	if (
		!preview &&
		(!/^0x[0-9a-f]{40}$/.test(config.recipient) ||
			/^0x0{40}$/.test(config.recipient) ||
			!Number.isSafeInteger(config.startBlock) ||
			config.startBlock < 1 ||
			!config.startsAt ||
			config.endsAt <= config.startsAt)
	)
		throw new Error(
			"Testnet requires recipient, start block and campaign dates",
		);
	const origin = new URL(env.FOMO_ORIGIN);
	if (
		origin.protocol !== "https:" &&
		!["localhost", "127.0.0.1"].includes(origin.hostname)
	)
		throw new Error("Public origin requires HTTPS");
	config.origin = origin.origin;
	const wantReal =
		env.FOMO_ACCEPT_REAL === "1" || env.FOMO_ACCEPT_REAL === "true";
	if (wantReal && preview)
		throw new Error("FOMO_ACCEPT_REAL requires FOMO_MODE=testnet");
	if (wantReal && /(?:^|\.)fomo4good\.com$/i.test(origin.hostname))
		throw new Error("FOMO_ACCEPT_REAL is not allowed on production");
	config.acceptReal = Boolean(wantReal && !preview);
	config.practiceInstanceDid = env.FOMO_PRACTICE_INSTANCE_DID || "";
	return config;
}
export function practiceConfig(config) {
	return {
		...config,
		mode: "practice",
		preview: true,
		acceptReal: false,
		chainId: 0,
		recipient: "",
		rpcUrl: "",
		explorer: "",
		startBlock: 0,
		startsAt: 0,
		endsAt: 0,
		instanceDid:
			config.practiceInstanceDid || config.instanceDid + "-practice",
	};
}
