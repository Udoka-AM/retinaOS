"use client";

import { useEffect, useRef } from "react";
import type { DiscoveryFeedResult } from "@/lib/data";
import {
  getRules,
  saveRules,
  pushTriggered,
  tokenMatches,
  describeFilter,
  shortWallet,
  type AlertRule,
  type TriggeredAlert,
} from "@/lib/alerts";

const TICK_MS = 15_000;

function notify(t: TriggeredAlert) {
  pushTriggered(t);
  if (typeof Notification !== "undefined" && Notification.permission === "granted") {
    try {
      const n = new Notification(t.title, { body: t.detail, tag: t.id });
      n.onclick = () => {
        window.focus();
        window.location.href = t.href;
        n.close();
      };
    } catch {
      /* ignore */
    }
  }
}

/** Global, invisible: evaluates alert rules against live data on an interval. */
export function AlertsEngine() {
  const running = useRef(false);

  useEffect(() => {
    async function tick() {
      if (running.current) return;
      running.current = true;
      try {
        const rules = getRules().filter((r) => r.enabled);
        if (rules.length === 0) return;
        let mutated = false;
        const next = getRules();

        // token rules — one feed fetch per distinct view
        const tokenViews = [...new Set(rules.filter((r) => r.kind === "token").map((r) => r.filter!.view))];
        const feeds = new Map<string, DiscoveryFeedResult>();
        await Promise.all(
          tokenViews.map(async (view) => {
            try {
              const res = await fetch(`/api/terminal/feed?view=${view}`, { cache: "no-store" });
              if (res.ok) feeds.set(view, await res.json());
            } catch {
              /* ignore */
            }
          })
        );

        for (const rule of rules) {
          const idx = next.findIndex((r) => r.id === rule.id);
          if (idx < 0) continue;

          if (rule.kind === "token" && rule.filter) {
            const feed = feeds.get(rule.filter.view);
            if (!feed) continue;
            const seen = new Set(next[idx].seen);
            for (const t of feed.tokens) {
              if (!tokenMatches(t, rule.filter)) continue;
              const key = t.address || t.poolAddress;
              if (seen.has(key)) continue;
              seen.add(key);
              notify({
                id: `${rule.id}-${key}-${Date.now()}`,
                ruleId: rule.id,
                at: Date.now(),
                kind: "token",
                title: `${t.symbol} matched your alert`,
                detail: `${rule.label} — ${describeFilter(rule.filter)}`,
                href: `/terminal/token/${key}`,
              });
            }
            next[idx] = { ...next[idx], seen: [...seen].slice(-200) };
            mutated = true;
          }

          if (rule.kind === "wallet" && rule.walletAddress) {
            try {
              const res = await fetch(`/api/terminal/wallet-activity?address=${rule.walletAddress}`, {
                cache: "no-store",
              });
              if (!res.ok) continue;
              const a = await res.json();
              const count: number | null = a.transferCount ?? a.txCount ?? null;
              if (count == null) continue;
              const base = next[idx].baseline;
              if (base == null) {
                next[idx] = { ...next[idx], baseline: count };
              } else if (count > base) {
                notify({
                  id: `${rule.id}-${count}-${Date.now()}`,
                  ruleId: rule.id,
                  at: Date.now(),
                  kind: "wallet",
                  title: `New activity: ${shortWallet(rule.walletAddress)}`,
                  detail: `${count - base} new transfer(s) since last check.`,
                  href: `/terminal/wallet/${rule.walletAddress}`,
                });
                next[idx] = { ...next[idx], baseline: count };
              }
              mutated = true;
            } catch {
              /* ignore */
            }
          }
        }

        if (mutated) saveRules(next as AlertRule[]);
      } finally {
        running.current = false;
      }
    }

    const id = setInterval(tick, TICK_MS);
    const first = setTimeout(tick, 3000);
    return () => {
      clearInterval(id);
      clearTimeout(first);
    };
  }, []);

  return null;
}
