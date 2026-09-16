import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sdk, arcHome } from "../scripts/runtime.mjs";
export function configuration(env = process.env) {
	const mode = env.FOMO_MODE;
	if (!["preview", "testnet"].includes(mode))
		throw new Error(
			"Set FOMO_MODE=preview or testnet. Mainnet requires a verified Circle Arc network profile before enabling real donations.",
		);
	const preview = mode === "preview";
	const port = Number(env.PORT || 4931);
	const config = {
		mode,
		preview,
		port,
		host: env.HOST || "127.0.0.1",
		origin: env.FOMO_ORIGIN || `http://localhost:${port}`,
		arcUrl: env.FOMO_ARC_URL || "http://127.0.0.1:4930",
		spaceRoot: resolve(env.FOMO_SPACE_ROOT || `var/${mode}/spaces`),
		ownerDid:
			env.FOMO_OWNER_DID || (preview ? "did:abt:fomo-preview-owner" : ""),
		instanceDid: env.FOMO_INSTANCE_DID || `did:abt:fomo4good-${mode}`,
		sdk: env.ARC_DID_SPACE_MODULE || sdk,
		evmSdk: resolve(arcHome, "providers/runtime/evm/dist/index.mjs"),
		afsSdk: resolve(arcHome, "packages/core/dist/index.mjs"),
		chainId: 5042002,
		rpcUrl: env.FOMO_RPC_URL || "https://rpc.testnet.arc.io",
		recipient: (env.FOMO_RECIPIENT || "").toLowerCase(),
		explorer: "https://testnet.arcscan.app",
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
			"Testnet requires recipient, owner DID, start block and finite campaign start/end.",
		);
	return config;
}
