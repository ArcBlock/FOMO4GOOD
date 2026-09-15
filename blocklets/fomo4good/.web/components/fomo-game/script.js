(() => {
	const root = document.querySelector("[data-fomo]");
	if (!root || root.dataset.ready) return;
	const legacyPage = { "#rules": "rules", "#faq": "rules", "#teams": "teams", "#donors": "leaderboard" }[location.hash];
	if (root.dataset.view === "play" && legacyPage) {
		location.replace(`/arc/${legacyPage}${location.hash}`);
		return;
	}

	root.dataset.ready = "true";
	const $ = (key) => root.querySelector(`[data-${key}]`);
	const esc = (value) =>
		String(value ?? "").replace(
			/[&<>"']/g,
			(c) =>
				({
					"&": "&amp;",
					"<": "&lt;",
					">": "&gt;",
					'"': "&quot;",
					"'": "&#39;",
				})[c],
		);
	const short = (value) =>
		value ? `${value.slice(0, 6)}…${value.slice(-4)}` : "Anonymous";
	const money = (value) => {
		const [a, b = ""] = String(value || "0").split(".");
		return `${a.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}.${b.padEnd(2, "0").slice(0, 2)}`;
	};
	let state = null,
		pending = null,
		busy = false,
		syncing = false,
		lastSync = 0,
		offset = 0,
		board = "all";
	const key = "fomo4good.intent.v2";
	try {
		const id = localStorage.getItem(key);
		if (/^[a-f0-9-]{36}$/.test(id || "")) pending = { id };
	} catch {}
	const save = (i) => {
		pending = i;
		try {
			if (i) localStorage.setItem(key, i.id);
			else localStorage.removeItem(key);
		} catch {}
	};
	async function api(path, input) {
		const response = await fetch(`/api/fomo/${path}`, {
			...(input
				? {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(input),
					}
				: { cache: "no-store" }),
			signal: AbortSignal.timeout(12000),
		});
		const data = await response.json();
		if (!response.ok) throw new Error(data.error || "Please try again.");
		return data;
	}
	const team = (id) => state?.teams.find((t) => t.id === id);
	const donor = (d) =>
		d.url
			? `<a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer nofollow ugc">${esc(d.name || short(d.address || d.from))} ↗</a>`
			: esc(d.name || short(d.address || d.from));
	function feedback(text) {
		$("feedback").textContent = text;
	}
	function boardRows(rows, rogue = false) {
		return rows
			.map(
				(d, i) =>
					`<div class="f-board-row"><span>${String(i + 1).padStart(2, "0")}</span><div><strong>${rogue ? esc(short(d.address)) : donor(d)}</strong><small>${d.count} donation${d.count === 1 ? "" : "s"}</small></div><b title="${esc(d.amount)} USDC">${money(d.amount)}<small>USDC</small></b></div>`,
			)
			.join("");
	}
	function renderBoard() {
		if (!state) return;
		const rows = board === "round" ? state.roundDonors : state.topDonors;
		$("leaderboard").innerHTML = rows.length
			? boardRows(rows)
			: '<p class="f-empty"><strong>01 &nbsp; literally nobody</strong><br>Congratulations nobody, you’re winning.</p>';
	}
	function tick() {
		if (!state) return;
		const now = Date.now() + offset,
			r = state.round,
			remaining = r ? Math.max(0, Math.ceil((r.endsAt - now) / 1000)) : 600;
		$("timer").innerHTML =
			`${String(Math.floor(remaining / 60)).padStart(2, "0")}<span>:</span>${String(remaining % 60).padStart(2, "0")}`;
		$("progress").style.width = `${Math.min(100, remaining / 6)}%`;
		root.classList.toggle("warning", !!r && remaining <= 60);
		root.classList.toggle("fomo-mode", !!r && remaining <= 30);
		root.classList.toggle("urgent", !!r && remaining > 0 && remaining <= 10);
		$("timer-label").textContent = state.campaign.ended
			? "CAMPAIGN ENDED"
			: !r
				? "INSERT GOOD DEED TO START"
				: remaining === 0
					? "CONFIRMING THE FINAL CHAIN HISTORY…"
					: remaining <= 30
						? "FOMO MODE: GENEROSITY INTENSIFIES"
						: remaining <= 60
							? "ONE MINUTE. NO PRESSURE."
							: "TIME UNTIL SOMEONE GETS NOTHING";
		const stale = Date.now() - lastSync > 15000 || state.watcher.stale;
		$("live-round").textContent = $("round-label").textContent;
		$("live-timer").textContent = $("timer").textContent;
		$("live-pool").textContent = `${money(r?.amount || "0")} USDC`;
		$("live-status").textContent = stale ? "Connection delayed" : state.campaign.ended ? "Campaign ended" : !r ? "Waiting for first donation" : remaining === 0 ? "Confirming result…" : `${team(r.team)?.team || "Charity"} leads`;

		$("submit").disabled =
			busy ||
			stale ||
			state.campaign.ended ||
			!$("form").querySelector('input[name="team"]:checked');
		if (stale) {
			$("notice").textContent =
				"CONNECTION / WATCHER DELAY · Confirmations paused. Reconnecting…";
			$("notice").classList.add("error");
		}
		if (pending?.expiresAt && !pending.payment) {
			const seconds = Math.max(0, Math.ceil((pending.expiresAt - now) / 1000));
			$("expiry").textContent = seconds
				? `Amount expires in ${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`
				: "Amount expired. Do not send this payment. Late arrivals become Rogue Donations.";
			$("simulate").disabled = busy || seconds === 0;
		}
	}
	function render() {
		$("notice").classList.remove("error");
		$("notice").textContent =
			state.mode === "preview"
				? "LOCAL PREVIEW · SIMULATED USDC · NO REAL DONATIONS"
				: "CIRCLE ARC TESTNET · TEST USDC ONLY · NO REAL DONATIONS";
		$("sim-label").textContent =
			state.mode === "preview" ? "SIMULATED" : "TEST USDC";
		$("round-label").textContent =
			`ROUND ${String(state.round?.id || (state.history[0]?.id || 0) + 1).padStart(3, "0")}`;
		$("round-status").textContent = state.campaign.ended
			? "CAMPAIGN ENDED"
			: state.round
				? "ROUND IS LIVE"
				: "WAITING FOR FIRST DONATION";
		$("pot").textContent = money(state.round?.amount || "0");
		$("pot").title = (state.round?.amount || "0") + " USDC";
		$("community").innerHTML = `${money(state.community)} <small>USDC</small>`;
		$("leading").textContent = state.round
			? `${team(state.round.team)?.name} gets the pool.`
			: "Literally nobody wins. Yet.";
		$("last-donor").textContent = state.round
			? `Put in the lead by ${state.round.lastDonor.name || short(state.round.lastDonor.address)}`
			: "The first donor starts the round.";
		if (!$("choices").children.length)
			$("choices").innerHTML = state.teams
				.map(
					(t) =>
						`<label class="f-choice" title="${esc(t.name)}"><input type="radio" name="team" value="${esc(t.id)}" required aria-label="${esc(t.team)}: ${esc(t.name)}"><span aria-hidden="true">${t.emoji}</span><b>${esc(t.team)}</b></label>`,
				)
				.join("");
		renderBoard();
		$("activity").innerHTML = state.recent.length
			? state.recent
					.map(
						(d) =>
							`<div class="f-board-row"><span>↗</span><div><strong>${d.rogue ? esc(short(d.from)) : donor(d)}</strong><small>${d.rogue ? "ROGUE → KIDS" : esc(team(d.team)?.team)} · ${d.txHash ? `<a target="_blank" rel="noopener" href="${state.payment.explorer}/tx/${esc(d.txHash)}">TX ↗</a>` : "SIMULATED"}</small></div><b title="${esc(d.amount)} USDC">+${money(d.amount)}<small>USDC</small></b></div>`,
					)
					.join("")
			: '<p class="f-empty">No donations yet.<br>The charities are fine. Our ego is not.</p>';
		$("teams").innerHTML = state.teams
			.map(
				(t) =>
					`<article class="f-team-card"><span class="emoji" aria-hidden="true">${t.emoji}</span><h3>${esc(t.team)}</h3><a href="${esc(t.url)}" target="_blank" rel="noopener">${esc(t.name)} ↗</a><p>${esc(t.tagline)}</p><strong>${money(t.allocated)} USDC</strong><small>${t.wins} round wins · allocated</small><small>ArcBlock shortfall: $${money(t.topUp)}</small></article>`,
			)
			.join("");
		$("rogues").innerHTML = state.rogueDonors.length
			? boardRows(state.rogueDonors, true)
			: '<p class="f-empty">No rogue donors yet.<br>Even chaos is taking a coffee break.</p>';
		$("history").innerHTML = state.history.length
			? state.history
					.map(
						(r) =>
							`<div class="f-board-row"><span>#${r.id}</span><div><strong>${esc(team(r.team)?.name)}</strong><small>${state.mode === "preview" ? "PREVIEW ALLOCATION" : "TESTNET ALLOCATION"} · ${esc(r.lastDonor.name || short(r.lastDonor.address))}</small></div><b>${money(r.amount)}<small>USDC</small></b></div>`,
					)
					.join("")
			: '<p class="f-empty">No completed rounds.<br>We refuse to celebrate an empty pot.</p>';
		const m = state.metrics;
		$("research").innerHTML =
			`<dl><div><dt>PAGE SESSIONS</dt><dd>${m.visits}</dd></div><div><dt>PAYMENT INTENTS</dt><dd>${m.intents}</dd></div><div><dt>DONOR ADDRESSES</dt><dd>${m.donors}</dd></div><div><dt>INTENT → PAID</dt><dd>${m.intentConversion}%</dd></div><div><dt>MEDIAN DONATION</dt><dd>${money(m.median)} USDC</dd></div><div><dt>LAST-MINUTE MOVES</dt><dd>${m.lastMinuteMoves}</dd></div></dl>`;
		$("finding").textContent =
			m.rogueTransfers > m.paidIntents
				? "Finding: Documentation remains ineffective."
				: m.intents > 0 && m.paidIntents === 0
					? "Finding: Wallet Separation Anxiety detected."
					: m.donors === 0
						? "Hypothesis: removing personal profit may have had an effect. More research needed."
						: m.donors < 5
							? "We may have overestimated FOMO. More research needed."
							: "We have a leaderboard now. Please remain calm.";
		$("taunt").textContent =
			m.donors === 0
				? "Human generosity is currently experiencing low liquidity."
				: "Someone else is exit giving. You should probably stop them.";
		$("campaign-final").hidden = !state.campaign.ended;
		if (state.campaign.ended) {
			$("campaign-final").innerHTML =
				`<p class="f-eyebrow">${state.mode.toUpperCase()} CAMPAIGN</p><h2>FOMO4GOOD IS OVER.</h2><p>${m.donors} donor addresses · ${money(state.community)} USDC from the community.</p><p>${state.round || state.watcher.stale ? "Final chain reconciliation is still in progress." : "Allocations recorded. See the report and charity receipts."}</p><strong>Nobody got rich. Could’ve been worse.</strong><p>${state.receipts.length ? state.receipts.map((r) => `<a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(team(r.team)?.team)} receipt ↗</a>`).join(" · ") : "Charity receipts: not yet recorded."}</p>`;
		}
		tick();
	}
	function payment(i) {
		$("form").hidden = true;
		$("payment").hidden = false;
		$("exact").textContent = `${i.amount} USDC`;
		$("network").textContent =
			state.mode === "preview"
				? "LOCAL SIMULATION — DO NOT SEND FUNDS"
				: `ONLY ${state.payment.networkName.toUpperCase()} · CHAIN ${state.payment.chainId}`;
		$("address").value =
			state.mode === "preview"
				? "PREVIEW — NO RECEIVING ADDRESS"
				: state.payment.recipient;
		$("copy-address").disabled = state.mode === "preview";
		$("simulate").hidden = state.mode !== "preview" || !!i.payment;
		$("payment-status").textContent = i.payment
			? `CONFIRMED · ${i.payment.rogue ? "Rogue Donation → KIDS" : team(i.team)?.team + " takes the lead"} · Powered by ARC`
			: "Waiting for a matching transfer…";
		if (i.payment) {
			$("expiry").textContent =
				"Receipt saved. The server keeps this record even if you close your browser.";
			$("back").textContent = "← Donate again";
		} else $("back").textContent = "← Back";
		tick();
	}
	async function sync() {
		if (syncing) return;
		syncing = true;
		try {
			const start = Date.now();
			state = await api("state");
			offset = state.now - (start + Date.now()) / 2;
			lastSync = Date.now();
			render();
			if (pending) {
				try {
					const i = await api(`intents/${pending.id}`);
					save(i);
					if (!$("payment").hidden || !$("exact").textContent) payment(i);
				} catch (e) {
					$("payment-status").textContent = e.message;
				}
			}
		} catch (e) {
			$("notice").textContent = "CAN’T REACH THE CAMPAIGN · Reconnecting…";
			$("notice").classList.add("error");
		} finally {
			syncing = false;
			tick();
		}
	}
	$("form").addEventListener("submit", async (e) => {
		e.preventDefault();
		if (busy) return;
		busy = true;
		tick();
		feedback("Generating your very specific good deed…");
		try {
			const form = new FormData($("form"));
			const i = await api("intents", Object.fromEntries(form));
			save(i);
			feedback("");
			payment(i);
		} catch (e) {
			feedback(e.message);
		} finally {
			busy = false;
			tick();
		}
	});
	$("choices").addEventListener("change", tick);
	root.querySelectorAll("[data-amount]").forEach((button) =>
		button.addEventListener("click", () => {
			$("form").elements.amount.value = button.dataset.amount;
			root
				.querySelectorAll("[data-amount]")
				.forEach((b) => b.classList.toggle("selected", b === button));
		}),
	);
	$("form").elements.amount.addEventListener("input", () =>
		root
			.querySelectorAll("[data-amount]")
			.forEach((b) =>
				b.classList.toggle(
					"selected",
					b.dataset.amount === $("form").elements.amount.value,
				),
			),
	);
	$("ranking").addEventListener("change", (e) => {
		board = e.target.value;
		renderBoard();
	});
	$("back").addEventListener("click", () => {
		$("payment").hidden = true;
		$("form").hidden = false;
		if (pending?.payment) save(null);
	});
	async function copy(text, button) {
		try {
			await navigator.clipboard.writeText(text);
			const label = button.textContent;
			button.textContent = "COPIED ✓";
			setTimeout(() => (button.textContent = label), 1500);
		} catch {
			$("payment-status").textContent =
				"Clipboard unavailable. Select and copy the value manually.";
		}
	}
	$("copy-amount").addEventListener("click", () =>
		copy(pending.amount, $("copy-amount")),
	);
	$("copy-address").addEventListener("click", () =>
		copy(state.payment.recipient, $("copy-address")),
	);
	$("simulate").addEventListener("click", async () => {
		if (busy) return;
		busy = true;
		tick();
		try {
			await api("preview-confirm", { intentId: pending.id });
			await sync();
		} catch (e) {
			$("payment-status").textContent = e.message;
		} finally {
			busy = false;
			tick();
		}
	});
	try {
		if (!sessionStorage.getItem("fomo4good.visited")) {
			api("visit", {})
				.then(() => sessionStorage.setItem("fomo4good.visited", "1"))
				.catch(() => {});
		}
	} catch {}
	sync();
	setInterval(sync, 3000);
	setInterval(tick, 250);
	try {
		if (sessionStorage.getItem("fomo4good.booted")) $("boot")?.remove();
		else sessionStorage.setItem("fomo4good.booted", "1");
	} catch {}
	setTimeout(() => $("boot")?.remove(), 1700);
})();
