"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { IconAperture, IconArrowUpRight, IconLock } from "@/components/brand/Icons";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Dependency-free wallet connect. Discovers installed wallets via EIP-6963
 *  (with a window.ethereum fallback) and presents a chooser modal instead of
 *  firing the browser extension immediately. Read-only: we request accounts and
 *  optionally nudge the chain — never a transaction. */

const RH_CHAIN_ID = "0x1237"; // 4663

type ProviderInfo = { uuid: string; name: string; icon: string; rdns: string };
type ProviderDetail = { info: ProviderInfo; provider: any };

const POPULAR = [
  { name: "MetaMask", url: "https://metamask.io/download/", tint: "#f6851b", letter: "M" },
  { name: "Rainbow", url: "https://rainbow.me/", tint: "#7b3fe4", letter: "R" },
  { name: "Coinbase Wallet", url: "https://www.coinbase.com/wallet/downloads", tint: "#0052ff", letter: "C" },
  { name: "Rabby", url: "https://rabby.io/", tint: "#7084ff", letter: "R" },
];

function useDiscoveredWallets() {
  const [wallets, setWallets] = useState<ProviderDetail[]>([]);
  useEffect(() => {
    const found = new Map<string, ProviderDetail>();
    const onAnnounce = (e: Event) => {
      const detail = (e as CustomEvent<ProviderDetail>).detail;
      if (!detail?.info) return;
      found.set(detail.info.uuid, detail);
      setWallets([...found.values()]);
    };
    window.addEventListener("eip6963:announceProvider", onAnnounce as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));
    // fallback for wallets that predate EIP-6963
    const t = setTimeout(() => {
      const eth = (window as any).ethereum;
      if (eth && found.size === 0) {
        found.set("legacy", {
          info: {
            uuid: "legacy",
            name: eth.isMetaMask ? "MetaMask" : eth.isRabby ? "Rabby" : "Browser Wallet",
            icon: "",
            rdns: "legacy",
          },
          provider: eth,
        });
        setWallets([...found.values()]);
      }
    }, 350);
    return () => {
      window.removeEventListener("eip6963:announceProvider", onAnnounce as EventListener);
      clearTimeout(t);
    };
  }, []);
  return wallets;
}

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const active = useRef<any>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const wallets = useDiscoveredWallets();

  useEffect(() => setMounted(true), []);

  // restore a previously authorized session silently
  useEffect(() => {
    const eth = (window as any).ethereum;
    if (!eth) return;
    eth.request({ method: "eth_accounts" }).then((a: string[]) => {
      if (a?.[0]) {
        setAddress(a[0]);
        active.current = eth;
      }
    }).catch(() => {});
    const onAccounts = (a: string[]) => setAddress(a?.[0] ?? null);
    eth.on?.("accountsChanged", onAccounts);
    return () => eth.removeListener?.("accountsChanged", onAccounts);
  }, []);

  useEffect(() => {
    if (!menu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [menu]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const connect = useCallback(async (detail: ProviderDetail) => {
    setConnecting(detail.info.uuid);
    setError(null);
    try {
      const accs: string[] = await detail.provider.request({ method: "eth_requestAccounts" });
      if (accs?.[0]) {
        setAddress(accs[0]);
        active.current = detail.provider;
        setOpen(false);
      }
      try {
        await detail.provider.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: RH_CHAIN_ID }],
        });
      } catch {
        /* chain not added or declined — connection still valid */
      }
    } catch (e: any) {
      setError(e?.code === 4001 ? "Connection rejected." : "Couldn't connect to that wallet.");
    } finally {
      setConnecting(null);
    }
  }, []);

  /* ---------- connected pill ---------- */
  if (address) {
    return (
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenu((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-hairline bg-panel/70 py-1.5 pl-2.5 pr-3 text-xs font-semibold text-fg transition-colors hover:border-lime/40"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-safe/60" />
            <span className="relative inline-flex size-2 rounded-full bg-safe" />
          </span>
          <span className="tabular">{shortAddr(address)}</span>
        </button>
        {menu && (
          <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-hairline bg-panel p-1.5 shadow-float">
            <Link
              href={`/terminal/wallet/${address}`}
              onClick={() => setMenu(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg transition-colors hover:bg-panel-2"
            >
              <IconAperture size={14} className="text-lime" /> My portfolio
            </Link>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(address);
                setMenu(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-panel-2 hover:text-fg"
            >
              Copy address
            </button>
            <button
              onClick={() => {
                setAddress(null);
                active.current = null;
                setMenu(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-panel-2 hover:text-risk"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ---------- disconnected ---------- */
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-full bg-lime px-3.5 py-1.5 text-xs font-bold text-ink-2 transition-all hover:shadow-[0_6px_24px_-8px_var(--color-lime)]"
      >
        <IconAperture size={13} /> Connect Wallet
      </button>

      {open && mounted && createPortal(
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />

          <div className="relative grid max-h-[88vh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-3xl border border-hairline bg-panel shadow-float scroll-slim md:grid-cols-[1fr_1fr]">
            {/* left: wallet list */}
            <div className="border-hairline p-6 md:border-r">
              <h2 className="text-xl font-bold tracking-tight">Connect a Wallet</h2>

              {wallets.length > 0 && (
                <>
                  <p className="mt-5 text-sm font-semibold text-lime">Installed</p>
                  <div className="mt-2 space-y-1">
                    {wallets.map((w) => (
                      <button
                        key={w.info.uuid}
                        onClick={() => connect(w)}
                        disabled={connecting !== null}
                        className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-panel-2 disabled:opacity-50"
                      >
                        {w.info.icon ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.info.icon} alt="" className="size-8 rounded-lg" />
                        ) : (
                          <span className="flex size-8 items-center justify-center rounded-lg bg-panel-2 text-xs font-bold text-fg-muted">
                            {w.info.name.slice(0, 1)}
                          </span>
                        )}
                        <span className="flex-1 text-[15px] font-semibold text-fg">{w.info.name}</span>
                        {connecting === w.info.uuid && (
                          <span className="text-xs text-fg-dim">Connecting…</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}

              <p className="mt-5 text-sm font-semibold text-fg-dim">
                {wallets.length > 0 ? "Popular" : "Get started"}
              </p>
              <div className="mt-2 space-y-1">
                {POPULAR.filter(
                  (p) => !wallets.some((w) => w.info.name.toLowerCase().includes(p.name.split(" ")[0].toLowerCase()))
                ).map((p) => (
                  <a
                    key={p.name}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex w-full items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-panel-2"
                  >
                    <span
                      className="flex size-8 items-center justify-center rounded-lg text-xs font-bold text-white"
                      style={{ background: p.tint }}
                    >
                      {p.letter}
                    </span>
                    <span className="flex-1 text-[15px] font-semibold text-fg">{p.name}</span>
                    <span className="text-[11px] text-fg-dim opacity-0 transition-opacity group-hover:opacity-100">
                      Install
                    </span>
                  </a>
                ))}
              </div>

              {error && <p className="mt-4 text-xs text-risk">{error}</p>}
              <p className="mt-5 flex items-center gap-1.5 text-[11px] text-fg-dim">
                <IconLock size={12} /> Read-only. RetinaOS never requests a transaction.
              </p>
            </div>

            {/* right: what is a wallet */}
            <div className="relative hidden flex-col items-center justify-center p-7 text-center md:flex">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-5 top-5 flex size-8 items-center justify-center rounded-full bg-panel-2 text-fg-muted transition-colors hover:text-fg"
                aria-label="Close"
              >
                ✕
              </button>

              <h3 className="text-xl font-bold tracking-tight">What is a Wallet?</h3>

              <div className="mt-8 space-y-7 text-left">
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lime/10 text-lime ring-1 ring-lime/20">
                    <IconAperture size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-fg">A home for your digital assets</h4>
                    <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                      Wallets store the tokens you hold on Robinhood Chain — and let RetinaOS show your
                      portfolio and Cortex reputation.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cortex/10 text-cortex ring-1 ring-cortex/20">
                    <IconLock size={20} />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-fg">A new way to log in</h4>
                    <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                      Instead of new accounts and passwords, connect your wallet. Your keys stay in your
                      wallet — always.
                    </p>
                  </div>
                </div>
              </div>

              <a
                href="https://ethereum.org/en/wallets/find-wallet/"
                target="_blank"
                rel="noreferrer"
                className="mt-9 rounded-full bg-lime px-6 py-2.5 text-sm font-bold text-ink-2 transition-opacity hover:opacity-90"
              >
                Get a Wallet
              </a>
              <a
                href="https://ethereum.org/en/wallets/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-lime hover:underline"
              >
                Learn More <IconArrowUpRight size={13} />
              </a>
            </div>

            {/* mobile close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 flex size-8 items-center justify-center rounded-full bg-panel-2 text-fg-muted md:hidden"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
