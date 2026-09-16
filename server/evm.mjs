// Consumer adapter: every chain read goes through ARC's EVM provider.
export function chainRpc(afs, path = "/dev/chain/arc") {
	return async (method, params) => {
		const response = await afs.exec(`${path}/.actions/rpc`, { method, params });
		if (!response.success) throw new Error("EVM provider rejected request");
		return response.data.result;
	};
}
