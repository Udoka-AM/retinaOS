import type { PoolClient } from "pg";

export async function upsertToken(
  client: PoolClient,
  token: { address: string; createdBlock: bigint }
) {
  await client.query(
    `INSERT INTO tokens (address, created_block)
     VALUES ($1, $2)
     ON CONFLICT (address) DO NOTHING`,
    [token.address, token.createdBlock.toString()]
  );
}

export async function insertPool(
  client: PoolClient,
  pool_: {
    address: string;
    token0: string;
    token1: string;
    fee: number;
    tickSpacing: number;
    createdBlock: bigint;
  }
) {
  await client.query(
    `INSERT INTO pools (address, token0, token1, fee, tick_spacing, created_block)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (address) DO NOTHING`,
    [
      pool_.address,
      pool_.token0,
      pool_.token1,
      pool_.fee,
      pool_.tickSpacing,
      pool_.createdBlock.toString(),
    ]
  );
}
