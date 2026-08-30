// UniswapV3Factory — event fragments only, sufficient for pool discovery.
// Source: https://github.com/Uniswap/v3-core/blob/main/contracts/UniswapV3Factory.sol
export const FACTORY_ABI = [
  {
    type: "event",
    name: "PoolCreated",
    inputs: [
      { name: "token0", type: "address", indexed: true },
      { name: "token1", type: "address", indexed: true },
      { name: "fee", type: "uint24", indexed: true },
      { name: "tickSpacing", type: "int24", indexed: false },
      { name: "pool", type: "address", indexed: false },
    ],
  },
] as const;
