# RetinaOS Indexer — Technical Spec

The phase that turns RetinaOS from a **read-through client** (proxying GeckoTerminal + Blockscout) into a
**first-party intelligence platform** with its own indexed copy of Robinhood Chain.

Status: **proposed**. Everything below sits behind the existing `TerminalDataProvider` interface
(`lib/data/index.ts`), so it ships without rewriting any UI.

---

## 1. Why

The current keyless stack is excellent for shipping, but four hard ceilings block the product vision:

| Limitation today | Root cause | Unlocked by the indexer |
|---|---|---|
| **~5s feed refresh, ~40 tokens** | GeckoTerminal free tier = ~30 req/min | Sub-second, **all** tokens/pools on chain |
| **Cortex is heuristic** (no true PnL, entry-timing, sybil graphs) | We never see full historical swaps per wallet | Real reputation from reconstructed trade history + a funding/transfer graph |
| **Alerts only run while a tab is open** | Evaluation is client-side (`AlertsEngine`) | Always-on server evaluation → email + web push when closed |
| **No persistence / identity** | No database, no auth | Saved watchlists, alert history, per-user state across devices |

It also removes the third-party dependency and rate-limit fragility (the 429 retry/backoff in
`lib/data/geckoterminal.ts` becomes unnecessary for reads).

---

## 2. Architecture

```
                 Robinhood Chain (RPC + WSS, chain 4663)
                              │  new blocks · logs (Swap, Transfer, PairCreated)
                              ▼
                    ┌──────────────────────┐
                    │  Ingestion worker     │  viem/ethers WSS subscription + backfill
                    │  (long-lived Node)    │  decode → normalize → enqueue
                    └──────────┬───────────┘
                               ▼
          ┌────────── Postgres (+ TimescaleDB) ──────────┐   ┌── Redis ──┐
          │ tokens · pools · swaps · transfers · holders │   │ hot cache │
          │ ohlcv rollups · wallet_positions · scores    │   │  pub/sub  │
          └──────────┬───────────────────────┬───────────┘   └─────┬─────┘
                     │ derive                 │ read                │ realtime
                     ▼                        ▼                     ▼
          ┌──────────────────┐     ┌────────────────────┐   ┌──────────────┐
          │ Cortex compute   │     │ Next.js provider   │   │ SSE/WS fanout │
          │ (jobs / stream)  │     │ (Db-backed adapter)│   │ → live feed   │
          └──────────────────┘     └─────────┬──────────┘   └──────────────┘
                                             ▼
                                   Next.js app on Vercel (unchanged UI)
```

Two runtimes:

- **Persistent services** (ingestion worker, Cortex jobs, alerts engine, WS fanout) run on a host that
  allows long-lived connections — **Railway / Fly.io / Render**. Vercel serverless cannot hold a websocket
  or run a cron loop, so these do **not** live in the Next app.
- **Next.js** stays on Vercel and only *reads* Postgres/Redis and subscribes to the realtime channel.

---

## 3. Ingestion

- **Source:** Robinhood Chain public RPC + **Alchemy** WSS (free tier: generous compute units; chain 4663 supported).
- **Subscribe:** `newHeads`, and `logs` filtered to the DEX router/factory + ERC-20 `Transfer`.
- **Decode:** `Swap` (Uniswap v2/v3/v4, DYORswap, Bankr…), `PairCreated`/`PoolCreated`, `Transfer`, `Mint`/`Burn` (liquidity).
- **Backfill:** on cold start, page historical logs from genesis (or a checkpoint block) in ranges; store `last_indexed_block` for resume.
- **Reorg safety:** keep the last N blocks "unconfirmed"; on reorg, roll back rows by block hash.
- **Build vs. buy:** a custom **viem**-based indexer is ~1–2k LoC and gives full control; **Ponder** (schema + handlers + built-in reorg/backfill) or **Subsquid** would cut that materially. Recommend **Ponder** for v1 speed, custom later if needed.
- **Prices:** derive token USD price from the deepest stable/WETH pool per token per block; snapshot to `ohlcv` rollups (1m/5m/1h/1d) via Timescale continuous aggregates.

---

## 4. Data model (Postgres)

```
tokens(address pk, symbol, name, decimals, created_block, created_at, logo_url)
pools(address pk, token, quote, dex, fee, created_block, reserve_usd, ...)
swaps(tx_hash, log_index, pool, wallet, side, amount_usd, price_usd, ts)   -- hypertable
transfers(tx_hash, log_index, token, from, to, value, ts)                  -- hypertable
holders(token, wallet, balance, first_seen, PRIMARY KEY(token, wallet))    -- materialized from transfers
ohlcv(pool, tf, ts, o,h,l,c,v)                                             -- continuous aggregate
wallet_positions(wallet, token, qty, cost_basis_usd, realized_pnl_usd, ...) -- derived from swaps
scores_token(token, score, subs, flags, updated_at)
scores_wallet(wallet, score, tags, subs, updated_at)
users(id, wallet, email, created_at)                                       -- SIWE identity
alerts(id, user_id, kind, filter_json, enabled, ...)
alert_events(id, alert_id, subject, detail, href, ts)
```

Holder tables are the single biggest win: they make **concentration, holder-growth, and sybil** first-class
instead of the per-request Blockscout calls we make today.

---

## 5. Cortex — real signals (replaces the heuristic)

The current `lib/data/cortex.ts` scores from feed-level metrics. With full history:

- **Wallet reputation** — reconstruct each wallet's trade ledger from `swaps` → realized/unrealized **PnL**,
  **win rate**, **entry timing** (buy time vs. the pool's price path), holding duration, drawdown. These are
  the exact axes the product promises ("Early Mover, Momentum, LP, Sniper/Bot, Long-Term Holder").
- **Token risk** — concentration straight from `holders`; **wash-trade** detection from self-cycling swap
  graphs and buy/sell symmetry per wallet; **liquidity-pull** from `Burn` events; **smart-money exiting**
  from net flow of high-reputation wallets.
- **Sybil clusters** — union-find over `transfers` funding edges + shared-funder heuristics → collapse
  clusters into single entities before scoring concentration.
- **Compute model:** streaming updates on each new swap/transfer for hot tokens; batch nightly recompute for
  the long tail. Store in `scores_*`, served instantly.

The `scoreToken`/`scoreWallet` **function signatures stay** — only their inputs get richer, so the panels
(`CortexPanels.tsx`) don't change.

---

## 6. Serving & realtime

- **DB-backed provider:** add `lib/data/db.ts` implementing `TerminalDataProvider` against Postgres. Flip
  `provider` in `lib/data/index.ts` (or run both behind a flag and shadow-compare). **No UI changes.**
- **Realtime feed:** worker publishes feed/pool/score deltas to Redis pub/sub → a lightweight SSE endpoint
  (or a WS service on the persistent host) → the Discovery Feed swaps its 4s poll for a live subscription =
  **sub-second** updates, no rate limit.
- **Reads are now free/unlimited**, so the aggressive caching in the GeckoTerminal adapter is no longer needed.

---

## 7. Alerts (server-side)

Promote today's client `AlertsEngine` to a server worker:

- Evaluate `alerts.filter_json` against the **live indexed stream** (every block, not every 15s) — including
  the holder-growth and reputation filters we can't do client-side today.
- **Delivery:** email via **Resend**/**Postmark**; **web push** via VAPID (works when the tab is closed);
  optional Telegram/Discord webhooks.
- Persist fires to `alert_events`; the existing Alerts page reads history from the DB instead of localStorage.
- Enforce tiers server-side (Free 3 / Pro unlimited) once billing exists.

---

## 8. Identity & tiers

- **Auth:** Sign-In With Ethereum (SIWE) using the wallet already connected in the header (`ConnectWallet`).
  Optional email for notifications. Session via signed cookie / JWT.
- **Tiers:** map Free/Pro (the pricing page) to feature gates (alert count, API access, refresh rate).
- **Public API:** the `/api/*` routes graduate into the documented Public API (auth by key), matching the docs.

---

## 9. Migration path (low-risk, phased)

1. **Stand up ingestion + DB** in staging; backfill; verify token/pool/price parity against GeckoTerminal.
2. **Shadow read:** DB-backed provider runs alongside the live one; log diffs; fix decoders until parity.
3. **Cut over reads** feed → token → wallet, one at a time (provider swap, UI untouched).
4. **Realtime:** replace the feed poll with the SSE/WS subscription.
5. **Cortex v2:** compute real scores; keep the panels.
6. **Server alerts + auth + push.**

Each step is independently shippable and reversible (flip the provider back).

---

## 10. Hosting, cost, risk

- **Postgres+Timescale:** Supabase / Neon / Timescale Cloud (managed).
- **Redis:** Upstash.
- **Workers:** Railway / Fly.io (persistent, WSS-friendly).
- **Next.js:** stays on Vercel.
- **LLM:** the AI Analyst keeps calling Claude, now grounded on our own DB (faster, unlimited tool calls).

**Rough cost (early):** a few hundred $/mo (small managed Postgres + Redis + one worker) — dominated by DB
storage as `swaps`/`transfers` grow; mitigate with Timescale compression + retention on raw logs once rollups exist.

**Risks:** RPC/WSS reliability (mitigate with a fallback provider + backfill reconciliation); reorgs (block-hash
rollback); DEX ABI coverage (start with the top routers, expand); indexing lag under bursts (queue + backpressure).
Accurate PnL is genuinely hard — ship it labeled "best-effort" first, refine.

---

## 11. Milestones — staged execution plan

Supersedes the flat M1–M6 list with a gated, one-DEX-first sequence. Each stage has a hard
completion gate before the next starts; every step is independently shippable and reversible.

| Stage | Scope | Est. | Gate |
|---|---|---|---|
| **0** | DEX/pool discovery: registry of factory/router/pool addresses, ABIs, pool type (V2/V3/V4/custom), earliest backfill block, 10–20 test-fixture pools. Pick the single highest-volume DEX for Stage 1–3. | 2–3d | Can manually decode pool-creation, swap, mint, burn txs for the chosen DEX. |
| **1** | `apps/indexer` workspace: config, DB connection, migrations, structured logging, health endpoint, graceful shutdown, checkpoint storage, feature flags. Plain Postgres — **no Timescale/Redis yet**. | 3–4d | Worker connects to chain + DB, records latest block, resumes correctly after restart. |
| **2** | Block ingestion loop: checkpoint → bounded block range → logs → decode → single-transaction write → advance checkpoint → catch-up → near-live. Tables: `indexed_blocks`, `indexer_checkpoints`, `tokens`, `pools`, `swaps`, `liquidity_events`, `ingestion_failures`. Unique `(chain_id, tx_hash, log_index)`; 20–50 block reorg buffer w/ rollback by block hash. | 5–7d | Re-running the same block range twice yields identical DB contents. |
| **3** | Full pipeline for the one chosen DEX: pool discovery from factory events, token metadata, buy/sell decode, reserves, base/quote resolution, USD price via WETH/stables, 1m candles rolled to 5m/1h/1d, rolling volume/liquidity/tx-count. Transfers scoped to *discovered tokens only* (not full-chain) to bound DB growth. | 5–7d | Price/volume/liquidity/tx-count/candle shape within ~1–3% of GeckoTerminal for sample pools. |
| **4** | `lib/data/db.ts` implementing `TerminalDataProvider`; feed/token/OHLCV/trades queries; Blockscout retained for wallet profiles. Add `TERMINAL_DATA_PROVIDER=geckoterminal\|shadow\|indexer` flag — shadow mode serves GeckoTerminal to users while diffing indexer output server-side. | 4–5d | 7 days of shadow comparisons, no material gaps or unexplained diffs. |
| **5** | Controlled rollout, one read path at a time: OHLCV → trades → token detail → new-token feed → trending/top. One-variable rollback to GeckoTerminal per cutover. Monitoring: block lag, failed ranges, RPC errors, events/min, DB size, query latency, unknown event sigs, reorg count, price-parity delta. | 3–4d + monitoring | Block lag <10s, feed queries <300ms, zero duplicate swaps, clean restart recovery, no missing confirmed ranges. |
| **6** | Holders (from transfers, excluding zero/burn/infra addresses), top-10 concentration, wallet positions/cost-basis/PnL/win-rate/entry-timing from swaps, liquidity-pull detection, basic wash-trade signals, funding-graph groundwork for sybil. Run old + new Cortex scores side by side before replacing the heuristic. | 7–10d | Manual validation against explorer history for ≥20 tokens and ≥20 wallets. |
| **7** | Publish pool/swap/score deltas; SSE endpoint off the persistent worker; feed goes push not poll. Move `AlertsEngine` evaluation server-side; persist + dedupe fires; web push first, email after; keep client-side alerts running through migration. Introduce Redis only if Postgres notify/internal stream isn't enough. | 5–7d | Alert delivered with the tab closed; no duplicate deliveries. |
| **8** | SIWE auth, saved alerts/watchlists, API keys + rate limiting, Free/Pro gates, documented public endpoints (tokens/pools/candles/trades/scores). | 5–7d | — |

**First release scope** (Stages 0–5, one DEX only): pool discovery, swaps, liquidity events,
token metadata, prices/OHLCV, new/top/trending feeds, token details, shadow comparison,
GeckoTerminal rollback. Everything else (full-chain transfers, sybil clustering, historical
wallet PnL, Timescale, Redis, email, auth, billing, public API) is explicitly deferred past
first release.

**Dev-time cost:** ~$0 (local worker, Neon free Postgres, Alchemy free RPC/WSS, existing
Vercel). **Beta cost:** ~$5–20/mo (Railway worker + Neon; Redis only if/when needed).

**Immediate next step (Stage 0 sprint):** DEX registry + verified ABIs → `apps/indexer`
scaffold + migrations → block checkpointing → pool-discovery decoder for the chosen DEX →
swap ingestion → idempotency/restart tests → parity report for 10 known pools.

---

## Appendix — AI Analyst provider (interim)

The Analyst runs on a pluggable provider (`lib/ai/provider.ts`), resolved in order:

| Priority | Env var | Provider | Cost |
|---|---|---|---|
| 1 | `ANTHROPIC_API_KEY` | Claude (`claude-opus-4-8`) | paid — the eventual target |
| 2 | `GEMINI_API_KEY` | Gemini (`gemini-3.5-flash`) | **free** |
| 3 | `GROQ_API_KEY` | Groq (`llama-3.3-70b-versatile`) | **free** ~30 rpm / 1,000 rpd |

Reverting to Claude is *only* setting `ANTHROPIC_API_KEY` — no code change. Both free
providers are driven through their OpenAI-compatible endpoints, so they share one code
path; the Anthropic SDK path is separate. All three use the same tools, system prompt,
grounding rules and citation logic.

**Two Gemini model traps** (both verified against the live API):

1. `gemini-2.5-flash` is still returned by `/models` but **404s at call time** —
   *"no longer available to new users."* Listing ≠ usable.
2. The `gemini-flash-latest` alias tracks the *newest* model (3.6), which carries a
   **tighter free quota** and 429s while `gemini-3.5-flash` still has headroom.

So the default is pinned to `gemini-3.5-flash`. If quota runs out, set
`GEMINI_MODEL=gemini-3.5-flash-lite`. Re-probe with
`GET /v1beta/openai/models` + a 1-token completion per candidate before changing it.
