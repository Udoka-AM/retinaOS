# @retinaos/indexer

Stage 0/1/2 scaffold for the RetinaOS indexer ([docs/INDEXER.md](../../docs/INDEXER.md),
[docs/DEX_REGISTRY.md](../../docs/DEX_REGISTRY.md)). Indexes Uniswap V3 pool creation and
swaps on Robinhood Chain (4663), starting from the Factory's creation block (8930).

## What's here

- `src/abi/` — hand-trimmed event ABIs for Factory, Pool, and ERC-20 (no full contract ABIs,
  only what the ingestion loop decodes)
- `migrations/001_init.sql` — checkpoint table, block tracking, `tokens`/`pools`/`swaps`/
  `liquidity_events`/`ingestion_failures`, idempotency via `(tx_hash, log_index)` primary keys
- `src/ingestion/loop.ts` — the core loop: checkpoint → bounded `eth_getLogs` range → decode →
  single-transaction write → advance checkpoint, with a 30-block reorg buffer
- `src/index.ts` — health endpoint + graceful shutdown

## What's NOT done yet (deliberately — see Stage gates in docs/INDEXER.md)

- **No Postgres provisioned.** Sign up for a free Neon project yourself (I can't create
  accounts on your behalf) and put the connection string in `.env.local` as `DATABASE_URL`.
- **No Alchemy key.** Same reason — sign up at alchemy.com, add `ALCHEMY_API_KEY` to
  `.env.local`. Without it, `RPC_HTTP_URL`/`RPC_WSS_URL` fall back to the public rate-limited
  endpoint, which is fine for a first smoke test but not for sustained ingestion.
- **No `liquidity_events` (Mint/Burn) ingestion wired into the loop yet** — the ABI and table
  exist, decoding isn't hooked up. Small addition once swaps are proven out.
- **Reorg rollback is not implemented** — the buffer is there (30 blocks held back from head)
  but there's no logic yet to detect a reorg and delete/rewrite rows by block hash.
- Not run against real data yet — `tsc --noEmit` passes, but this has not ingested a single
  real block. That's the actual next step once `DATABASE_URL` exists.

## Getting it running

```bash
cd apps/indexer
cp .env.example .env.local   # fill in DATABASE_URL and ALCHEMY_API_KEY
npm install
npm run migrate
npm run dev
```

Then compare `swaps` for the fixture pools in
[docs/DEX_REGISTRY.md](../../docs/DEX_REGISTRY.md#test-fixture-pools-top-15-by-24h-volume-geckoterminal-snapshot-2026-08-10)
against GeckoTerminal — that comparison is the Stage 3 parity gate.
