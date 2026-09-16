// Test-only ARC host face: uses the existing service-binding transport.
import { ServiceBindingProxy } from "@aigne/afs-session";
export default {
	async fetch(request, env) {
		const { path, args } = await request.json();
		const method = new URL(request.url).pathname.slice(5);
		if (!["read", "exec", "list", "stat"].includes(method))
			return new Response("Not found", { status: 404 });
		const proxy = new ServiceBindingProxy(
			"fomo4good",
			env.FOMO_PROVIDER,
			"test-host",
		);
		return Response.json(await proxy[method](path, args));
	},
};
