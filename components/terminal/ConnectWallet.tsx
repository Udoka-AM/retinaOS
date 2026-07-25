"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { IconAperture } from "@/components/brand/Icons";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Dependency-free injected wallet connect (EIP-1193). Reads the connected
 *  address so a user can jump to their own wallet page; attempts to switch the
 *  wallet to Robinhood Chain. No transactions are ever requested here. */

const RH_CHAIN_ID = "0x1237"; // 4663

function getEth(): any {
  return typeof window !== "undefined" ? (window as any).ethereum : undefined;
}

export function ConnectWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // silent restore + account change subscription
  useEffect(() => {
    const eth = getEth();
    if (!eth) return;
    eth
      .request({ method: "eth_accounts" })
      .then((accs: string[]) => accs?.[0] && setAddress(accs[0]))
      .catch(() => {});
    const onAccounts = (accs: string[]) => setAddress(accs?.[0] ?? null);
    eth.on?.("accountsChanged", onAccounts);
    return () => eth.removeListener?.("accountsChanged", onAccounts);
  }, []);

  // close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const connect = useCallback(async () => {
    const eth = getEth();
    if (!eth) {
      setNote("No browser wallet detected");
      setTimeout(() => setNote(null), 3000);
      return;
    }
    setConnecting(true);
    try {
      const accs: string[] = await eth.request({ method: "eth_requestAccounts" });
      if (accs?.[0]) setAddress(accs[0]);
      // best-effort: nudge the wallet onto Robinhood Chain (ignore if unsupported)
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: RH_CHAIN_ID }],
        });
      } catch {
        /* chain not added / user declined — connection still valid */
      }
    } catch {
      /* user rejected */
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = () => {
    setAddress(null);
    setOpen(false);
  };

  if (!address) {
    return (
      <button
        onClick={connect}
        disabled={connecting}
        title="Connect a browser wallet (MetaMask, Rabby…)"
        className="flex items-center gap-1.5 rounded-full border border-lime/30 bg-lime/10 px-3 py-1.5 text-xs font-semibold text-lime transition-colors hover:bg-lime/15 disabled:opacity-60"
      >
        <IconAperture size={14} />
        {connecting ? "Connecting…" : note ?? "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 px-3 py-1.5 text-xs font-semibold text-fg transition-colors hover:border-lime/40"
      >
        <span className="size-1.5 rounded-full bg-safe" />
        <span className="tabular">{shortAddr(address)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-48 rounded-xl border border-hairline bg-panel p-1.5 shadow-float">
          <Link
            href={`/terminal/wallet/${address}`}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-fg transition-colors hover:bg-panel-2"
            )}
          >
            <IconAperture size={14} className="text-lime" /> View my portfolio
          </Link>
          <button
            onClick={disconnect}
            className="w-full rounded-lg px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-panel-2 hover:text-risk"
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
