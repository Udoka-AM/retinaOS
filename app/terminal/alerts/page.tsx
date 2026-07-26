"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { FeedView } from "@/lib/data";
import {
  addRule,
  removeRule,
  toggleRule,
  getRules,
  getLog,
  describeFilter,
  tokenMatches,
  shortWallet,
  FREE_TIER_LIMIT,
  ALERTS_CHANGED,
  type AlertRule,
  type TokenFilter,
  type TriggeredAlert,
} from "@/lib/alerts";
import { IconRadar, IconReticle, IconAperture } from "@/components/brand/Icons";
import { cn } from "@/lib/utils";

function ago(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export default function AlertsPage() {
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [log, setLog] = useState<TriggeredAlert[]>([]);
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">("default");
  const [tab, setTab] = useState<"token" | "wallet">("token");
  const [account, setAccount] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      setRules(getRules());
      setLog(getLog());
    };
    sync();
    setPerm(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
    window.addEventListener(ALERTS_CHANGED, sync);
    const id = setInterval(sync, 5000); // refresh "ago" + pick up engine writes
    return () => {
      window.removeEventListener(ALERTS_CHANGED, sync);
      clearInterval(id);
    };
  }, []);

  // connected wallet (from the header's injected connect)
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((a: string[]) => setAccount(a?.[0] ?? null)).catch(() => {});
    const onAccounts = (a: string[]) => setAccount(a?.[0] ?? null);
    eth.on?.("accountsChanged", onAccounts);
    return () => eth.removeListener?.("accountsChanged", onAccounts);
  }, []);

  const atLimit = rules.length >= FREE_TIER_LIMIT;
  const watchingSelf =
    !!account && rules.some((r) => r.kind === "wallet" && r.walletAddress?.toLowerCase() === account.toLowerCase());

  function watchMyWallet() {
    if (!account || atLimit || watchingSelf) return;
    addRule({
      id: crypto.randomUUID(),
      kind: "wallet",
      label: "My wallet",
      createdAt: Date.now(),
      enabled: true,
      walletAddress: account,
      seen: [],
      baseline: null,
    });
  }

  async function requestPerm() {
    if (typeof Notification === "undefined") return;
    const p = await Notification.requestPermission();
    setPerm(p);
  }

  return (
    <div className="w-full px-3 py-3">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <IconRadar size={22} className="text-wallet" /> Alerts
          </h1>
          <p className="mt-1 text-sm text-fg-muted">
            Get notified when tokens match your filters or a wallet moves.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular text-xs text-fg-dim">
            {rules.length}/{FREE_TIER_LIMIT} alerts · Free tier
          </span>
          {account && !watchingSelf && !atLimit && (
            <button
              onClick={watchMyWallet}
              className="flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1.5 text-xs font-semibold text-lime transition-colors hover:bg-lime/15"
            >
              <IconAperture size={13} /> Watch my wallet
            </button>
          )}
          {perm !== "granted" && perm !== "unsupported" && (
            <button
              onClick={requestPerm}
              className="rounded-full border border-wallet/30 bg-wallet/10 px-3 py-1.5 text-xs font-semibold text-wallet transition-colors hover:bg-wallet/15"
            >
              Enable notifications
            </button>
          )}
          {perm === "granted" && (
            <span className="flex items-center gap-1.5 rounded-full border border-safe/30 bg-safe/10 px-2.5 py-1 text-[11px] font-semibold text-safe">
              <span className="size-1.5 rounded-full bg-safe" /> Notifications on
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid gap-2 lg:grid-cols-[1fr_380px]">
        {/* create + list */}
        <div className="space-y-2">
          <CreateForm tab={tab} setTab={setTab} atLimit={atLimit} connectedWallet={account} />

          <div className="rounded-2xl border border-hairline bg-panel/30">
            <div className="border-b border-hairline px-4 py-3 text-sm font-semibold">Active alerts</div>
            {rules.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-fg-dim">
                No alerts yet. Create one above.
              </div>
            ) : (
              <div className="divide-y divide-hairline/60">
                {rules.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-lg ring-1",
                        r.kind === "token" ? "bg-lime/10 text-lime ring-lime/20" : "bg-wallet/10 text-wallet ring-wallet/20"
                      )}
                    >
                      {r.kind === "token" ? <IconReticle size={16} /> : <IconAperture size={16} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-fg">
                        {r.kind === "token" ? "Token filter" : `Wallet ${shortWallet(r.walletAddress!)}`}
                      </div>
                      <div className="truncate text-xs text-fg-dim">
                        {r.kind === "token" && r.filter ? describeFilter(r.filter) : "Any new on-chain activity"}
                      </div>
                    </div>
                    <button
                      onClick={() => toggleRule(r.id)}
                      className={cn(
                        "rounded-full px-2 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
                        r.enabled ? "bg-safe/10 text-safe" : "bg-panel text-fg-dim"
                      )}
                    >
                      {r.enabled ? "On" : "Off"}
                    </button>
                    <button
                      onClick={() => removeRule(r.id)}
                      className="text-fg-dim transition-colors hover:text-risk"
                      aria-label="Delete"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] leading-relaxed text-fg-dim">
            Alerts run in your browser while the Terminal is open and fire local notifications.
            Always-on delivery (email &amp; push when closed), cross-device sync, and holder-growth
            /reputation filters arrive with the indexer backend.
          </p>
        </div>

        {/* recent triggers */}
        <div className="rounded-2xl border border-hairline bg-panel/30">
          <div className="border-b border-hairline px-4 py-3 text-sm font-semibold">Recent triggers</div>
          {log.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-fg-dim">Nothing yet.</div>
          ) : (
            <div className="max-h-[520px] divide-y divide-hairline/60 overflow-y-auto scroll-slim">
              {log.map((t) => (
                <Link
                  key={t.id}
                  href={t.href}
                  className="block px-4 py-3 transition-colors hover:bg-panel/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-fg">{t.title}</span>
                    <span className="tabular shrink-0 text-[11px] text-fg-dim">{ago(t.at)}</span>
                  </div>
                  <div className="mt-0.5 truncate text-xs text-fg-dim">{t.detail}</div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- create form ---------- */

function CreateForm({
  tab,
  setTab,
  atLimit,
  connectedWallet,
}: {
  tab: "token" | "wallet";
  setTab: (t: "token" | "wallet") => void;
  atLimit: boolean;
  connectedWallet?: string | null;
}) {
  const [view, setView] = useState<FeedView>("new");
  const [minLiq, setMinLiq] = useState(0);
  const [minVol, setMinVol] = useState(0);
  const [minMcap, setMinMcap] = useState(0);
  const [maxAge, setMaxAge] = useState(0);
  const [minChg, setMinChg] = useState<number | undefined>(undefined);
  const [lowRisk, setLowRisk] = useState(true);
  const [addr, setAddr] = useState("");
  const [busy, setBusy] = useState(false);

  const filter: TokenFilter = useMemo(
    () => ({
      view,
      minLiquidityUsd: minLiq || undefined,
      minVolume24hUsd: minVol || undefined,
      minMarketCapUsd: minMcap || undefined,
      maxAgeHours: maxAge || undefined,
      minChange24hPct: minChg,
      excludeHighRisk: lowRisk,
    }),
    [view, minLiq, minVol, minMcap, maxAge, minChg, lowRisk]
  );

  async function createToken() {
    if (atLimit || busy) return;
    setBusy(true);
    let seen: string[] = [];
    try {
      const res = await fetch(`/api/terminal/feed?view=${view}`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        seen = data.tokens
          .filter((t: any) => tokenMatches(t, filter))
          .map((t: any) => t.address || t.poolAddress);
      }
    } catch {
      /* ignore */
    }
    addRule({
      id: crypto.randomUUID(),
      kind: "token",
      label: describeFilter(filter),
      createdAt: Date.now(),
      enabled: true,
      filter,
      seen,
    });
    setBusy(false);
  }

  function createWallet() {
    if (atLimit || !/^0x[0-9a-fA-F]{40}$/.test(addr.trim())) return;
    addRule({
      id: crypto.randomUUID(),
      kind: "wallet",
      label: "Wallet activity",
      createdAt: Date.now(),
      enabled: true,
      walletAddress: addr.trim(),
      seen: [],
      baseline: null,
    });
    setAddr("");
  }

  return (
    <div className="rounded-2xl border border-hairline bg-panel/30 p-4">
      <div className="mb-4 flex gap-1">
        {(["token", "wallet"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-semibold capitalize transition-colors",
              tab === t ? "bg-panel-2 text-fg" : "text-fg-dim hover:text-fg-muted"
            )}
          >
            {t === "token" ? "Token filter" : "Wallet watch"}
          </button>
        ))}
      </div>

      {tab === "token" ? (
        <div className="space-y-4">
          <Pills label="Scan" value={view} onChange={(v) => setView(v as FeedView)}
            options={[["trending", "Trending"], ["new", "New launches"], ["top", "Top volume"]]} />
          <Pills label="Max age" value={maxAge} onChange={setMaxAge}
            options={[[0, "Any"], [1, "1h"], [6, "6h"], [24, "24h"], [168, "7d"]]} />
          <Pills label="Min liquidity" value={minLiq} onChange={setMinLiq}
            options={[[0, "Any"], [1000, "$1K"], [10000, "$10K"], [50000, "$50K"], [100000, "$100K"]]} />
          <Pills label="Min 24h volume" value={minVol} onChange={setMinVol}
            options={[[0, "Any"], [10000, "$10K"], [100000, "$100K"], [1000000, "$1M"]]} />
          <Pills label="Min market cap" value={minMcap} onChange={setMinMcap}
            options={[[0, "Any"], [100000, "$100K"], [1000000, "$1M"], [10000000, "$10M"]]} />
          <Pills label="Min 24h change" value={minChg ?? -1} onChange={(v) => setMinChg(v < 0 ? undefined : v)}
            options={[[-1, "Any"], [10, "+10%"], [50, "+50%"], [100, "+100%"]]} />
          <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg-muted">
            <input type="checkbox" checked={lowRisk} onChange={(e) => setLowRisk(e.target.checked)} className="size-4 accent-lime" />
            Exclude high / critical risk
          </label>
          <button
            onClick={createToken}
            disabled={atLimit || busy}
            className="w-full rounded-xl bg-lime py-2.5 text-sm font-bold text-ink-2 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {atLimit ? "Free-tier limit reached (Pro is unlimited)" : busy ? "Creating…" : "Create token alert"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <input
            value={addr}
            onChange={(e) => setAddr(e.target.value)}
            placeholder="0x wallet address to watch…"
            className="tabular w-full rounded-xl border border-hairline bg-panel/50 px-3 py-2 text-sm text-fg outline-none placeholder:text-fg-dim focus:border-lime/50"
          />
          {connectedWallet && addr.trim().toLowerCase() !== connectedWallet.toLowerCase() && (
            <button
              onClick={() => setAddr(connectedWallet)}
              className="tabular text-xs text-lime transition-opacity hover:opacity-80"
            >
              Use my connected wallet ({connectedWallet.slice(0, 6)}…{connectedWallet.slice(-4)})
            </button>
          )}
          <button
            onClick={createWallet}
            disabled={atLimit || !/^0x[0-9a-fA-F]{40}$/.test(addr.trim())}
            className="w-full rounded-xl bg-wallet py-2.5 text-sm font-bold text-ink-2 transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {atLimit ? "Free-tier limit reached (Pro is unlimited)" : "Watch this wallet"}
          </button>
          <p className="text-[11px] text-fg-dim">Fires when the wallet's transfer count increases.</p>
        </div>
      )}
    </div>
  );
}

function Pills<T extends string | number>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-medium text-fg-dim">{label}</label>
      <div className="flex flex-wrap gap-1.5">
        {options.map(([v, l]) => (
          <button
            key={String(v)}
            onClick={() => onChange(v)}
            className={cn(
              "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
              value === v ? "border-lime/40 bg-lime/10 text-lime" : "border-hairline text-fg-dim hover:text-fg-muted"
            )}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
