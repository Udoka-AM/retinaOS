# RETINAOS — Robinhood Chain Build Blueprint
### Phase 1 scope: Retina Terminal → Cortex → Retina Wallet

**Operating approach:** testnet-first, ship fast, validate on real usage over a 1–3 month window before committing to mainnet. Move with conviction on a real vertical rather than waiting for certainty — flag risks briefly where they change a build decision, but don't let speculation slow shipping.

---

## Brand & Design System Foundation — RetinaOS

This is a strategic foundation, not a finished system — naming logic, pillars, motif direction, and starting parameters for the design team to take into full execution (logo lockups, accessibility-checked color ramps, type scale, component library, icon set, motion spec).

### Naming logic
The eye is the natural metaphor for this whole stack, and it maps cleanly onto what each product actually does:
- **RetinaOS** — the retina converts raw, chaotic light into a signal the brain can use. That's exactly the job of this stack: turn on-chain noise into clear, usable intelligence.
- **Retina Terminal** — the eye itself. Where raw market "light" (on-chain data) is captured.
- **Cortex** — the visual cortex, where what the eye captures gets recognized and judged as meaningful or not. Maps directly onto reputation/verification: separating signal from noise, real from fake.
- **Retina Wallet** — the reflex. The trained, near-instant motor response once judgment has already happened. Speed and trust, not deliberation.

One coherent system: **see → understand → act.**

### Brand pillars
1. **Sight** — clarity, seeing what others haven't noticed yet, cutting through noise
2. **Intelligence** — synthesized understanding, not just raw data dumped on a screen
3. **Speed** — reflexive, near-instant execution once judgment has been made

### Brand personality & voice
- Precise, confident, unembellished — reads like a trained analyst, not a hype account
- Calm under chaotic market conditions — the brand is the steady eye in a noisy room
- Sharp, minimal copy; explicitly avoid crypto-hype tone (no rocket emojis, no "to the moon" energy) — trust is the actual product, and hype language undercuts it

### Visual language direction
- **Core motif:** the eye / lens / aperture — iris rings, aperture blades, focus rings, pupil dilation as a natural loading/processing state
- **Sub-brand motifs**, all variations on the same optical language so the three products read as one family:
  - *Retina Terminal:* aperture / radar-sweep lines — cool, clinical, "capturing"
  - *Cortex:* branching neural/synaptic lines — "processing, recognizing, judging"
  - *Retina Wallet:* directional motion trails / reflex arcs — "acting, fast"
- **Overall aesthetic:** dark-mode-first (matches trading-terminal convention and reduces eye strain for a data-dense product), high contrast, precise grid, minimal clutter — the interface itself should feel like clarity cutting through noise, not just say it

### Color system foundation (starting point, not final)
- **Base:** a near-black "dilated pupil" background rather than pure black — approx. `#0A0B0D` — with a light neutral-gray data/table palette on top for density without harshness
- **Signal accent:** one sharp, high-contrast color reserved for "this matters" moments only (live states, high-Cortex-score flags, active alerts) — an electric cyan/blue reads as optical and precise, approx. `#00E5FF` as a placeholder
- **Sub-brand accents**, layered on the shared base rather than replacing it:
  - Retina Terminal — cyan/electric blue (seeing, capturing)
  - Cortex — violet/magenta (cognition, judgment)
  - Retina Wallet — warm amber (urgency, action)
- **Risk/status colors** (red/amber/green) stay strictly semantic and separate from brand accents, so a risk flag is never visually confused with a brand moment
- Accent colors are reserved for signal, never used decoratively — a screen where everything is highlighted highlights nothing

### Typography direction
- A geometric/grotesque sans for UI and data density (Inter/Söhne-adjacent) — needs to stay legible at small sizes across dense tables
- A distinct, slightly technical display face for marketing and headlines to reinforce precision
- **Numerals always tabular/monospaced** for financial data regardless of body typeface — prices, scores, and percentages need to align cleanly in tables; this is a functional requirement, not a style choice

### Iconography & motion principles
- Icons: thin-stroke, optical-themed (aperture, iris, scan lines, focus reticles) — explicitly avoid generic crypto iconography (rockets, coins, moons, lightning bolts as literal decoration)
- Motion: fast, snappy, minimal easing — think "aperture snap" or "focus pull" rather than fades; elements should feel like they're coming into focus, not drifting in
- Loading states can use the iris/aperture motif literally (dilating or closing) rather than a generic spinner
- Micro-interactions should feel reflexive and instant — decorative animation that adds perceived latency works directly against the "lightning fast execution" pillar

### Logo direction (concept only)
- Primary mark: an abstracted iris/aperture form, simplified enough to hold up at favicon/app-icon size
- Wordmark: "RetinaOS" in the primary typeface, with each sub-product using a consistent lockup pattern (shared mark + sub-name) so Retina Terminal, Cortex, and Retina Wallet visibly read as one family rather than three unrelated apps
- Avoid a literal eyeball illustration — it reads gimmicky and uncanny at UI scale. Abstract toward iris rings, aperture blades, or a stylized scan-line/pupil mark instead

### Handoff note
Every hex value, typeface, and motif above is a directional starting point, not a locked decision. When professional designers come on, the immediate next steps are: accessibility-checked contrast ratios for a dark-mode financial dashboard (this matters more than usual given how much time users will spend reading numbers), a full color ramp per accent, a type scale, and a component library built against real product content rather than placeholder text.

---

## 0. How the three products relate

```
RETINA TERMINAL (data + intelligence core)
        │
        ├── surfaces wallet/token reputation scores inline
        │        (Product 2 is a module INSIDE Retina Terminal, not separate infra)
        │
        └── feeds pre-trade checks + policy data to →
                 RETINA WALLET (Product 3)
                 (executes via Robinhood Trading MCP / user's own wallet —
                  never holds custody itself)
```

One data layer. One indexer. One team surface area. Reputation is a feature of Retina Terminal, not a second backend. The Retina Wallet is a thin execution/UX layer that calls out to existing rails instead of owning funds.

---

## PRODUCT 1 — RETINA TERMINAL

### Overview
Real-time market intelligence for Robinhood Chain: token discovery, wallet intelligence, and AI-generated explanations of "why is this moving and is it likely to continue." Built on public on-chain data — no dependency on Robinhood's private infra, so it works whether or not Robinhood ever exposes more.

### How it functions
- **Indexer** watches Robinhood Chain (Arbitrum Orbit / Ethereum L2) for token creation, swaps, liquidity events, transfers.
- Raw events get enriched into three core objects: **Token**, **Wallet**, **Event** — each timestamped and queryable.
- An AI summarization layer periodically (every few minutes for hot tokens) generates a plain-language read: momentum, risk flags, wallet concentration, liquidity trend.
- Everything is served through a web dashboard + a public API for anyone who wants raw or scored data (agent developers, other builders).

### Core modules (v1 scope)
1. **Discovery feed** — filterable list of tokens (market cap, volume, liquidity, holder growth, age, launchpad). Default view: "trending in the last hour."
2. **Token page** — per-token dashboard: price/volume chart, liquidity depth, holder distribution, top wallets, AI summary, risk flags (wash trading, sybil clusters, concentrated ownership, liquidity pulled/added).
3. **Wallet page** — per-wallet profile: portfolio, historical PnL (from on-chain data, best-effort), entry timing relative to major moves, sector preference, classification tag (see Cortex).
4. **AI Market Analyst** — chat-style query box: "why is this moving," "who's buying," "compare to similar launches this week."
5. **Alerts** — user sets a filter (e.g. "new token, <$2M cap, liquidity >$100K, no critical risk flags") and gets notified when something matches.

### User experience & journey
- **First visit:** lands on the trending feed, no login required — immediate value, no wall.
- **Curiosity → depth:** clicks a token → sees AI summary first (above the fold), then supporting data below. The summary is the hook; the dashboard is for people who want to verify it themselves.
- **Habit formation:** sets one alert in the first session (nudged via a simple prompt after viewing 2–3 tokens). Alerts are the retention mechanic — bring users back via notification, not by requiring them to open the app.
- **Power user path:** connects a wallet (read-only) to get a personalized "wallets you follow" feed and API key for programmatic access.
- **Trust moment:** whenever a flagged event happens (like a Noxa-style shutdown), Retina Terminal should be the fastest place to see "here's what changed, here's which wallets moved first" — this is the moment that converts casual visitors into daily users.

### Build plan (weeks, testnet-first)

| Weeks | Milestone |
|---|---|
| 1–2 | Indexer live on testnet/mainnet read-only data; Token + Wallet + Event schema in place; raw discovery feed (no AI yet) |
| 3–4 | Token page v1 (charts, liquidity, holders) + basic risk flag rules (concentration, wash-trade heuristics) |
| 5–6 | AI summary layer (token pages) + AI Market Analyst chat query |
| 7–8 | Wallet pages + alerts system + read-only wallet connect |
| 9–10 | Public API + rate-limited free tier; start onboarding a handful of agent-dev testers |
| 11–12 | Review real usage data (DAU, alert engagement, API adoption) → go/no-go call on deeper mainnet commitment and Cortex buildout pace |

### Revenue
- **Free:** discovery feed, basic token pages, limited AI queries/day
- **Pro (~$15–30/mo):** unlimited AI queries, alerts, wallet following, historical data
- **API tier:** usage-based pricing for developers/agent builders pulling structured data
- **No enterprise tier yet** — too early for Robinhood Chain to have institutional demand; revisit after mainnet validation window

### Tech stack
- **Indexing:** custom indexer or Goldsky-style service reading Robinhood Chain (Arbitrum Orbit RPC); Chainlink for price feeds where relevant
- **Backend:** TypeScript (Node) or Python/FastAPI for the API layer; Postgres for structured data, Redis for hot-path caching (trending feed, live prices), ClickHouse if event volume outgrows Postgres for analytics queries
- **AI layer:** LLM API calls (model-agnostic abstraction) for summaries + chat analyst, grounded strictly in structured data pulled from the DB — never freeform hallucinated claims
- **Frontend:** Next.js + TypeScript + Tailwind
- **Infra:** Docker + a single cloud provider (AWS or GCP) to start; no need for multi-region yet at this stage

---

## PRODUCT 2 — CORTEX

### Overview
Not a separate app — a scoring module embedded directly into Retina Terminal's wallet and token pages. Turns raw on-chain history into a trust signal: "this wallet has a 68% win rate on early entries" instead of just "this wallet bought this token."

### How it functions
- Every wallet gets a **behavioral classification** derived from trade history: Early Mover, Momentum Trader, Liquidity Provider, Sniper/Bot, Long-Term Holder, etc.
- A **reputation score** combines: win rate, average entry timing relative to major price moves, consistency across multiple tokens, and drawdown/risk profile — not just raw ROI (a single lucky trade shouldn't rank a wallet #1).
- Every token gets a **risk score** combining holder concentration, liquidity stability, wash-trade likelihood, and whether "smart money" wallets are accumulating or exiting.
- Scores update continuously as new on-chain events land — this is the layer that compounds in value over time and is the hardest thing for a competitor to clone quickly, since it requires sustained historical data, not just a live dashboard.

### User experience & journey
- Surfaces as a **badge + score** directly on wallet/token pages already built in Retina Terminal — no separate product to learn or switch to.
- On a token page: "3 of the top 10 holders are classified High-Confidence Early Movers, currently net accumulating" — immediately actionable context, right where the user already is.
- On a wallet page: reputation score, classification tag, and a simple "follow this wallet" action that feeds the user's personalized alert feed.
- No cold-start problem in practice: scores are generated from public on-chain history the moment the indexer has enough data on a wallet — usable from day one, refined over time.

### Build plan
Runs as an extension of the Retina Terminal build, not a separate track:

| Weeks | Milestone |
|---|---|
| 5–6 (parallel with Retina Terminal AI layer) | Scoring methodology v1: rule-based classification (no ML yet — keep it explainable and fast to ship) |
| 7–8 | Scores surfaced on wallet/token pages; "follow wallet" feeds into alerts |
| 9–10 | Refine scoring with real usage feedback; add token-level risk scoring alongside wallet reputation |
| 11–12 | Evaluate whether scoring accuracy/engagement justifies a dedicated leaderboard view (public "top wallets on Robinhood Chain" page — strong shareable/growth content if the data holds up) |

### Revenue
- Bundled into Retina Terminal Pro — this is a retention and differentiation feature, not a separate SKU, at least until it's proven enough to justify unbundling
- Longer-term optionality: a public leaderboard becomes a content/growth engine (shareable, drives organic traffic) even before it's monetized directly

### Tech stack
- Same DB and indexer as Retina Terminal — this is a scoring service that reads from the same Event/Wallet tables, no new data pipeline needed
- Rule engine in the backend service (deterministic first, revisit ML-based scoring only once there's enough labeled outcome data to train against)

---

## PRODUCT 3 — RETINA WALLET (non-standalone)

### Overview
A client-side companion app that puts Retina Terminal's intelligence and Cortex scores directly into a user's decision-making and trade flow — without ever holding custody itself. Execution routes through **existing rails**: Robinhood's Trading MCP where applicable, or a connected self-custody wallet (WalletConnect-style) for on-chain trades. This sidesteps the smart-account/session-key security build entirely for v1.

### How it functions
- User connects an existing wallet (or their Robinhood agentic account, once/if Robinhood exposes relevant scopes) — Retina never custodies funds.
- User sets simple, plain-language policies (budget, max per trade, min reputation score to auto-surface, risk flags to avoid) — mirrors the intent-based framing from the original wallet concept, but every action still requires explicit user confirmation in v1. No autonomous execution until the policy engine has a track record.
- When a trade matches the user's policy (e.g. "notify me when a token scores >75 reputation and I'm not already holding it"), the companion surfaces a **one-tap confirm** action that routes the actual transaction through the connected wallet/rail — Retina constructs the transaction, the user's own wallet signs and executes it.
- This is deliberately closer to "an intelligent trade-alert-to-execution bridge" than a full autonomous agent wallet — that's the lower-risk version worth shipping first.

### User experience & journey
- **Entry point:** comes from Retina Terminal — a user following wallets/tokens gets a natural upsell into "let me help you act on this" rather than the Retina Wallet being a separate acquisition funnel.
- **Setup:** connect wallet → set one simple policy (budget + risk threshold) → done. Should take under two minutes.
- **Daily use:** push notification when a policy match occurs → user reviews the one-line reasoning (pulled straight from Retina Terminal's AI summary + reputation score) → taps confirm or dismisses.
- **Trust building:** every suggestion shows its reasoning transparently (which reputation signals triggered it) — this is what makes it acceptable as "assisted," not a black box, and is the foundation for eventually allowing more autonomy once trust is earned.

### Build plan
This is the highest-risk piece — sequence it last and gate it behind Retina Terminal/Cortex traction:

| Weeks | Milestone |
|---|---|
| 9–10 (starts once Retina Terminal shows real engagement) | Wallet-connect flow (read + transaction construction, no custody); policy input UI |
| 11–12 | One-tap confirm execution via connected wallet; notification pipeline tied to Cortex scores |
| Post-week 12 | Go/no-go based on Retina Terminal+Cortex traction: expand toward Robinhood Trading MCP integration if/when Robinhood exposes relevant hooks; consider bounded autonomy only after a meaningful sample of confirmed trades shows the policy engine is reliable |

### Revenue
- **Free:** manual confirm flow, basic policies
- **Pro:** advanced policy rules, multiple wallets, priority notifications
- **Longer-term:** potential small fee-share on executed trades if/when volume justifies it — not a v1 assumption

### Tech stack
- **Wallet connectivity:** WalletConnect / standard EVM wallet-connect libraries; transaction construction via ethers.js or viem
- **No smart-account/session-key infra in v1** — that's explicitly deferred; this is what keeps the build achievable in the 3-month window instead of becoming its own multi-month security-audit project
- **Backend:** shares Retina Terminal's policy/reputation data via internal API — no separate data store
- **Frontend:** same Next.js app as Retina Terminal, or a lightweight mobile-first companion view if usage patterns show people want push-notification-driven mobile access more than desktop

---

## Shared infra summary
- One indexer, one Postgres/ClickHouse data layer, one API — Retina Terminal, Cortex, and Retina Wallet are three surfaces on top of it, not three backends.
- No custody-holding code in the critical path for v1 — removes the single largest security/audit burden from the timeline.
- Everything ships testnet-first; the 1–3 month checkpoint at week 12 is the real decision point for mainnet commitment and for how much further to build toward Robinhood MCP integration or autonomous execution.
