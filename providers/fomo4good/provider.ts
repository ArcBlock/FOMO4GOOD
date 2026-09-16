import {
	Actions,
	AFSBaseProvider,
	AFSNotFoundError,
	Explain,
	List,
	Meta,
	Read,
	Stat,
	type ProviderTreeSchema,
	type RouteContext,
} from "@aigne/afs";
import { joinURL } from "ufo";

/** Private service-bound provider. Only sanitized state and semantic actions.
 * The trusted gateway supplies tokens; clients cannot select storage scopes.
 */
export class FomoProvider extends AFSBaseProvider {
	override readonly name = "fomo4good";
	override readonly accessMode = "readwrite" as const;
	constructor(private readonly services: any) {
		super();
	}
	static treeSchema(): ProviderTreeSchema {
		return {
			operations: ["read", "list", "stat", "explain", "exec"],
			tree: {
				"/": { kind: "fomo:root" },
				"/real": {
					kind: "fomo:state",
					actions: ["intent", "status", "visit"],
				},
				"/practice": {
					kind: "fomo:state",
					actions: ["session", "state", "donate", "refill"],
				},
			},
			bestFor: ["FOMO4GOOD game"],
			notFor: ["raw ledger access", "chain RPC"],
		};
	}
	@Read("/")
	root() {
		return this.buildEntry("/", {
			content: { modes: ["real", "practice"] },
			meta: { kind: "fomo:root", childrenCount: 2 },
		});
	}
	@List("/")
	children() {
		return {
			data: ["real", "practice"].map((name) =>
				this.buildEntry(joinURL("/", name), {
					meta: { kind: "fomo:state", childrenCount: 0 },
				}),
			),
		};
	}
	@Read("/real")
	async real() {
		const { config, store, unavailableRealState, watcher } = this.services;
		const content = config.acceptReal
			? await store.state()
			: unavailableRealState(config);
		if (config.acceptReal && content.watcher && watcher?.lastError)
			content.watcher = { ...content.watcher, error: watcher.lastError };
		return this.buildEntry("/real", { content });
	}
	@Read("/practice")
	async practice() {
		return this.buildEntry("/practice", {
			content: await this.services.practice.state(Date.now(), null, {
				settle: false,
			}),
		});
	}
	@Stat("/")
	statRoot() {
		return {
			data: this.buildEntry("/", {
				meta: { kind: "fomo:root", childrenCount: 2 },
			}),
		};
	}
	@Meta("/")
	metaRoot() {
		return this.buildEntry("/.meta", {
			content: { kind: "fomo:root" },
			meta: { kind: "fomo:root" },
		});
	}
	@Stat("/:mode")
	statMode(ctx: RouteContext) {
		const mode = ctx.params.mode;
		if (!["real", "practice"].includes(mode))
			throw new AFSNotFoundError(ctx.path);
		return {
			data: this.buildEntry(joinURL("/", mode), {
				meta: { kind: "fomo:state", childrenCount: 0 },
			}),
		};
	}
	@Meta("/:mode")
	metaMode(ctx: RouteContext) {
		this.statMode(ctx);
		return this.buildEntry(joinURL("/", ctx.params.mode, ".meta"), {
			content: { kind: "fomo:state" },
			meta: { kind: "fomo:state" },
		});
	}
	@List("/:mode")
	listMode(ctx: RouteContext) {
		this.statMode(ctx);
		return { data: [] };
	}
	@Read("/.meta/.capabilities")
	capabilities() {
		return this.buildEntry("/.meta/.capabilities", {
			content: {
				schemaVersion: 1,
				provider: this.name,
				operations: this.getOperationsDeclaration(),
				tools: [],
				actions: [
					{ discovery: { pathTemplate: "/practice/.actions" } },
					{ discovery: { pathTemplate: "/real/.actions" } },
				],
			},
		});
	}
	@Explain("/")
	explainRoot() {
		return {
			format: "markdown" as const,
			content:
				"FOMO4GOOD private provider: real/practice state, practice session/state/donate/refill, and gated real intent/status/visit actions. No raw ledger, generic writes or caller-supplied chain events. Browser identity is supplied only by the trusted gateway.",
		};
	}
	@Actions("/practice")
	actions() {
		return {
			data: ["session", "state", "donate", "refill"].map((name) =>
				this.buildEntry(joinURL("/practice/.actions", name), {
					meta: { kind: "afs:executable" },
					content: {
						description: `Practice ${name}`,
						schema: {
							type: "object",
							required: ["token"],
							properties: {
								token: { type: "string" },
								input: { type: "object" },
							},
						},
					},
				}),
			),
		};
	}
	@Actions.Exec("/practice", "session", undefined, { effect: "write" })
	async session(_ctx: RouteContext, args: Record<string, unknown>) {
		return {
			success: true,
			data: await this.services.practice.session(args.token),
		};
	}
	@Actions.Exec("/practice", "state", undefined, {
		effect: "read",
		readonly: true,
	})
	async state(_ctx: RouteContext, args: Record<string, unknown>) {
		return {
			success: true,
			data: await this.services.practice.state(Date.now(), args.token, {
				settle: false,
			}),
		};
	}
	@Actions.Exec("/practice", "donate", undefined, { effect: "write" })
	async donate(_ctx: RouteContext, args: Record<string, unknown>) {
		return {
			success: true,
			data: await this.services.practice.donate(args.token, args.input || {}),
		};
	}
	@Actions.Exec("/practice", "refill", undefined, { effect: "write" })
	async refill(_ctx: RouteContext, args: Record<string, unknown>) {
		return {
			success: true,
			data: await this.services.practice.refill(args.token),
		};
	}
	requireReal() {
		if (!this.services.config.acceptReal)
			throw new Error(
				"Real donations are not open yet. Try Practice Round with FUSD.",
			);
	}
	@Actions("/real")
	realActions() {
		return {
			data: ["intent", "status", "visit"].map((name) =>
				this.buildEntry(joinURL("/real/.actions", name), {
					meta: { kind: "afs:executable" },
					content: {
						description: `Real ${name}`,
						schema: { type: "object", properties: {} },
					},
				}),
			),
		};
	}
	realResult(fn: () => Promise<{ success: true; data: unknown }>) {
		try {
			this.requireReal();
		} catch (e) {
			return {
				success: false as const,
				error: { message: (e as Error).message },
			};
		}
		return fn().catch((e: Error) => ({
			success: false as const,
			error: { message: e.message || "Unable to complete request." },
		}));
	}
	@Actions.Exec("/real", "intent", undefined, { effect: "write" })
	intent(_ctx: RouteContext, args: Record<string, unknown>) {
		return this.realResult(async () => {
			const { store, watcher } = this.services;
			const state = await store.state(Date.now(), { settle: false });
			if (state.watcher?.stale || watcher?.lastError)
				throw new Error(
					"Watcher is catching up. Please try again shortly.",
				);
			return {
				success: true,
				data: await store.intent(args.input || {}),
			};
		});
	}
	@Actions.Exec("/real", "status", undefined, {
		effect: "read",
		readonly: true,
	})
	status(_ctx: RouteContext, args: Record<string, unknown>) {
		return this.realResult(async () => ({
			success: true,
			data: await this.services.store.status(String(args.id || "")),
		}));
	}
	@Actions.Exec("/real", "visit", undefined, { effect: "write" })
	visit() {
		return this.realResult(async () => {
			await this.services.store.update((s: { visits: number }) => s.visits++);
			return { success: true, data: { ok: true } };
		});
	}
}
