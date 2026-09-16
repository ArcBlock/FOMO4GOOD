import { parseArgs } from "node:util";
import { randomUUID } from "node:crypto";
import { configuration } from "../server/config.mjs";
import { openSpace } from "../server/space.mjs";
import { Store } from "../server/store.mjs";
const { values } = parseArgs({
	options: {
		team: { type: "string" },
		url: { type: "string" },
		reference: { type: "string" },
		"paid-usd": { type: "string" },
	},
});
const c = configuration();
if (
	!c.charities.some((t) => t.id === values.team) ||
	!/^\d{1,12}\.\d{2}$/.test(values["paid-usd"] || "") ||
	!values.reference ||
	values.reference.length > 200
)
	throw new Error(
		"Required: --team TEAM --url HTTPS_PUBLIC_RECEIPT --reference REFERENCE --paid-usd 100.00",
	);
const url = new URL(values.url);
if (url.protocol !== "https:" || url.username || url.password)
	throw new Error("Use a sanitized, public HTTPS receipt URL.");
const space = await openSpace(c),
	store = new Store(space.afs, c);
try {
	await store.update((s) => {
		if (
			!c.endsAt ||
			Date.now() < c.endsAt ||
			s.round ||
			(!c.preview && s.chainTime < c.endsAt)
		)
			throw new Error(
				"Wait until the campaign ends and the watcher closes all rounds.",
			);
		s.receipts ??= [];
		if (s.receipts.some((r) => r.reference === values.reference))
			throw new Error("Receipt reference already recorded.");
		s.receipts.push({
			id: randomUUID(),
			team: values.team,
			url: url.href,
			reference: values.reference,
			paidUsd: values["paid-usd"],
			recordedAt: Date.now(),
			mode: c.mode,
		});
	});
	console.log("Recorded receipt. No payment was executed.");
} finally {
	await space.close();
}
