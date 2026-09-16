**English** · [繁體中文](README.zh-Hant.md) · [🤖 AI Slop](README.ai-slop.md)

<div align="center">

# FOMO4GOOD

### The winner gets nothing. Their charity gets everything.

**A little stupid. A little good. Built on ARC.**

[Which Arc?](https://www.arcblock.io/en/which-arc/) · [Run it](#run-it) · [FUSD](#fusd)

<img src="blocklets/fomo4good/content/media/launch-pixel.jpg" alt="FOMO4GOOD original pixel artwork: a hooded builder, a sleeping cat, and an unnecessarily elaborate plan to do good" width="840">

*Original launch artwork. The cat has not reviewed the code.*

</div>

> **Current build: Practice is playable. Real donations are not open.**<br>
> No active receiving address. No real funds have been collected by this implementation. The dramatic poster is not a deployment status page.

## Financially terrible. Potentially useful.

We took the countdown anxiety of FOMO3D and removed the part where you get rich. An aggressive product decision. Better for charity. Devastating for the “wen Lambo” department.

1. **Pick a charity team.** Send the exact USDC amount when the real campaign opens.
2. **Take the lead. Reset the clock to 10:00.** Not ten more minutes. Ten minutes. Reading comprehension is part of the game.
3. **Be the last donor when the clock runs out.** Your chosen charity gets that round’s pool. Your personal payout is an extremely consistent **$0**.

The first matched donation starts a round. An empty pool does not award itself a participation trophy. Charity allocations are recorded during play; actual donations are made after the campaign.

## Built on ARC. Paid on Arc.

|  | What it does |
| --- | --- |
| **[ARC by ArcBlock](https://www.arcblock.io/en/arc/)** | Blocklet/AUP interface and DID Space storage. |
| **[Arc by Circle](https://arc.io/)** | The USDC payment network for the real campaign. |
| **FOMO4GOOD** | Makes this naming situation everybody’s problem. |

**[Confused? Working as intended.](https://www.arcblock.io/en/which-arc/)**

“How deeply are you integrated with Arc?”<br>
“We accept USDC on it.”<br>
“That’s all?”<br>
“That’s all. It’s money.”

## Five teams. Zero bad guys.

| Team | Charity | Scientific justification |
| --- | --- | --- |
| 👶 KIDS | [Save the Children](https://www.savethechildren.org/) | They’re the future. Allegedly. |
| 🐶 DOGS | [Best Friends Animal Society](https://bestfriends.org/) | Objectively good boys. |
| 🌳 TREES | [Rainforest Trust](https://www.rainforesttrust.org/) | Still doing carbon capture for free. |
| 💧 WATER | [charity: water](https://www.charitywater.org/) | Surprisingly important. |
| 🛡️ INTERNET | [Electronic Frontier Foundation](https://www.eff.org/) | Worth saving. Probably. |

**For the real campaign, ArcBlock guarantees at least $100 per charity**, covering any shortfall after community allocations. Top-ups never buy leaderboard positions. If nobody plays, the charities still get $500 collectively. Our ego gets a learning opportunity.

**ArcBlock will complete campaign charity donations after the campaign ends and before December 31, 2026, and publish receipts.** An allocation is not a receipt. “The agent said it sent the money” is also not a receipt.

## FUSD

### PRACTICE ROUND

**Same FOMO. Fake money. Nobody gets hurt.**

Permanent Practice lives at `/practice`. A browser identity starts with **1,000 FUSD**. Pick a team, spend imaginary money, reset the same ten-minute clock. Below 1 FUSD, print another 1,000 for free. Finally, a monetary policy that fits in one button.

| FUSD — Fake United States Dollar | Audited by absolutely nobody |
| --- | --- |
| Issuer | FOMO4GOOD. Highly centralized. |
| Supply | Unlimited issuance. |
| Backing | None. |
| Reserves | Also none. |
| Value | **$0.00** |
| Stability | Remarkably stable at zero. |
| Charity payout | **Exactly none of this.** |

**FUSD is not a cryptocurrency. We didn’t have time to make one.**

It is offchain practice points in a separate DID Space: no contract, wallet asset, exchange listing, withdrawal or cash value. Practice balances, pools, rankings and wins **never** enter real fundraising totals or charity allocations. The real campaign’s guarantee and donation deadline do not apply to FUSD.

Win a practice round and we ask: **“Want to try with $1 that actually exists?”** Until real collection opens, that link says so. We are willing to hallucinate currency, not a live payment system.

## Frequently avoided questions

**Who coded this?**<br>
AI agents, all the way down. Humans directed the work and supplied the questionable ideas. If you find a bug, congratulations: you have discovered software.

**So bugs are a feature?**<br>
No. We fix bugs. We do not ask you to believe harder. Tests pass; omniscience remains out of scope.

**Why 10.004237 USDC?**<br>
The weird decimals identify a real payment intent. The extra fraction is less than a cent and is donated too. Old-school? Yes. Effective? Also yes. Keep the amount private; send exactly once before it expires. Practice FUSD does not need this ritual.

**I sent 5,000 directly. Why didn’t I win?**<br>
Because you donated. You didn’t play. Direct, expired or unmatched USDC on the watched Circle Arc network becomes a Rogue Donation for KIDS, on its own address-only board. It does not reset the clock.

**Can I send from another chain?**<br>
Other networks and tokens are outside this campaign and its guarantee. Recovery, refund and donation are not promised. “But it also says Arc” is not a bridging protocol.

**What should I trust?**<br>
Check Arc transfer records and ArcBlock’s actual donation receipts. The UI can glitch. The jokes can fail. Neither turns a missing receipt into a donation.

**What does ArcBlock get?**<br>
Hopefully, your attention. This README is already longer than our business model.

## Run it

Requires **Node.js 22.13+** and a **built ARC checkout** at sibling `../arc`, or configured `ARC_HOME`. The CLI and DID Space SDK resolve from that checkout. This repository does not contain the ARC runtime.

```sh
npm ci
npm test
npm run check
npm run dev
```

| Local page | Purpose |
| --- | --- |
| `http://fomo4good.localhost:4930/` | Real campaign entry; collection currently closed. |
| `http://fomo4good.localhost:4930/practice/` | Permanent FUSD Practice Round. |
| `/teams`, `/leaderboard`, `/rules` | Teams, records, rules and FAQ. |
| `/practice/teams`, `/practice/leaderboard`, `/practice/rules` | Their very imaginary counterparts. |

Every page keeps a live countdown and participation link. Languages: **English**, **Traditional Chinese** (deliberately), and **🤖 AI Slop**. Your language choice follows you between pages. Translating FUSD does not turn it into real money.

`npm run dev` serves the Blocklet from a dedicated ARC instance on **4930**; the pages are ARC web pages, nothing sits in front of them. Without the campaign service (`npm start`, still a separate process today) every page renders in its "not open yet" state. Stop the instance when finished:

```sh
node ../arc/runtimes/node/dist/cli.mjs service stop --instance fomo4good-local
```

Publishing is one command against an ARC host — the Blocklet lands in your DID Space and answers at `https://fomo4good.<host domain>/`:

```sh
arc deploy blocklets/fomo4good --server https://<arc-host> --token <deploy-token>
```

## Under the hoodie

- **ARC Blocklet + AUP** renders the interface. A **companion Node service** runs campaign APIs and the chain watcher. Two services today; the Blocklet artifact alone contains the UI.
- **DID Space is the only application persistence**, through the official ARC SDK and AFS. No application SQLite driver or fallback database. SDK-internal indexing belongs to the SDK.
- Real and practice data have **separate roots and instance DIDs**. Balance deductions and round updates use version-checked writes; retries cannot spend the same practice request twice.
- Real payment handling keeps full integer precision and deduplicates chain events. No private keys, wallet signatures or automated charity payouts.

**Current network support is testnet verification only.** Mainnet profile, recipient, campaign dates and onchain acceptance still need to be configured and verified before real collection can open. This is an organizer-run experiment, not smart-contract escrow.

[Development details](docs/development.md) · [Operations & reconciliation](docs/operations.md) · [Launch decisions](docs/launch-mvp.md) · [Joke provenance](docs/copy-map.md)

## Proof of work, unfortunately literal

```sh
npm test        # 14 tests: persistence, money, isolation, retries, languages, client flows
npm run check   # ARC lint, validate, blocklet check, build
npm run smoke   # Running local app required; creates one explicitly named FUSD-only play
```

`smoke` checks page routes, public boundaries, session balances and real/practice isolation. It refuses to run when real collection is active. Browser checks also covered the FUSD flow. Statistical significance of our jokes: still absolutely none.

<div align="center">

<a href="https://github.com/ArcBlock/FOMO4GOOD"><img src="blocklets/fomo4good/content/media/git-oops.svg" alt="Git Oops: an original cross-eyed pixel coding cat" width="112"></a>

### GIT OOPS™

*Open source. Questionable judgment. Zero personal payout.*

</div>

## License & grown-up words

Code is [MIT licensed](LICENSE). The supplied launch artwork has separate rights and is not automatically covered by the code license. VT323 ships with its [OFL license](blocklets/fomo4good/content/media/VT323-LICENSE.txt). Git Oops is this project’s original parody mascot, not GitHub’s official logo.

Independent experiment by ArcBlock; no affiliation with Circle, the featured charities, or FOMO3D’s creators. Donations are not investments and offer no financial return. Practice offers the same return with significantly less paperwork.

[Cloudflare deployment](docs/cloudflare.md) — Worker topology, setup and current verification boundaries.
