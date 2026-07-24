import type { Holder, TokenOnchain } from "./types";

/** Blockscout adapter for Robinhood Chain — free public API. Supplies the
 *  on-chain layer (holder counts, distribution, labeled entities) that DEX
 *  indexers don't provide. Separate host, so its own rate budget. */

const BASE = "https://robinhoodchain.blockscout.com/api/v2";
const REVALIDATE = 60; // holders move slowly; cache generously

export const explorerTokenUrl = (address: string) =>
  `https://robinhoodchain.blockscout.com/token/${address}`;

async function bsFetch(path: string): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: REVALIDATE },
  });
  if (!res.ok) throw new Error(`Blockscout ${res.status} on ${path}`);
  return res.json();
}

const num = (v: unknown): number => (v == null || v === "" ? 0 : Number(v));

function mapHolders(items: any[], totalSupply: number, decimals: number): Holder[] {
  return items.slice(0, 12).map((it) => {
    const raw = num(it.value);
    const balance = decimals > 0 ? raw / 10 ** decimals : raw;
    const pct = totalSupply > 0 ? (raw / totalSupply) * 100 : null;
    const a = it.address ?? {};
    const tag: string | undefined = a.metadata?.tags?.find((t: any) => t.tagType === "name")?.name;
    return {
      address: a.hash ?? "",
      balance,
      pct,
      isContract: Boolean(a.is_contract),
      label: tag ?? (a.is_contract ? "Contract" : null),
    };
  });
}

export async function getTokenOnchain(address: string): Promise<TokenOnchain> {
  const [info, holders] = await Promise.allSettled([
    bsFetch(`/tokens/${address}`),
    bsFetch(`/tokens/${address}/holders`),
  ]);

  const meta = info.status === "fulfilled" ? info.value : {};
  const decimals = meta.decimals != null ? Number(meta.decimals) : 18;
  const totalSupply = num(meta.total_supply);

  const items = holders.status === "fulfilled" ? (holders.value.items ?? []) : [];
  const topHolders = mapHolders(items, totalSupply, decimals);
  const concentrationTop10 =
    topHolders.length > 0
      ? topHolders.slice(0, 10).reduce((s, h) => s + (h.pct ?? 0), 0)
      : null;

  return {
    holders: meta.holders_count != null ? Number(meta.holders_count) : null,
    transfers: null,
    totalSupply: totalSupply || null,
    decimals,
    topHolders,
    concentrationTop10,
    reputation: meta.reputation ?? null,
  };
}
