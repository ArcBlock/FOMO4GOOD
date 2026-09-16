import charities from "../config/charities.json" with { type: "json" };
export function workerConfig(env) {
	if (!["practice", "testnet", "mainnet"].includes(env.FOMO_MODE))
		throw new Error("Worker supports practice, testnet, or mainnet.");
	if (!env.FOMO_OWNER_DID || !env.FOMO_INSTANCE_DID)
		throw new Error("Explicit owner and campaign DIDs required");
	const preview = env.FOMO_MODE === "practice";
	const mainnet = env.FOMO_MODE === "mainnet";
	const config = {
		mode: preview ? "preview" : env.FOMO_MODE,
		preview,
		ownerDid: env.FOMO_OWNER_DID,
		instanceDid: env.FOMO_INSTANCE_DID,
		chainId: Number(env.FOMO_CHAIN_ID) || (mainnet ? 5042 : 5042002),
		rpcUrl:
			env.FOMO_RPC_URL ||
			(mainnet
				? "https://rpc.blockdaemon.mainnet.arc.io"
				: "https://rpc.testnet.arc.io"),
		recipient: (env.FOMO_RECIPIENT || "").toLowerCase(),
		startBlock: Number(env.FOMO_START_BLOCK || 0),
		startsAt: Date.parse(env.FOMO_STARTS_AT || "") || 0,
		endsAt: Date.parse(env.FOMO_ENDS_AT || "") || 0,
		explorer:
			env.FOMO_EXPLORER ||
			(mainnet ? "https://explorer.arc.io" : "https://testnet.arcscan.app"),
		networkName: mainnet ? "Circle Arc" : "Circle Arc Testnet",
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
			"Live collection requires recipient, start block and campaign dates",
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
		throw new Error("FOMO_ACCEPT_REAL requires FOMO_MODE=testnet or mainnet");
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
