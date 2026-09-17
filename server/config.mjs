import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sdk, arcHome } from "../scripts/runtime.mjs";
export function configuration(env = process.env) {
	const mode = env.FOMO_MODE;
	if (!["preview", "testnet", "mainnet"].includes(mode))
		throw new Error("Set FOMO_MODE=preview, testnet, or mainnet.");
	const preview = mode === "preview";
	const mainnet = mode === "mainnet";
	const port = Number(env.PORT || 4931);
	const host = env.HOST || "127.0.0.1";
	const loopback = ["127.0.0.1", "localhost", "::1"].includes(host);
	const wantReal =
		env.FOMO_ACCEPT_REAL === "1" || env.FOMO_ACCEPT_REAL === "true";
	if (wantReal && (preview || !loopback))
		throw new Error(
			"FOMO_ACCEPT_REAL is only allowed for FOMO_MODE=testnet or mainnet bound to loopback.",
		);
	const config = {
		mode,
		preview,
		acceptReal: Boolean(wantReal && !preview && loopback),
		port,
		host,
		origin: env.FOMO_ORIGIN || `http://localhost:${port}`,
		arcUrl: env.FOMO_ARC_URL || "http://127.0.0.1:4930",
		spaceRoot: resolve(env.FOMO_SPACE_ROOT || `var/${mode}/spaces`),
		ownerDid:
			env.FOMO_OWNER_DID || (preview ? "did:abt:fomo-preview-owner" : ""),
		instanceDid: env.FOMO_INSTANCE_DID || `did:abt:fomo4good-${mode}`,
		sdk: env.ARC_DID_SPACE_MODULE || sdk,
		evmSdk: resolve(arcHome, "providers/runtime/evm/dist/index.mjs"),
		afsSdk: resolve(arcHome, "packages/core/dist/index.mjs"),
		chainId: Number(env.FOMO_CHAIN_ID) || (mainnet ? 5042 : 5042002),
		rpcUrl:
			env.FOMO_RPC_URL ||
			(mainnet
				? "https://rpc.blockdaemon.mainnet.arc.io"
				: "https://rpc.testnet.arc.io"),
		recipient: (env.FOMO_RECIPIENT || "").toLowerCase(),
		explorer:
			env.FOMO_EXPLORER ||
			(mainnet ? "https://explorer.arc.io" : "https://testnet.arcscan.app"),
		networkName: mainnet ? "Circle Arc" : "Circle Arc Testnet",
		startBlock: Number(env.FOMO_START_BLOCK || 0),
		startsAt: env.FOMO_STARTS_AT ? Date.parse(env.FOMO_STARTS_AT) : 0,
		endsAt: env.FOMO_ENDS_AT ? Date.parse(env.FOMO_ENDS_AT) : 0,
		charities: JSON.parse(
			readFileSync(
				new URL("../config/charities.json", import.meta.url),
				"utf8",
			),
		),
		rogueTeam: "kids",
		intentMs: 10 * 60_000,
		roundMs: 10 * 60_000,
	};
	if (!Number.isInteger(port) || port < 1024 || port > 65535)
		throw new Error("Invalid port.");
	if (preview && !["127.0.0.1", "localhost", "::1"].includes(config.host))
		throw new Error("Preview must bind to loopback.");
	if (
		!preview &&
		(!/^0x[0-9a-f]{40}$/.test(config.recipient) ||
			/^0x0{40}$/.test(config.recipient) ||
			!config.ownerDid ||
			!Number.isSafeInteger(config.startBlock) ||
			config.startBlock < 1 ||
			!Number.isFinite(config.startsAt) ||
			!Number.isFinite(config.endsAt) ||
			config.endsAt <= config.startsAt ||
			!/^https:\/\//.test(config.rpcUrl))
	)
		throw new Error(
			"Live collection requires recipient, owner DID, start block and finite campaign start/end.",
		);
	if (
		config.acceptReal &&
		/(?:^|\.)fomo4good\.com$/i.test(new URL(config.origin).hostname) &&
		!mainnet
	)
		throw new Error("Production collection requires FOMO_MODE=mainnet");
	return config;
}
