# FOMO4GOOD

The winner gets nothing. Their charity gets everything.

A finite FOMO3D-inspired charity campaign. Built on ARC. Paid on Circle Arc. The launch scope and original discussion decisions are recorded in [docs/launch-mvp.md](launch-mvp.md).

## Run on Prosper Mac mini

Work in `~/work/arcblock/FOMO4GOOD`. Requires Node 22.13+ and the built sibling `../arc` checkout (or set `ARC_HOME`).

```sh
npm ci
npm test
npm run check
npm run dev
```

Open **http://fomo4good.localhost:4930/** for the real campaign entry, which currently says real donations are not open. **http://fomo4good.localhost:4930/practice/** is the permanent Practice Round: each browser identity starts with 1,000 FUSD, selects a team and spends points instantly. No wallet, payment intent, chain transaction or real donation is involved. The former public preview-confirm API is retired; old preview data is retained separately and never presented as real fundraising.

The Blocklet is served by the dedicated `fomo4good-local` ARC instance on port 4930 — the pages are ARC web-device pages, so nothing sits in front of them. The campaign service (`npm start`, loopback 4931) is a separate process; when it is not running, the pages detect the missing `/api/*` and render their "not open yet" state instead of an outage. Stop the ARC instance with `node ../arc/runtimes/node/dist/cli.mjs service stop --instance fomo4good-local` when it is no longer needed. No desktop automation is used by these scripts.

To publish, point `arc deploy` at an ARC host: `arc deploy blocklets/fomo4good --server https://<arc-host> --token <deploy-token>`. The Blocklet is published to your DID Space and resolves by its id (`fomo4good.<host domain>`); pre-rendering runs as part of the deploy. Use the **released** CLI (`install.sh`) with `ARC_AUP_ASSETS_CDN=https://aup.arcblock.io`: the pre-rendered pages reference ARC's shell assets by build hash, and only released builds are on the CDN. CI does exactly this — `.github/workflows/deploy-blocklet-staging.yml` deploys every push to `main` that touches the Blocklet (staging: https://fomo4good.afsd.io/), purges the HTML edge cache (`arc deploy` does not) and smokes the eight pages; `deploy-blocklet-production.yml` is the manual production twin.

## Pages

- `/`: pool, countdown and donation flow.
- `/teams`: charities, allocations and the ArcBlock guarantee.
- `/leaderboard`: donors, recent activity, Rogue Donors, round history and research jokes.
- `/rules`: game rules, all FAQs, upgrade notes and campaign terms.

Practice has parallel `/practice`, `/practice/teams`, `/practice/leaderboard` and `/practice/rules` pages, with a purple theme, FUSD labels and an explicit zero real-charity payout.

Every page keeps a sticky live round strip with countdown, pool and a link to participate. Old home-page anchors redirect to their new pages. Body copy is enlarged, with pixel typography reserved for display headings and key numbers.

## Permanent Practice Round

FUSD means **Fake United States Dollar**: non-transferable offchain practice points, not a token or wallet asset. Practice has its own DID Space root (`var/practice/spaces`, configurable with `FOMO_PRACTICE_SPACE_ROOT`), owner and instance DID. It has no campaign end date and survives the real campaign's end. The root cannot equal the real ledger root. Legacy preview payments are not imported.

An HttpOnly, SameSite cookie identifies a browser; only its hash is stored in the private ledger. Initial issuance is 1,000 FUSD. Below 1 FUSD, players may request another free 1,000. Balance deductions, plays and round changes commit atomically using AFS CAS. Client request IDs make retries idempotent. New browser identities can get new points; FUSD has no monetary value or identity-verification claim.

Practice uses the same ten-minute reset rule. Its closed rounds award imaginary pools only, with zero real charity payout or top-up. All practice stats and leaderboards are separate. The real dashboard never incorporates FUSD. A completed round offers a link to try 1 real USDC; until real collection is configured, that link explains that real donations are not open.

## Languages

The header offers English, Traditional Chinese (`zh-Hant`, deliberately no Simplified Chinese option), and **AI Slop**, an English novelty voice. Chinese browser locales default to Traditional Chinese. `?lang=zh-Hant` and `?lang=en-x-slop` make links shareable; the selector remembers preferences locally and carries the language across campaign pages.

All FAQ entries and authored payment/status copy have Traditional Chinese translations. Charity names, wallet addresses, exact amounts, transaction IDs, and donor-supplied names/URLs stay unchanged. AI Slop changes the jokes while retaining plain payment instructions. Language switching preserves selected teams, form values and pending receipts. The supplied artwork stays in its original form.

## Architecture

- `blocklets/fomo4good`: real Blocklet, following ArcBlock-site's web-device structure. ARC renders HTML/CSS/JS and serves media. One `fomo-game` component renders every page; `pages/*/layout.aup` passes `view` / `mode`, and the charity teams are the `content/teams` collection bound as `$source.teams` (the practice sub-pages are records of the `content/practice` collection so they share that binding). The page ships the teams as JSON, which is what the client renders when no campaign service answers.
- `server/`: small Node campaign service: anonymous payment intents, Circle Arc watcher, public state projection. This is an explicit companion service, **not** a native ARC exec provider. The current deployment therefore needs both services; the blocklet artifact alone is the UI.
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

The current verified network profile is Circle Arc **testnet**. The watcher remains available for internal integration testing; public real-payment endpoints stay closed in both preview and testnet configurations. Real-fund mode is deliberately unavailable until a mainnet profile, recipient, campaign dates and complete onchain acceptance test are verified. See [docs/operations.md](operations.md). No real transactions have been performed.

## Validation

`npm test` uses the real local DID Space SDK in disposable temporary scopes and mock RPC fixtures. `npm run check` runs ARC lint, DSL validation, blocklet check and build. `npm run smoke` checks a running app over HTTP, including all eight page routes, assets, practice sessions, balance deductions, retry deduplication and public-route boundaries. It creates a clearly named FUSD-only play and refuses to run when real collection is active.

The original supplied pixel artwork is preserved at `blocklets/fomo4good/content/media/launch-pixel.jpg`. Palette and CRT styling derive from that reference. It is user-supplied artwork; its rights are separate from the source code's MIT license.

## Current verification

Twelve tests cover DID Space persistence, concurrent writes, expiry/deduplication, campaign end, native USDC event decoding, watcher recovery, financial reconciliation, language switching, practice isolation and client payment/practice flows. HTTP smoke checks the running ARC-rendered app. In-app browser checks cover the real/practice split, FUSD balance deduction, practice leaderboard and rules; no native desktop automation is required.
