import { pool } from "../db/client.js";

const CHECKPOINT_ID = "uniswap-v3-robinhood";

export async function getCheckpoint(defaultBlock: bigint): Promise<bigint> {
  const { rows } = await pool.query<{ last_block: string }>(
    "SELECT last_block FROM indexer_checkpoints WHERE id = $1",
    [CHECKPOINT_ID]
  );
  if (rows.length === 0) return defaultBlock;
  return BigInt(rows[0].last_block);
}

export async function advanceCheckpoint(block: bigint): Promise<void> {
  await pool.query(
    `INSERT INTO indexer_checkpoints (id, last_block, updated_at)
     VALUES ($1, $2, now())
     ON CONFLICT (id) DO UPDATE SET last_block = $2, updated_at = now()`,
    [CHECKPOINT_ID, block.toString()]
  );
}
