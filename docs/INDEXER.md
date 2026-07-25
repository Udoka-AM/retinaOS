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

## 11. Milestones

- **M1** Ingestion + backfill + `tokens/pools/swaps/transfers` in Postgres, parity-checked.
- **M2** DB-backed provider; cut over Discovery Feed + Token pages (reads).
- **M3** Realtime SSE/WS → sub-second feed.
- **M4** Holder tables + Cortex v2 (real PnL, concentration, sybil).
- **M5** Server-side alerts (email + push) + SIWE auth + tiers.
- **M6** Public API + docs.
