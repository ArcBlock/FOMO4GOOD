# FOMO4GOOD

The winner gets nothing. Their charity gets everything.

A finite FOMO3D-inspired charity campaign. Built on ARC. Configured for USDC on Arc Network. The launch scope and original discussion decisions are recorded in [docs/launch-mvp.md](launch-mvp.md).

## Run on Prosper Mac mini

Work in `~/work/arcblock/FOMO4GOOD`. Requires Node 22.13+ and the built sibling `../arc` checkout (or set `ARC_HOME`).

```sh
npm ci
npm test
npm run check
npm run dev
```

Open **http://fomo4good.localhost:4930/arc/** for the real campaign entry, which currently says real donations are not open. **http://fomo4good.localhost:4930/arc/practice/** is the permanent Practice Round: each browser identity starts with 1,000 FUSD, selects a team and spends points instantly. No wallet, payment intent, chain transaction or real donation is involved. The former public preview-confirm API is retired; old preview data is retained separately and never presented as real fundraising.

The Blocklet is served by the dedicated `fomo4good-local` ARC instance on port 4930 — the pages are ARC web-device pages, so nothing sits in front of them. The campaign service (`npm start`, loopback 4931) is a separate process; when it is not running, the pages detect the missing `/arc/api/*` and render their "not open yet" state instead of an outage. Stop the ARC instance with `node ../arc/runtimes/node/dist/cli.mjs service stop --instance fomo4good-local` when it is no longer needed. No desktop automation is used by these scripts.

To publish, point `arc deploy` at an ARC host: `arc deploy blocklets/fomo4good --server https://<arc-host> --token <deploy-token>`. The Blocklet is published to your DID Space and resolves by its id (`fomo4good.<host domain>`); pre-rendering runs as part of the deploy. Use the **released** CLI (`install.sh`) with `ARC_AUP_ASSETS_CDN=https://aup.arcblock.io`: the pre-rendered pages reference ARC's shell assets by build hash, and only released builds are on the CDN. CI does exactly this — `.github/workflows/deploy-blocklet-staging.yml` deploys every push to `main` that touches the Blocklet (staging: https://fomo4good.afsd.io/), purges the HTML edge cache (`arc deploy` does not) and smokes the eight pages; `deploy-blocklet-production.yml` is the manual production twin.

## Local Worker + Provider practice

```sh
ARC_HOME=../arc npm run dev:worker
```

Open **http://localhost:4932/arc/practice/?lang=zh-Hant**. This runs the real gateway and private provider bundles in Miniflare/workerd, with a campaign Durable Object and the official Cloudflare DID Space SDK. A local loopback router sends `/arc/api/*` to workerd and pages/assets to the existing ARC instance on 4930; it does not render or rewrite HTML. Cloud deployment still uses separate edge routes.

Storage survives process restarts in `var/workers/`. The fixed development DIDs are local-only; cloud deployment still requires its own owner DID. `FOMO_WORKER_PORT` changes the public local port (default 4932); `ARC_PORT` changes the ARC page port. Stop with Ctrl-C; the ARC page instance is kept running.

Use different browser profiles, different browsers, or a normal window plus a private window for different players. Two ordinary tabs share the same cookie and balance. All players share one round deadline. An accepted play sets that deadline to server time plus ten minutes; opening a session, reloading, refilling, or retrying the same request does not reset it. The UI polls every three seconds, so another player's reset appears on the next poll. A Durable Object alarm settles expiry even with no browser open. Restarting preserves the deadline rather than starting a fresh ten minutes.

## Pages

- `/`: pool, countdown and donation flow.
- `/arc/teams`: charities, allocations and the ArcBlock guarantee.
- `/arc/leaderboard`: donors, recent activity, Rogue Donors, round history and research jokes.
- `/arc/rules`: game rules, all FAQs, upgrade notes and campaign terms.

Practice has parallel `/arc/practice`, `/arc/practice/teams`, `/arc/practice/leaderboard` and `/arc/practice/rules` pages, with a purple theme, FUSD labels and an explicit zero real-charity payout.

Every page keeps a sticky live round strip with countdown, pool and a link to participate. Old home-page anchors redirect to their new pages. Body copy is enlarged, with pixel typography reserved for display headings and key numbers.

## Permanent Practice Round

FUSD means **Fake United States Dollar**: non-transferable offchain practice points, not a token or wallet asset. Practice has its own DID Space root (`var/practice/spaces`, configurable with `FOMO_PRACTICE_SPACE_ROOT`), owner and instance DID. It has no campaign end date and survives the real campaign's end. The root cannot equal the real ledger root. Legacy preview payments are not imported.

An HttpOnly, SameSite cookie identifies a browser; only its hash is stored in the private ledger. Initial issuance is 1,000 FUSD. Below 1 FUSD, players may request another free 1,000. Balance deductions, plays and round changes commit atomically using AFS CAS. Client request IDs make retries idempotent. New browser identities can get new points; FUSD has no monetary value or identity-verification claim.

Practice uses the same ten-minute reset rule. Its closed rounds award imaginary pools only, with zero real charity payout or top-up. All practice stats and leaderboards are separate. The real dashboard never incorporates FUSD. A completed round offers a link to try 1 real USDC; until real collection is configured, that link explains that real donations are not open.

## Languages

The header offers English, Traditional Chinese (`zh-Hant`, deliberately no Simplified Chinese option), and **AI Slop**, an English novelty voice. Chinese browser locales default to Traditional Chinese. `?lang=zh-Hant` and `?lang=en-x-slop` make links shareable; the selector remembers preferences locally and carries the language across campaign pages.

All FAQ entries and authored payment/status copy have Traditional Chinese translations. Charity names, wallet addresses, exact amounts, transaction IDs, and donor-supplied names/URLs stay unchanged. AI Slop changes the jokes while retaining plain payment instructions. Language switching preserves selected teams, form values and pending receipts. The supplied artwork stays in its original form.

## Architecture

- `blocklets/fomo4good`: real Blocklet, following ArcBlock-site's web-device structure. ARC renders HTML/CSS/JS and serves media. One `fomo-game` component renders every page; `pages/*/layout.aup` passes `view` / `mode`, and the charity teams are the `content/teams` collection bound as `$source.teams` (the practice sub-pages are records of the `content/arc` collection so they share that binding). The page ships the teams as JSON, which is what the client renders when no campaign service answers.
- `server/`: local Node campaign service with anonymous payment intents, the Arc Network watcher and public state projection. Cloudflare uses the game AFS provider in `providers/fomo4good/` plus private Worker and API-only gateway; see [Cloudflare deployment](cloudflare.md). The Blocklet artifact is the UI; its native pages and CI deployment stay independent of the game API.
- **DID Space is the only application persistence**: the official ARC SDK's `getInstanceSpace({role:'system'})`. All business reads/writes go through AFS. No application SQLite driver, schema, or fallback store.
- `campaign/ledger.json`: exact integer money, raw transfers, private intents, round snapshots and watcher cursor in one version-checked commit. Failed writes do not advance the watcher. Intended for one finite MVP campaign, not an unbounded transaction archive.
- SDK and CLI resolve from the built ARC checkout. No private copied persistence implementation. The DID Space implementation itself may maintain its own internal metadata index; the app does not access or depend on that index.

The campaign service exposes only the campaign/practice endpoints; pages and assets are ARC's. Serve HTTPS at the edge if making the app public; set `FOMO_ORIGIN` to that exact origin. Run **one application/watcher process per campaign instance**. The SDK's CAS also protects conflicting ledger writes, but initialization is a single-operator operation.

## Testnet watcher

Copy `.env.example` to `.env`, fill the commented testnet values, keep the ARC daemon running, then:

```sh
node --env-file=.env server/index.mjs
```

No private key is requested or used. The recipient is an operator-owned, dedicated wallet. The cursor starts at `FOMO_START_BLOCK`; set it before the first campaign deposit and after the current native-event activation. The watcher verifies chain ID 5042002 and consumes **only the 18-decimal USDC system Transfer stream**, avoiding double-counting the ERC-20 mirror. It retains sub-micro-USDC precision. Network errors, inconsistent hashes and storage failures stop cursor advancement and pause new intents once stale.

Verified network profiles: Arc **testnet** (`config/staging-campaign.json`) and Arc **mainnet** (`config/mainnet-campaign.json`, chain 5042, recipient `0x985F6a6B60a0fFeaEC463EB7D912502e539F06eA`). Public real-payment endpoints stay closed by default. Local loopback collection can be opened with `FOMO_MODE=testnet` or `mainnet`, `HOST=127.0.0.1`, and `FOMO_ACCEPT_REAL=1` on the companion Node service; browse `http://localhost:4931/arc/` (not the ARC page port). Staging Workers use the testnet flag; production Workers stay on practice and refuse `FOMO_ACCEPT_REAL`. See [docs/operations.md](operations.md).

## Validation

`npm test` uses the real local DID Space SDK in disposable temporary scopes and mock RPC fixtures. `npm run check` runs ARC lint, DSL validation, blocklet check and build. `npm run smoke` checks a running app over HTTP, including all eight page routes, assets, practice sessions, balance deductions, retry deduplication and public-route boundaries. It creates a clearly named FUSD-only play and refuses to run when real collection is active.

The original supplied pixel artwork is preserved at `blocklets/fomo4good/content/media/launch-pixel.jpg`. Palette and CRT styling derive from that reference. It is user-supplied artwork; its rights are separate from the source code's MIT license.

## Current verification

Fourteen tests cover DID Space persistence, concurrent writes, expiry/deduplication, campaign end, native USDC event decoding, watcher recovery, financial reconciliation, language switching, practice isolation and client payment/practice flows. HTTP smoke checks the running ARC-rendered app. In-app browser checks cover the real/practice split, FUSD balance deduction, practice leaderboard and rules; no native desktop automation is required.

## Rankings, profiles and local simulation

The play page shows the current round's top 10 and podium; the leaderboard page defaults to all-time top 10; each team shows its own all-time top three. Team ranks are computed from all recorded matched donations, not by filtering the overall top 10. Name and URL remain in each DID Space donation record across round closure and restart, providing the source for future credentials. No credential issuance is implemented yet. Practice stores the same fields but renders a notice button instead of an outbound donor link. Real donor links retain `nofollow ugc noopener noreferrer`.

Sharing is user-initiated: copy text, native share, X/Telegram compose links and a downloadable PNG card. Practice text/cards explicitly identify FUSD as imaginary. Shared URLs use the public site, never localhost.

Run `node scripts/simulate-practice.mjs` against the local Worker entry point to create five explicitly SIM-labelled FUSD players. It performs 15 plays, one every 20 seconds, then exits. The script is pinned to loopback and checks practice mode; it does not seed public leaderboards.

Leaderboard invitations calculate the amount needed to exceed the current tenth place (or next place for an already ranked player), rounded up to the next cent and at least 1. Practice deducts the current player's recorded contributions, including players outside the top ten. Real-campaign estimates are explicitly for a new donor address. Clicking carries a validated amount to the play form; it never submits a donation or chooses a charity. Rankings can move before submission.

## Prepared recipient

The ARC edition lives under `/arc/`, including `/arc/api/*`. The recipient `0x985F6a6B60a0fFeaEC463EB7D912502e539F06eA` is displayed with a raw-address QR and copy button while real collection remains closed. `node scripts/generate-address-qr.mjs` regenerates the SVG and inline image from the single address constant. The QR contains no chain ID or payment request. Displaying it does not configure a watcher or enable payments. Once collection opens, confirmed direct transfers without matching game orders appear on the address-only Rogue Donors board, go to KIDS, and do not affect the timer or leader.

The local Worker runner migrates the old `/api/practice` HttpOnly cookie to `/arc/api/practice` using a same-origin loopback-only endpoint, then expires the old cookie. DID Space balances and history are unchanged.

## Practice grants and house agents

A browser identity receives 1,000 FUSD initially, counting as its print for that round. Thereafter it may claim 1,000 once per round regardless of remaining balance. Claims are atomic and persisted in DID Space; balances accumulate, missed-round claims do not. Legacy identities can claim once in their current round.

The private Worker alarm runs opponents marked with a 🤖 before their names after a human play. Sixteen names rotate randomly; all robots together spend at most 8 FUSD in four moves per round, in 1–2 FUSD plays. They never print through the user faucet, restart an expired round, or participate in real USDC. They stop after 30 minutes without a human play. Their contributions count in practice totals and rankings.

Footer sound defaults on, and an explicit opt-out persists locally. Short square-wave cues distinguish amount, team, navigation, sharing and successful actions. Browser autoplay rules still delay audio until the first user interaction unlocks it. The hero and GIT OOPS SVG are embedded to work in both native live rendering and static pages.
