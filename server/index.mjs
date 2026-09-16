import { configuration } from "./config.mjs";
import { openSpace } from "./space.mjs";
import { Store } from "./store.mjs";
import { Watcher } from "./payment.mjs";
import { createApp } from "./app.mjs";
import { PracticeStore, practiceConfiguration } from "./practice.mjs";
const config = configuration();
const space = await openSpace(config);
const store = new Store(space.afs, config);
const watcher = config.preview ? null : new Watcher(config, store);
const practiceConfig = practiceConfiguration(config);
const practiceSpace = await openSpace(practiceConfig);
const practice = new PracticeStore(practiceSpace.afs, practiceConfig);
const server = createApp(config, store, watcher, practice);
// Acquire the listener before first-time ledger initialization; one process per campaign.
await new Promise((resolve, reject) => {
	server.once("error", reject);
	server.listen(config.port, config.host, resolve);
});
try {
	await store.init();
	await practice.init();
	server.ready = true;
	watcher?.start();
} catch (e) {
	server.close();
	await space.close();
	await practiceSpace.close();
	throw e;
}
console.log(
	`FOMO4GOOD ${config.mode}: ${config.origin}/ | DID Space: ${config.instanceDid}`,
);
for (const signal of ["SIGINT", "SIGTERM"])
	process.on(signal, () => {
		watcher?.stop();
		server.close(async () => {
			await store.queue;
			await practice.queue;
			await space.close();
			await practiceSpace.close();
			process.exit(0);
		});
	});
