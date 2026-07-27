"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconSpark, IconArrowUpRight } from "@/components/brand/Icons";
import { MiniMarkdown } from "@/components/terminal/MiniMarkdown";
import { shortAddr } from "@/lib/format";
import { cn } from "@/lib/utils";

type Citation = { type: string; address: string };
type Result =
  | { kind: "answer"; answer: string; citations: Citation[]; provider?: string }
  | { kind: "notice"; message: string }
  | { kind: "error"; message: string };

const EXAMPLES = [
  "What's trending on Robinhood Chain right now?",
  "Which new tokens look riskiest and why?",
  "Summarize WOOD — liquidity, holders, and Cortex risk",
  "What are the highest-volume tokens today?",
];

function contextFromPath(path: string | null): { tokenAddress?: string; walletAddress?: string } {
  if (!path) return {};
  const tok = path.match(/\/terminal\/token\/(0x[0-9a-fA-F]{40})/);
  if (tok) return { tokenAddress: tok[1] };
  const wal = path.match(/\/terminal\/wallet\/(0x[0-9a-fA-F]{40})/);
  if (wal) return { walletAddress: wal[1] };
  return {};
}

export function AnalystPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pathname = usePathname();

  // ⌘K / Ctrl+K toggle, Esc close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("retina:open-analyst", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("retina:open-analyst", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
  }, [open]);

  const ask = useCallback(
    async (question: string) => {
      if (!question.trim() || loading) return;
      setLoading(true);
      setResult(null);
      try {
        const res = await fetch("/api/terminal/analyst", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, context: contextFromPath(pathname) }),
        });
        const data = await res.json();
        if (data.error === "no_key") setResult({ kind: "notice", message: data.message });
        else if (data.error) setResult({ kind: "error", message: data.message ?? "Something went wrong." });
        else
          setResult({
            kind: "answer",
            answer: data.answer,
            citations: data.citations ?? [],
            provider: data.provider,
          });
      } catch {
        setResult({ kind: "error", message: "Couldn't reach the analyst." });
      } finally {
        setLoading(false);
      }
    },
    [loading, pathname]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />

      <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-hairline bg-panel shadow-float">
        {/* input */}
        <div className="flex items-start gap-3 border-b border-hairline p-4">
          <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-cortex/10 text-cortex">
            <IconSpark size={16} />
          </span>
          <textarea
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                ask(q);
              }
            }}
            rows={1}
            placeholder="Ask the AI Market Analyst about tokens, wallets, or market activity…"
            className="max-h-32 flex-1 resize-none bg-transparent py-1 text-sm text-fg outline-none placeholder:text-fg-dim"
          />
          <kbd className="mt-1 rounded bg-panel-2 px-1.5 py-0.5 text-[10px] text-fg-dim">esc</kbd>
        </div>

        {/* body */}
        <div className="max-h-[52vh] overflow-y-auto scroll-slim p-4">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-fg-muted">
              <span className="size-1.5 animate-ping rounded-full bg-cortex" />
              Analyzing live Robinhood Chain data…
            </div>
          ) : result?.kind === "answer" ? (
            <div>
              <MiniMarkdown text={result.answer} />
              {result.citations.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-hairline pt-4">
                  <span className="text-[11px] uppercase tracking-wide text-fg-dim">Verify</span>
                  {result.citations.map((c) => (
                    <Link
                      key={`${c.type}:${c.address}`}
                      href={`/terminal/${c.type}/${c.address}`}
                      onClick={() => setOpen(false)}
                      className="inline-flex items-center gap-1 rounded-lg bg-panel-2 px-2 py-1 text-xs text-fg-muted transition-colors hover:text-lime"
                    >
                      {c.type} {shortAddr(c.address)} <IconArrowUpRight size={11} />
                    </Link>
                  ))}
                </div>
              )}
              <p className="mt-4 text-[11px] text-fg-dim">
                Grounded in live on-chain data · not financial advice, no price predictions.
                {result.provider && <> · via {result.provider}</>}
              </p>
            </div>
          ) : result?.kind === "notice" ? (
            <div className="rounded-xl border border-wallet/25 bg-wallet/10 px-4 py-3 text-sm text-wallet">
              {result.message}
            </div>
          ) : result?.kind === "error" ? (
            <div className="rounded-xl border border-risk/25 bg-risk/10 px-4 py-3 text-sm text-risk">
              {result.message}
            </div>
          ) : (
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-fg-dim">Try asking</p>
              <div className="space-y-1">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => {
                      setQ(ex);
                      ask(ex);
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm text-fg-muted transition-colors hover:bg-panel-2 hover:text-fg"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-hairline px-4 py-2 text-[11px] text-fg-dim">
          <span>AI Market Analyst · grounded on Robinhood Chain</span>
          <span className="flex items-center gap-1">
            <kbd className="rounded bg-panel-2 px-1.5 py-0.5">↵</kbd> to ask
          </span>
        </div>
      </div>
    </div>
  );
}

/** Small trigger usable in the header. */
export function AnalystTrigger({ className }: { className?: string }) {
  return (
    <button
      onClick={() => window.dispatchEvent(new Event("retina:open-analyst"))}
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-hairline bg-panel/60 px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:border-cortex/40 hover:text-fg",
        className
      )}
    >
      <IconSpark size={14} className="text-cortex" />
      Ask AI
      <kbd className="ml-0.5 rounded bg-panel-2 px-1 text-[10px] text-fg-dim">⌘K</kbd>
    </button>
  );
}
