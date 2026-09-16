export const UNIT = 10n ** 18n;
export const units = (value) => {
	if (!/^\d{1,6}(\.\d{1,2})?$/.test(String(value)))
		throw new Error(
			"Use a donation from 1 to 100,000 USDC, with at most two decimals.",
		);
	const [whole, frac = ""] = String(value).split(".");
	const n = BigInt(whole) * UNIT + BigInt(frac.padEnd(18, "0"));
	if (n < UNIT || n > 100000n * UNIT)
		throw new Error("Donation must be between 1 and 100,000 USDC.");
	return n;
};
export const amount = (value) => {
	const n = BigInt(value);
	return `${n / UNIT}.${String(n % UNIT).padStart(18, "0")}`
		.replace(/0+$/, "")
		.replace(/\.$/, "");
};
