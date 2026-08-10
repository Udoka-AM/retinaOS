# RetinaOS Indexer — DEX Registry (Stage 0)

Chosen DEX for Stage 0–5 (Stage 0 gate, [INDEXER.md](./INDEXER.md#11-milestones--staged-execution-plan)):
**Uniswap V3 on Robinhood Chain** — highest coverage/volume, launched as the chain's primary
public AMM from day one.

Sources: [Uniswap blog announcement](https://blog.uniswap.org/robinhood-chain-is-live) ·
[Uniswap deployments doc](https://developers.uniswap.org/docs/protocols/v3/deployments/v3-robinhood-chain-deployments) ·
[GeckoTerminal — Robinhood](https://www.geckoterminal.com/robinhood/pools) ·
[GeckoTerminal — Uniswap V3 (Robinhood)](https://www.geckoterminal.com/robinhood/uniswap-v3-robinhood/pools)

Why V3 over the other 27 DEXs GeckoTerminal lists (Uniswap V2/V4, Pancakeswap, Sushiswap,
Ramses, Curve, Ekubo, RobinSwap, …): V3 is the chain's designated primary AMM and carries the
large majority of chain volume in early GeckoTerminal snapshots. Starting elsewhere would mean
building a decoder for a smaller pool of liquidity first — the opposite of "most coverage."

---

## Chain

| | |
|---|---|
| Chain ID | `4663` |
| Explorer (mainnet) | Blockscout, `explorer.chain.robinhood.com` (pattern; confirm exact host before ingestion) |
| Explorer (testnet) | `explorer.testnet.chain.robinhood.com` |
| Testnet faucet | `faucet.testnet.chain.robinhood.com` |

---

## Uniswap V3 contracts (Robinhood Chain)

| Contract | Address | Relevant to indexer |
|---|---|---|
| **UniswapV3Factory** | `0x1f7d7550b1b028f7571e69a784071f0205fd2efa` | `PoolCreated` events → pool discovery |
| **SwapRouter02** | `0xcaf681a66d020601342297493863e78c959e5cb2` | Primary swap router — most user swaps route through here |
| **UniversalRouter** | `0x8876789976decbfcbbbe364623c63652db8c0904` | Newer routing path; also emits pool `Swap` events, decode alongside SwapRouter02 |
| **NonfungiblePositionManager** | `0x73991a25c818bf1f1128deaab1492d45638de0d3` | LP `Mint`/`Burn`/`IncreaseLiquidity`/`DecreaseLiquidity` — liquidity events |
| **QuoterV2** | `0x33e885ed0ec9bf04ecfb19341582aadcb4c8a9e7` | Not needed for indexing (read-only quoting, no state-changing events) |
| **UniswapInterfaceMulticall** | `0x282a3c4d320cc7f0d5eaf56b8029e4b88338f0a3` | Not needed for indexing |
| **TickLens** | `0x7dfd4f31be6814d2906bde155c3e1b146eac1468` | Not needed for indexing |
| **NonfungibleTokenPositionDescriptor** | `0x6f84dae9c064ff453e5c8af51efb819f8f610225` | Not needed for indexing |
| **NFTDescriptor** | `0x2e9d45bb7b30549f5216813ada9a6b7982c5b3ed` | Not needed for indexing |
| **Permit2** | `0x000000000022D473030F116dDEE9F6B43aC78BA3` | Canonical cross-chain deployment (same address everywhere) — not needed for indexing |

**Note:** all addresses above are from Uniswap's own deployments doc, not yet cross-verified
against the chain via `eth_getCode`/explorer lookup. Do that verification as the first task of
the Stage 0 sprint before wiring decoders to them.

**Events to decode (V3 core ABI, standard across all Uniswap V3 chains):**
- `UniswapV3Factory.PoolCreated(token0, token1, fee, tickSpacing, pool)` — pool discovery
- Per-pool `Swap(sender, recipient, amount0, amount1, sqrtPriceX96, liquidity, tick)` — trades
- Per-pool `Mint(sender, owner, tickLower, tickUpper, amount, amount0, amount1)` — liquidity add
- Per-pool `Burn(owner, tickLower, tickUpper, amount, amount0, amount1)` — liquidity remove
- `Transfer(from, to, value)` on each discovered token's ERC-20 contract — holder tracking (Stage 6, scoped to discovered tokens only per Stage 3)

---

## Known token contracts

| Symbol | Address | Source |
|---|---|---|
| WETH | `0x0Bd7D308f8E1639FAb988df18A8011f41EAcAD73` | [docs.robinhood.com/chain/contracts](https://docs.robinhood.com/chain/contracts) |
| USDG | `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168` | [docs.robinhood.com/chain/contracts](https://docs.robinhood.com/chain/contracts) |

WETH is the dominant quote asset (nearly every top pool below is `TOKEN/WETH`) — price derivation
in Stage 3 should route through WETH first, USDG as secondary stable reference. Full stock-token/
ETF registry loads dynamically on the docs page and needs a live fetch, not a static list.

---

## Test-fixture pools (top 15 by 24h volume, GeckoTerminal snapshot 2026-08-10)

Use these as the fixture set for Stage 0's manual-decode gate and Stage 3's parity report.

| Pair | 24h Volume | Pool address |
|---|---|---|
| CASHCAT/WETH | $5.1M | `0xa70fc67c9f69da90b63a0e4c05d229954574e313` |
| PIPEDOG/WETH | $2.7M | `0xb7f10f74b39291b9290b779978e19a7637c742d6` |
| PONS/WETH | $2.1M | `0x10cc6bd38112cac182db90b6a71d8bb5939526ba` |
| JUGGERNAUT/WETH | $2.0M | `0x588b0785f50063260003b7790c42f1ef74902746` |
| TOPBLAST/WETH | $1.6M | `0x4361f6f67e841208c8b732e87c0c25d9d3cec223` |
| Index/WETH | $1.2M | `0xd29893ffac8b29ec4db2cfe0cdb3fe1377c028ff` |
| TENDIES/WETH | $987K | `0x237609918f330add285b8bc5f8f2922283d1c4c5` |
| MANCER/WETH | $782K | `0x543127d6a1932689faacc1afad4a81146d9ccf54` |
| YOLO/WETH | $837.7K | `0x52fcb1d83191e06ef2d2d9f460609ca22a923558` |
| IF/WETH | $737.5K | `0x39a200271525e9641e799127bdab299daef21953` |
| WOOF/WETH | $599.9K | `0x2a004148be6efee250420d93a1ac6393e32d2d60` |
| PEPECOIN/WETH | $165.8K | `0x29d2049bb2f92b17a5e75cb6ee6d6c1ba8a82dcd` |
| DERP/STONKBROKER | $160.2K | `0xe7a87eb0ff7e3a85c1bb983ef57ee2000085de8d` |
| POPCAT/WETH | $88.7K | `0x306f6b51f0590b3a30891667cec96d2095abebf2` |
| SWOGE/WETH | $18.4K | `0xcaa4f109e55bdf516fe9215ad4f0ef9cd2b27555` |

DERP/STONKBROKER is the one non-WETH pair in the top 15 — good edge-case fixture for base/quote
resolution logic (Stage 3) since it won't hit the "quote = WETH" fast path.

---

## Open items before Stage 0 exit gate

1. Verify each contract address above against the live chain (`eth_getCode` non-empty, or explorer lookup) — not yet done, this doc is compiled from docs/announcements only.
2. Confirm the exact mainnet Blockscout explorer hostname (used `explorer.chain.robinhood.com` as a pattern from the testnet URL — unverified).
3. Get an Alchemy (or equivalent) RPC/WSS endpoint provisioned for chain 4663 and confirm it serves both `newHeads` and historical `eth_getLogs` in bounded ranges.
4. Pull the standard Uniswap V3 core + periphery ABIs (Factory, Pool, SwapRouter02, UniversalRouter, NonfungiblePositionManager) — these are open-source and chain-agnostic, no need to reverse-engineer.
5. Determine `created_block` for the Factory contract (chain launch was ~13 days before this doc per the 4663/WETH pool age) to bound the backfill start.
