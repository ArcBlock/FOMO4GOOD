import { configuration } from "./config.mjs";
import { openSpace } from "./space.mjs";
import { Store } from "./store.mjs";
import { Watcher } from "./payment.mjs";
import { createApp } from "./app.mjs";
const config = configuration();
const space = await openSpace(config);
const store = new Store(space.afs, config);
const watcher = config.preview ? null : new Watcher(config, store);
const server = createApp(config, store, watcher);
// Acquire the listener before first-time ledger initialization; one process per campaign.
await new Promise((resolve, reject) => {
	server.once("error", reject);
	server.listen(config.port, config.host, resolve);
});
try {
	await store.init();
	server.ready = true;
	watcher?.start();
} catch (e) {
	server.close();
	await space.close();
	throw e;
}
console.log(
	`FOMO4GOOD ${config.mode}: ${config.origin}/arc | DID Space: ${config.instanceDid}`,
);
for (const signal of ["SIGINT", "SIGTERM"])
	process.on(signal, () => {
		watcher?.stop();
		server.close(async () => {
			await store.queue;
			await space.close();
			process.exit(0);
		});
	});
