import test from "node:test";
import assert from "node:assert/strict";
import { configuration } from "../server/config.mjs";
import { chainRpc } from "../server/evm.mjs";
test("watcher adapter reads through mounted ARC EVM actions with exact quantities", async () => {
	const config = configuration({ FOMO_MODE: "preview" });
	const { AFS } = await import(config.afsSdk),
		{ AFSEVM } = await import(config.evmSdk);
	const requests = [];
	const afs = new AFS();
	await afs.mount(
		new AFSEVM({
			endpoint: "https://rpc.invalid",
			chainId: "1",
			fetch: async (_url, init) => {
				const request = JSON.parse(init.body);
				requests.push(request.method);
				return Response.json({
					jsonrpc: "2.0",
					id: request.id,
					result:
						request.method === "eth_chainId" ? "0x1" : "0x2000000000000001",
				});
			},
		}),
		"/dev/chain/arc",
	);
	const rpc = chainRpc(afs);
	assert.equal(
		await rpc("eth_getBalance", ["0x" + "1".repeat(40), "finalized"]),
		"0x2000000000000001",
	);
	assert.deepEqual(requests, ["eth_chainId", "eth_getBalance"]);
	await assert.rejects(rpc("eth_sendRawTransaction", ["0x00"]));
});
