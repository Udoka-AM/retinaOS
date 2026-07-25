import { fmtUsd } from "../format";
import { scoreWallet } from "./cortex";
import type { Holder, Holding, TokenOnchain, WalletProfile, WalletTx } from "./types";

/** Blockscout adapter for Robinhood Chain — free public API. Supplies the
 *  on-chain layer (holder counts, distribution, labeled entities) that DEX
 *  indexers don't provide. Separate host, so its own rate budget. */

const BASE = "https://robinhoodchain.blockscout.com/api/v2";
const REVALIDATE = 60; // holders move slowly; cache generously

export const explorerTokenUrl = (address: string) =>
  `https://robinhoodchain.blockscout.com/token/${address}`;
export const explorerAddressUrl = (address: string) =>
  `https://robinhoodchain.blockscout.com/address/${address}`;

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

/* ---------- wallet profile ---------- */

const validLogo = (u: unknown): string | null =>
  typeof u === "string" && u.startsWith("http") && u !== "missing.png" ? u : null;

function mapHoldings(items: any[]): Holding[] {
  const holdings = items
    .map((it): Holding => {
      const t = it.token ?? {};
      const decimals = t.decimals != null ? Number(t.decimals) : 18;
      const balance = decimals > 0 ? num(it.value) / 10 ** decimals : num(it.value);
      const priceUsd = t.exchange_rate != null && t.exchange_rate !== "" ? Number(t.exchange_rate) : null;
      return {
        address: t.address_hash ?? "",
        symbol: t.symbol ?? "—",
        name: t.name ?? "—",
        logoUrl: validLogo(t.icon_url),
        balance,
        priceUsd,
        valueUsd: priceUsd != null ? balance * priceUsd : null,
      };
    })
    .filter((h) => h.balance > 0);

  holdings.sort((a, b) => (b.valueUsd ?? -1) - (a.valueUsd ?? -1));
  return holdings.slice(0, 30);
}

function mapTransfers(items: any[], self: string): WalletTx[] {
  const me = self.toLowerCase();
  return items.slice(0, 20).map((it): WalletTx => {
    const from = (it.from?.hash ?? "").toLowerCase();
    const to = (it.to?.hash ?? "").toLowerCase();
    const direction = from === me && to === me ? "self" : from === me ? "out" : "in";
    const t = it.token ?? {};
    const dec = it.total?.decimals != null ? Number(it.total.decimals) : Number(t.decimals ?? 18);
    const amount = it.total?.value != null ? num(it.total.value) / 10 ** dec : null;
    return {
      hash: it.transaction_hash ?? "",
      ts: it.timestamp ? Math.floor(new Date(it.timestamp).getTime() / 1000) : 0,
      direction,
      counterparty: direction === "out" ? it.to?.hash ?? "" : it.from?.hash ?? "",
      tokenSymbol: t.symbol ?? null,
      amount,
    };
  });
}

/** Cheap activity probe for wallet alerts — counters only, no holdings. */
export async function getWalletActivity(
  address: string
): Promise<{ address: string; txCount: number | null; transferCount: number | null; label: string | null } | null> {
  try {
    const [counters, info] = await Promise.allSettled([
      bsFetch(`/addresses/${address}/counters`),
      bsFetch(`/addresses/${address}`),
    ]);
    if (counters.status !== "fulfilled" && info.status !== "fulfilled") return null;
    const c = counters.status === "fulfilled" ? counters.value : {};
    const meta = info.status === "fulfilled" ? info.value : {};
    const label =
      meta.metadata?.tags?.find((t: any) => t.tagType === "name")?.name ??
      meta.name ??
      (meta.is_contract ? "Contract" : null);
    return {
      address,
      txCount: c.transactions_count != null ? Number(c.transactions_count) : null,
      transferCount: c.token_transfers_count != null ? Number(c.token_transfers_count) : null,
      label,
    };
  } catch {
    return null;
  }
}

export async function getWalletProfile(address: string): Promise<WalletProfile | null> {
  const [info, counters, balances, transfers] = await Promise.allSettled([
    bsFetch(`/addresses/${address}`),
    bsFetch(`/addresses/${address}/counters`),
    bsFetch(`/addresses/${address}/token-balances`),
    bsFetch(`/addresses/${address}/token-transfers?type=ERC-20`),
  ]);

  if (info.status !== "fulfilled") return null;
  const meta = info.value;

  const nativePriceUsd =
    meta.exchange_rate != null && meta.exchange_rate !== "" ? Number(meta.exchange_rate) : null;
  const nativeBalance = num(meta.coin_balance) / 1e18;
  const nativeValueUsd = nativePriceUsd != null ? nativeBalance * nativePriceUsd : null;

  const holdings = balances.status === "fulfilled" ? mapHoldings(balances.value ?? []) : [];
  const recent =
    transfers.status === "fulfilled" ? mapTransfers(transfers.value?.items ?? [], address) : [];

  const holdingsValue = holdings.reduce((s, h) => s + (h.valueUsd ?? 0), 0);
  const portfolioValueUsd = holdingsValue + (nativeValueUsd ?? 0);

  const c = counters.status === "fulfilled" ? counters.value : {};
  const txCount = c.transactions_count != null ? Number(c.transactions_count) : null;
  const transferCount = c.token_transfers_count != null ? Number(c.token_transfers_count) : null;

  const label =
    meta.metadata?.tags?.find((t: any) => t.tagType === "name")?.name ??
    meta.name ??
    (meta.is_contract ? "Contract" : null);

  const cortex = scoreWallet({
    portfolioValueUsd,
    holdingsCount: holdings.length,
    txCount,
    transferCount,
    isContract: Boolean(meta.is_contract),
    reputation: meta.reputation ?? null,
  });

  const top = holdings.find((h) => h.valueUsd != null);
  const summary =
    `${address.slice(0, 6)}…${address.slice(-4)} holds ${fmtUsd(portfolioValueUsd)} across ` +
    `${holdings.length} token${holdings.length === 1 ? "" : "s"}` +
    `${txCount != null ? ` over ${txCount.toLocaleString()} transactions` : ""}` +
    `${top ? `. Largest position: ${top.symbol} (${fmtUsd(top.valueUsd)})` : ""}. ` +
    `Cortex reputation ${cortex.score}/100 (${cortex.grade})${
      cortex.tags.length ? ` · ${cortex.tags.join(", ")}` : ""
    }.`;

  return {
    address,
    isContract: Boolean(meta.is_contract),
    label,
    nativeBalance,
    nativeSymbol: "ETH",
    nativePriceUsd,
    nativeValueUsd,
    portfolioValueUsd,
    txCount,
    transferCount,
    holdings,
    recent,
    reputation: meta.reputation ?? null,
    cortex,
    explorerUrl: explorerAddressUrl(address),
    summary,
    fetchedAt: new Date().toISOString(),
  };
}
