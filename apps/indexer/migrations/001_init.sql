-- Stage 1/2 foundation: checkpointing, reorg-safe block tracking, and the
-- core Uniswap V3 tables for one DEX (factory 0x1f7d75...fd2efa on chain 4663).

CREATE TABLE indexer_checkpoints (
  id            text PRIMARY KEY,        -- e.g. 'uniswap-v3-robinhood'
  last_block    bigint NOT NULL,
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE indexed_blocks (
  number        bigint PRIMARY KEY,
  hash          text NOT NULL,
  parent_hash   text NOT NULL,
  timestamp     timestamptz NOT NULL,
  is_confirmed  boolean NOT NULL DEFAULT false
);

CREATE TABLE tokens (
  address       text PRIMARY KEY,
  symbol        text,
  name          text,
  decimals      smallint,
  created_block bigint NOT NULL
);

CREATE TABLE pools (
  address       text PRIMARY KEY,
  token0        text NOT NULL REFERENCES tokens(address),
  token1        text NOT NULL REFERENCES tokens(address),
  fee           integer NOT NULL,
  tick_spacing  integer NOT NULL,
  created_block bigint NOT NULL
);

CREATE TABLE swaps (
  tx_hash        text NOT NULL,
  log_index      integer NOT NULL,
  pool           text NOT NULL REFERENCES pools(address),
  sender         text NOT NULL,
  recipient      text NOT NULL,
  amount0        numeric NOT NULL,
  amount1        numeric NOT NULL,
  sqrt_price_x96 numeric NOT NULL,
  tick           integer NOT NULL,
  block_number   bigint NOT NULL,
  ts             timestamptz NOT NULL,
  PRIMARY KEY (tx_hash, log_index)
);
CREATE INDEX swaps_pool_ts_idx ON swaps (pool, ts DESC);

CREATE TABLE liquidity_events (
  tx_hash        text NOT NULL,
  log_index      integer NOT NULL,
  pool           text NOT NULL REFERENCES pools(address),
  kind           text NOT NULL CHECK (kind IN ('mint', 'burn')),
  owner          text NOT NULL,
  tick_lower     integer NOT NULL,
  tick_upper     integer NOT NULL,
  amount         numeric NOT NULL,
  amount0        numeric NOT NULL,
  amount1        numeric NOT NULL,
  block_number   bigint NOT NULL,
  ts             timestamptz NOT NULL,
  PRIMARY KEY (tx_hash, log_index)
);
CREATE INDEX liquidity_events_pool_ts_idx ON liquidity_events (pool, ts DESC);

CREATE TABLE ingestion_failures (
  id            bigserial PRIMARY KEY,
  from_block    bigint NOT NULL,
  to_block      bigint NOT NULL,
  reason        text NOT NULL,
  attempts      integer NOT NULL DEFAULT 1,
  created_at    timestamptz NOT NULL DEFAULT now()
);
