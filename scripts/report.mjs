import { configuration } from "../server/config.mjs";
import { openSpace } from "../server/space.mjs";
import { Store } from "../server/store.mjs";
import { settlement } from "../server/analytics.mjs";
const c = configuration(),
	space = await openSpace(c);
try {
	const { state } = await new Store(space.afs, c).read();
	console.log(JSON.stringify(settlement(state, c), null, 2));
} finally {
	await space.close();
}
