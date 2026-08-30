function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

// Alchemy's free tier caps eth_getLogs at a 10-block range (confirmed live 2026-08-11) —
// backfilling ~33M blocks at that width is ~3.3M requests, not viable. The public Robinhood
// RPC accepted a 200,000-block range with no error for a single-address query, but times out
// once the query combines a wide range with ~25 pool addresses (also confirmed live) — so
// logRange trades backfill speed for reliability. Alchemy is reserved for the eventual WSS
// live-tail once caught up (Stage 2 "switch to near-live" step). Override via LOG_RANGE.
export const env = {
  databaseUrl: required("DATABASE_URL"),
  rpcHttpUrl: process.env.RPC_HTTP_URL || "https://rpc.mainnet.chain.robinhood.com",
  rpcWssUrl: process.env.ALCHEMY_API_KEY
    ? `wss://robinhood-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    : process.env.RPC_WSS_URL || "wss://feed.mainnet.chain.robinhood.com",
  factoryAddress: (process.env.FACTORY_ADDRESS ||
    "0x1f7d7550b1b028f7571e69a784071f0205fd2efa") as `0x${string}`,
  factoryCreatedBlock: BigInt(process.env.FACTORY_CREATED_BLOCK || "8930"),
  healthPort: Number(process.env.HEALTH_PORT || 8787),
  logRange: BigInt(process.env.LOG_RANGE || "5000"),
  chainId: 4663,
};
