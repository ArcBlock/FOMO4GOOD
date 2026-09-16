import { Interface, zeroPadValue } from "ethers";
export const SYSTEM_EMITTER = "0xfffffffffffffffffffffffffffffffffffffffe";
const ABI = new Interface([
	"event Transfer(address indexed from,address indexed to,uint256 value)",
]);
const TOPIC = ABI.getEvent("Transfer").topicHash;
export function decodeLogs(logs, recipient, blocks) {
	const result = [];
	for (const log of logs) {
		if (log.address.toLowerCase() !== SYSTEM_EMITTER) continue;
		if (log.removed) throw new Error("Removed log in finalized feed.");
		const parsed = ABI.parseLog(log);
		if (!parsed || parsed.args.to.toLowerCase() !== recipient) continue;
		const block = blocks.get(Number(BigInt(log.blockNumber)));
		if (!block || block.hash !== log.blockHash)
			throw new Error("Transfer block hash mismatch.");
		if (parsed.args.value === 0n) continue;
		result.push({
			id: `${log.transactionHash}:${Number(BigInt(log.logIndex))}`,
			txHash: log.transactionHash,
			block: Number(BigInt(log.blockNumber)),
			blockHash: log.blockHash,
			transactionIndex: Number(BigInt(log.transactionIndex)),
			logIndex: Number(BigInt(log.logIndex)),
			from: parsed.args.from.toLowerCase(),
			units: String(parsed.args.value),
			at: Number(BigInt(block.timestamp)) * 1000,
		});
	}
	return result.sort(
		(a, b) =>
			a.block - b.block ||
			a.transactionIndex - b.transactionIndex ||
			a.logIndex - b.logIndex,
	);
}
export class Watcher {
	constructor(config, store, rpc) {
		this.config = config;
		this.store = store;
		if (!rpc) throw new Error("Watcher requires an ARC EVM provider RPC adapter.");
		this.rpc = rpc;
		this.busy = false;
		this.lastError = null;
	}
	async tick() {
		if (this.busy) return;
		this.busy = true;
		try {
			if (
				Number(BigInt(await this.rpc("eth_chainId", []))) !==
				this.config.chainId
			)
				throw new Error("RPC chain mismatch.");
			const { state } = await this.store.read();
			const block = (n) =>
				this.rpc("eth_getBlockByNumber", ["0x" + n.toString(16), false]);
			if (state.cursor) {
				const anchor = await block(state.cursor.block);
				if (anchor.hash !== state.cursor.hash)
					throw new Error(
						"Finalized history changed. Stop and reconcile before resuming.",
					);
			}
			const latest = await this.rpc("eth_getBlockByNumber", ["latest", false]);
			const head = Number(BigInt(latest.number));
			const start = state.cursor
				? state.cursor.block + 1
				: this.config.startBlock;
			if (start > head) {
				this.lastError = null;
				return;
			}
			const end = Math.min(head, start + 499);
			const endBlock = end === head ? latest : await block(end);
			const logs = await this.rpc("eth_getLogs", [
				{
					address: SYSTEM_EMITTER,
					fromBlock: "0x" + start.toString(16),
					toBlock: "0x" + end.toString(16),
					topics: [TOPIC, null, zeroPadValue(this.config.recipient, 32)],
				},
			]);
			const blocks = new Map([[end, endBlock]]);
			for (const n of new Set(logs.map((l) => Number(BigInt(l.blockNumber))))) {
				if (n < start || n > end)
					throw new Error("RPC log outside requested range.");
				if (!blocks.has(n)) blocks.set(n, await block(n));
			}
			const events = decodeLogs(logs, this.config.recipient, blocks);
			if ((await block(end)).hash !== endBlock.hash)
				throw new Error("Chain changed while indexing.");
			await this.store.batch(
				events,
				{ block: end, hash: endBlock.hash },
				Number(BigInt(endBlock.timestamp)) * 1000,
			);
			this.lastError = null;
		} finally {
			this.busy = false;
		}
	}
	start() {
		const run = () =>
			this.tick().catch((e) => {
				this.lastError = e.message;
				console.error("Watcher paused:", e.message);
			});
		run();
		this.timer = setInterval(run, 2000);
	}
	stop() {
		clearInterval(this.timer);
	}
}
