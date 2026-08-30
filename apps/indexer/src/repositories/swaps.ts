import type { PoolClient } from "pg";

// Relies on the (tx_hash, log_index) primary key for idempotency: re-processing
// the same block range is a no-op via ON CONFLICT DO NOTHING, satisfying the
// Stage 2 gate ("re-run the same block range twice, identical DB contents").
export async function insertSwap(
  client: PoolClient,
  s: {
    txHash: string;
    logIndex: number;
    pool: string;
    sender: string;
    recipient: string;
    amount0: string;
    amount1: string;
    sqrtPriceX96: string;
    tick: number;
    blockNumber: bigint;
    ts: Date;
  }
) {
  await client.query(
    `INSERT INTO swaps
       (tx_hash, log_index, pool, sender, recipient, amount0, amount1, sqrt_price_x96, tick, block_number, ts)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (tx_hash, log_index) DO NOTHING`,
    [
      s.txHash,
      s.logIndex,
      s.pool,
      s.sender,
      s.recipient,
      s.amount0,
      s.amount1,
      s.sqrtPriceX96,
      s.tick,
      s.blockNumber.toString(),
      s.ts,
    ]
  );
}
