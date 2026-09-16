# FOMO4GOOD

The winner gets nothing. Their charity gets everything.

A finite FOMO3D-inspired charity campaign. Built on ARC. Paid on Circle Arc. The launch scope and original discussion decisions are recorded in [docs/launch-mvp.md](docs/launch-mvp.md).

## Run on Prosper Mac mini

Work in `~/work/arcblock/FOMO4GOOD`. Requires Node 22.13+ and the built sibling `../arc` checkout (or set `ARC_HOME`).

```sh
npm ci
npm test
npm run check
npm run dev
```

Open **http://localhost:4931/arc**. `/` redirects to `/arc`. Preview uses simulated funds and no receiving address. Select a team, enter your optional name/URL, generate an exact amount, then click **Simulate arrival**. Nothing is sent onchain.

The ARC web daemon runs as the separate `fomo4good-local` instance on port 4930. The public application binds to loopback on 4931. `Ctrl-C` stops the app; stop the named ARC instance separately with `node ../arc/runtimes/node/dist/cli.mjs service stop --instance fomo4good-local` when it is no longer needed. No desktop automation is used by these scripts.

## Pages

- `/arc`: pool, countdown and donation flow.
- `/arc/teams`: charities, allocations and the ArcBlock guarantee.
- `/arc/leaderboard`: donors, recent activity, Rogue Donors, round history and research jokes.
- `/arc/rules`: game rules, all FAQs, upgrade notes and campaign terms.

Every page keeps a sticky live round strip with countdown, pool and a link to participate. Old home-page anchors redirect to their new pages. Body copy is enlarged, with pixel typography reserved for display headings and key numbers.

## Languages

The header offers English, Traditional Chinese (`zh-Hant`, deliberately no Simplified Chinese option), and **AI Slop**, an English novelty voice. Chinese browser locales default to Traditional Chinese. `?lang=zh-Hant` and `?lang=en-x-slop` make links shareable; the selector remembers preferences locally and carries the language across campaign pages.

All FAQ entries and authored payment/status copy have Traditional Chinese translations. Charity names, wallet addresses, exact amounts, transaction IDs, and donor-supplied names/URLs stay unchanged. AI Slop changes the jokes while retaining plain payment instructions. Language switching preserves selected teams, form values and pending receipts. The supplied artwork stays in its original form.

## Architecture

- `blocklets/fomo4good`: real Blocklet + AUP page + web component, following ArcBlock-site's web-device structure. ARC renders HTML/CSS/JS and serves media.
- `server/`: small Node campaign service: anonymous payment intents, Circle Arc watcher, public state projection. This is an explicit companion service, **not** a native ARC exec provider. The current deployment therefore needs both services; the blocklet artifact alone is the UI.
- **DID Space is the only application persistence**: the official ARC SDK's `getInstanceSpace({role:'system'})`. All business reads/writes go through AFS. No application SQLite driver, schema, or fallback store.
- `campaign/ledger.json`: exact integer money, raw transfers, private intents, round snapshots and watcher cursor in one version-checked commit. Failed writes do not advance the watcher. Intended for one finite MVP campaign, not an unbounded transaction archive.
- SDK and CLI resolve from the built ARC checkout. No private copied persistence implementation. The DID Space implementation itself may maintain its own internal metadata index; the app does not access or depend on that index.

The ARC admin/RPC surface is not proxied publicly. Only campaign endpoints, `/arc` and the web assets are exposed. Serve HTTPS at the edge if making the app public; set `FOMO_ORIGIN` to that exact origin. Run **one application/watcher process per campaign instance**. The SDK's CAS also protects conflicting ledger writes, but initialization is a single-operator operation.

## Testnet watcher

Copy `.env.example` to `.env`, fill the commented testnet values, keep the ARC daemon running, then:

```sh
node --env-file=.env server/index.mjs
```

No private key is requested or used. The recipient is an operator-owned, dedicated wallet. The cursor starts at `FOMO_START_BLOCK`; set it before the first campaign deposit and after the current native-event activation. The watcher verifies chain ID 5042002 and consumes **only the 18-decimal USDC system Transfer stream**, avoiding double-counting the ERC-20 mirror. It retains sub-micro-USDC precision. Network errors, inconsistent hashes and storage failures stop cursor advancement and pause new intents once stale.

The current verified network profile is Circle Arc **testnet**. Real-fund mode is deliberately unavailable until a mainnet profile, recipient, campaign dates and complete onchain acceptance test are verified. See [docs/operations.md](docs/operations.md). No real transactions have been performed.

## Validation

`npm test` uses the real local DID Space SDK in disposable temporary scopes and mock RPC fixtures. `npm run check` runs ARC lint, DSL validation, blocklet check and build. `npm run smoke` checks a running app over HTTP, including assets, payment creation, confirmation, persistence and public-route boundaries. It creates a clearly named simulated donation, and refuses non-preview instances.

The original supplied pixel artwork is preserved at `blocklets/fomo4good/content/media/launch-pixel.jpg`. Palette and CRT styling derive from that reference. It is user-supplied artwork; its rights are separate from the source code's MIT license.

## Current verification

Ten tests cover DID Space persistence, concurrent writes, expiry/deduplication, campaign end, native USDC event decoding, watcher recovery, financial reconciliation, and client payment/receipt recovery in a DOM test. HTTP smoke passes against the running ARC-rendered preview. Browser screenshot/mobile visual acceptance has not been performed in this session: desktop automation was stopped after it interfered with the user’s access.
