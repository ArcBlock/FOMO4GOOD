export async function openSpace(config) {
	const { DIDSpace } = await import(config.sdk);
	const space = new DIDSpace({
		rootPath: config.spaceRoot,
		userDid: config.ownerDid,
	});
	const afs = await space.getInstanceSpace({
		instanceDid: config.instanceDid,
		role: "system",
	});
	return { afs, close: () => space.close() };
}
