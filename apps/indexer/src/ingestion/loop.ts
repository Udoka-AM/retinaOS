import { decodeEventLog } from "viem";
import { rpc } from "./client.js";
import { pool as pg } from "../db/client.js";
import { withTx } from "../db/client.js";
import { env } from "../config/env.js";
import { log } from "../metrics/log.js";
import { getCheckpoint, advanceCheckpoint } from "../repositories/checkpoint.js";
import { upsertToken, insertPool } from "../repositories/pools.js";
import { insertSwap } from "../repositories/swaps.js";
import { FACTORY_ABI } from "../abi/factory.js";
import { POOL_ABI } from "../abi/pool.js";

const REORG_BUFFER = 30n; // blocks kept "unconfirmed", per INDEXER.md reorg-safety

// Stage 2 gate: process a fixed [from, to] range inside one DB transaction so
// a crash mid-range never leaves partial data — resuming re-reads the same
// checkpoint and reprocesses the identical range, which the (tx_hash, log_index)
// unique constraints make a safe no-op.
async function processRange(from: bigint, to: bigint) {
  const factoryLogs = await rpc.getLogs({
    address: env.factoryAddress,
    events: FACTORY_ABI,
    fromBlock: from,
    toBlock: to,
  });

  const poolAddresses = new Set<string>();
  for (const l of factoryLogs) {
    const decoded = decodeEventLog({ abi: FACTORY_ABI, data: l.data, topics: l.topics });
    if (decoded.eventName === "PoolCreated") poolAddresses.add(decoded.args.pool.toLowerCase());
  }

  // known pools from prior ranges, plus any discovered in this one
  const known = await pg.query<{ address: string }>("SELECT address FROM pools");
  for (const row of known.rows) poolAddresses.add(row.address);

  // The public RPC rejects eth_getLogs with a large `address` array (confirmed live
  // 2026-08-11 — a few hundred addresses in one call errors "Missing or invalid
  // parameters", and even 25 addresses times out once combined with a wide block
  // range), so pool addresses are queried in small chunks per range.
  const ADDRESS_CHUNK = 10;
  const addressList = [...poolAddresses] as `0x${string}`[];
  const swapLogs: Awaited<ReturnType<typeof rpc.getLogs>> = [];
  for (let i = 0; i < addressList.length; i += ADDRESS_CHUNK) {
    const chunk = addressList.slice(i, i + ADDRESS_CHUNK);
    const logs = await rpc.getLogs({
      events: POOL_ABI,
      fromBlock: from,
      toBlock: to,
      address: chunk,
    });
    swapLogs.push(...logs);
  }

  // Fetch each distinct block's timestamp once (not once per swap) and in parallel —
  // this range previously hung for minutes issuing hundreds of sequential eth_getBlock
  // calls, one per swap, before the transaction could even open.
  const blockNumbers = [...new Set(swapLogs.map((l) => l.blockNumber!))];
  const blockTimestamps = new Map<bigint, Date>();
  const BLOCK_BATCH = 10;
  for (let i = 0; i < blockNumbers.length; i += BLOCK_BATCH) {
    const batch = blockNumbers.slice(i, i + BLOCK_BATCH);
    const results = await Promise.all(batch.map((bn) => rpc.getBlock({ blockNumber: bn })));
    batch.forEach((bn, idx) => blockTimestamps.set(bn, new Date(Number(results[idx].timestamp) * 1000)));
  }

  await withTx(async (client) => {
    for (const l of factoryLogs) {
      const decoded = decodeEventLog({ abi: FACTORY_ABI, data: l.data, topics: l.topics });
      if (decoded.eventName !== "PoolCreated") continue;
      const { token0, token1, fee, tickSpacing, pool: poolAddr } = decoded.args;
      await upsertToken(client, { address: token0.toLowerCase(), createdBlock: l.blockNumber! });
      await upsertToken(client, { address: token1.toLowerCase(), createdBlock: l.blockNumber! });
      await insertPool(client, {
        address: poolAddr.toLowerCase(),
        token0: token0.toLowerCase(),
        token1: token1.toLowerCase(),
        fee,
        tickSpacing,
        createdBlock: l.blockNumber!,
      });
    }

    for (const l of swapLogs) {
      const decoded = decodeEventLog({
        abi: POOL_ABI,
        data: l.data,
        topics: l.topics as [signature: `0x${string}`, ...args: `0x${string}`[]],
      });
      if (decoded.eventName !== "Swap") continue;
      await insertSwap(client, {
        txHash: l.transactionHash!,
        logIndex: l.logIndex!,
        pool: l.address.toLowerCase(),
        sender: decoded.args.sender,
        recipient: decoded.args.recipient,
        amount0: decoded.args.amount0.toString(),
        amount1: decoded.args.amount1.toString(),
        sqrtPriceX96: decoded.args.sqrtPriceX96.toString(),
        tick: decoded.args.tick,
        blockNumber: l.blockNumber!,
        ts: blockTimestamps.get(l.blockNumber!)!,
      });
    }
  });

  await advanceCheckpoint(to);
}

export async function runIngestionLoop() {
  let cursor = await getCheckpoint(env.factoryCreatedBlock);
  log.info("resuming from checkpoint", { block: cursor.toString() });

  let consecutiveFailures = 0;

  while (true) {
    const head = await rpc.getBlockNumber();
    const safeHead = head > REORG_BUFFER ? head - REORG_BUFFER : 0n;

    if (cursor >= safeHead) {
      await new Promise((r) => setTimeout(r, 5000));
      continue;
    }

    const to = cursor + env.logRange < safeHead ? cursor + env.logRange : safeHead;
    try {
      await processRange(cursor + 1n, to);
      log.info("indexed range", { from: (cursor + 1n).toString(), to: to.toString() });
      cursor = to;
      consecutiveFailures = 0;
    } catch (err) {
      consecutiveFailures++;
      const backoffMs = Math.min(3000 * 2 ** (consecutiveFailures - 1), 60_000);
      log.error("range failed, will retry", {
        from: (cursor + 1n).toString(),
        to: to.toString(),
        error: String(err),
        attempt: consecutiveFailures,
        backoffMs,
      });
      await pg.query(
        "INSERT INTO ingestion_failures (from_block, to_block, reason) VALUES ($1,$2,$3)",
        [(cursor + 1n).toString(), to.toString(), String(err)]
      );
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
}
