import { describe } from "bun:test";
import { runProviderTests } from "@aigne/afs-testing";
import { FomoProvider } from "./provider.ts";
const create = () =>
	new FomoProvider({
		config: { mode: "preview" },
		unavailableRealState: () => ({ mode: "unavailable", community: "0" }),
		practice: {
			state: async () => ({ mode: "practice", community: "0" }),
			session: async () => ({ balance: "1000" }),
			donate: async () => ({ paymentId: "test" }),
			refill: async () => ({ balance: "1000" }),
		},
	});
describe("FOMO provider conformance", () =>
	runProviderTests({
		name: "FomoProvider",
		providerClass: FomoProvider,
		createProvider: create,
		playground: async () => ({
			name: "FomoProvider",
			mountPath: "/fomo",
			provider: create(),
			cleanup: async () => {},
		}),
		structure: {
			root: { name: "", children: [{ name: "real" }, { name: "practice" }] },
		},
		actionCases: [
			{
				name: "anonymous practice session",
				path: "/practice/.actions/session",
				args: { token: "a".repeat(64) },
				expected: (result, expect) => {
					expect(result.success).toBe(true);
					expect(result.data.balance).toBe("1000");
				},
			},
		],
	}));
