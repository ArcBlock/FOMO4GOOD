import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { configuration } from "../server/config.mjs";
import { workerConfig } from "../worker/config.mjs";

const testnet = {
	FOMO_MODE: "testnet",
	HOST: "127.0.0.1",
	FOMO_RECIPIENT: "0xEd738956C3F0afc89044A99C8fB8EEDA352db353",
	FOMO_OWNER_DID: "did:abt:fomo-config-test",
	FOMO_START_BLOCK: "10",
	FOMO_STARTS_AT: "2026-09-01T00:00:00.000Z",
	FOMO_ENDS_AT: "2026-12-31T00:00:00.000Z",
	FOMO_RPC_URL: "https://rpc.testnet.arc.io",
};

test("FOMO_ACCEPT_REAL opens only for loopback testnet", () => {
	assert.equal(configuration({ FOMO_MODE: "preview" }).acceptReal, false);
	assert.equal(configuration(testnet).acceptReal, false);
	const open = configuration({ ...testnet, FOMO_ACCEPT_REAL: "1" });
	assert.equal(open.acceptReal, true);
	assert.equal(
		open.recipient,
		"0xed738956c3f0afc89044a99c8fb8eeda352db353",
	);
	assert.throws(
		() => configuration({ FOMO_MODE: "preview", FOMO_ACCEPT_REAL: "1" }),
		/loopback/,
	);
	assert.throws(
		() =>
			configuration({
				...testnet,
				FOMO_ACCEPT_REAL: "1",
				HOST: "0.0.0.0",
			}),
		/loopback/,
	);
});

const workerTestnet = {
	FOMO_MODE: "testnet",
	FOMO_ORIGIN: "https://fomo4good.afsd.io",
	FOMO_OWNER_DID: "did:abt:fomo-worker-config",
	FOMO_INSTANCE_DID: "did:blocklet:fomo4good-staging-testnet",
	FOMO_RECIPIENT: "0xEd738956C3F0afc89044A99C8fB8EEDA352db353",
	FOMO_START_BLOCK: "10",
	FOMO_STARTS_AT: "2026-09-01T00:00:00.000Z",
	FOMO_ENDS_AT: "2026-12-31T00:00:00.000Z",
};

test("worker FOMO_ACCEPT_REAL opens staging testnet and refuses testnet on production", () => {
	assert.equal(
		workerConfig({
			FOMO_MODE: "practice",
			FOMO_ORIGIN: "https://fomo4good.com",
			FOMO_OWNER_DID: "did:abt:x",
			FOMO_INSTANCE_DID: "did:blocklet:x",
		}).acceptReal,
		false,
	);
	assert.equal(workerConfig(workerTestnet).acceptReal, false);
	const open = workerConfig({ ...workerTestnet, FOMO_ACCEPT_REAL: "1" });
	assert.equal(open.acceptReal, true);
	assert.equal(open.mode, "testnet");
	assert.throws(
		() =>
			workerConfig({
				...workerTestnet,
				FOMO_ACCEPT_REAL: "1",
				FOMO_ORIGIN: "https://fomo4good.com",
			}),
		/mainnet/,
	);
	assert.throws(
		() =>
			workerConfig({
				FOMO_MODE: "practice",
				FOMO_ACCEPT_REAL: "1",
				FOMO_ORIGIN: "https://fomo4good.afsd.io",
				FOMO_OWNER_DID: "did:abt:x",
				FOMO_INSTANCE_DID: "did:blocklet:x",
			}),
		/testnet or mainnet/,
	);
});

test("mainnet campaign profile opens on production with FOMO_ACCEPT_REAL", () => {
	const campaign = JSON.parse(
		readFileSync(new URL("../config/mainnet-campaign.json", import.meta.url)),
	);
	assert.equal(campaign.recipient, "0x985F6a6B60a0fFeaEC463EB7D912502e539F06eA");
	const env = {
		FOMO_MODE: "mainnet",
		HOST: "127.0.0.1",
		FOMO_ORIGIN: "https://fomo4good.com",
		FOMO_OWNER_DID: "did:abt:fomo-mainnet-config",
		FOMO_INSTANCE_DID: campaign.instanceDid,
		FOMO_RECIPIENT: campaign.recipient,
		FOMO_RPC_URL: campaign.rpcUrl,
		FOMO_START_BLOCK: String(campaign.startBlock),
		FOMO_STARTS_AT: campaign.startsAt,
		FOMO_ENDS_AT: campaign.endsAt,
	};
	const node = configuration(env);
	assert.equal(node.mode, "mainnet");
	assert.equal(node.chainId, 5042);
	assert.equal(node.explorer, "https://explorer.arc.io");
	assert.equal(node.acceptReal, false);
	assert.equal(
		node.recipient,
		"0x985f6a6b60a0ffeaec463eb7d912502e539f06ea",
	);
	const worker = workerConfig(env);
	assert.equal(worker.mode, "mainnet");
	assert.equal(worker.chainId, 5042);
	assert.equal(worker.acceptReal, false);
	const open = workerConfig({ ...env, FOMO_ACCEPT_REAL: "1" });
	assert.equal(open.acceptReal, true);
	assert.equal(open.mode, "mainnet");
	assert.equal(open.chainId, 5042);
});
