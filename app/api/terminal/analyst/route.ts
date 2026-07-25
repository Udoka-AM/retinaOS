import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { provider, type FeedView } from "@/lib/data";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = "claude-opus-4-8";
const MAX_ITERS = 6;

const SYSTEM = `You are the Retina Terminal AI Market Analyst for Robinhood Chain (an EVM chain).
Your job: answer the user's question about tokens, wallets, and market activity, grounded ONLY in
data returned by your tools. This is on-chain intelligence, not advice.

Rules:
- Use the tools to fetch live data before answering. Never invent numbers, addresses, prices, or names.
- If the tools don't contain the answer, say so plainly rather than guessing.
- Do NOT give financial advice, buy/sell recommendations, or price predictions/forecasts. Describe what
  the on-chain data shows and let the user decide. If asked for advice, explain you surface data, not advice.
- Be concise and specific. Lead with the direct answer, then the evidence (the concrete figures you used:
  liquidity, volume, holder concentration, Cortex score, etc.). Reference tokens/wallets by symbol and short address.
- "Cortex" scores are RetinaOS's own risk (token, higher = riskier) and reputation (wallet, higher = better) models.
- Keep it to a few short paragraphs. No hype, no emojis.`;

const tools: Anthropic.Tool[] = [
  {
    name: "search_tokens",
    description:
      "List tokens on Robinhood Chain from the live discovery feed. Use to find tokens, get their contract addresses, or scan the market by trending / newest / top-volume.",
    input_schema: {
      type: "object",
      properties: {
        view: {
          type: "string",
          enum: ["trending", "new", "top"],
          description: "trending (default), new (newest launches), or top (highest 24h volume)",
        },
        query: { type: "string", description: "Optional symbol/name filter (case-insensitive substring)" },
      },
    },
  },
  {
    name: "get_token",
    description:
      "Deep detail for one token: price, liquidity, volume, holders & top-holder concentration, Cortex risk score with flags, and recent trade count. Accepts a 0x contract address (preferred) or a symbol.",
    input_schema: {
      type: "object",
      properties: { addressOrSymbol: { type: "string" } },
      required: ["addressOrSymbol"],
    },
  },
  {
    name: "get_wallet",
    description:
      "Profile for one wallet address: portfolio value, holdings, transaction/transfer counts, and Cortex reputation score with behavioral tags. Accepts a 0x address.",
    input_schema: {
      type: "object",
      properties: { address: { type: "string" } },
      required: ["address"],
    },
  },
];

const isAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s.trim());

async function runTool(name: string, input: any, cites: Set<string>): Promise<string> {
  try {
    if (name === "search_tokens") {
      const view = (["trending", "new", "top"].includes(input?.view) ? input.view : "trending") as FeedView;
      const feed = await provider.getDiscoveryFeed(view);
      let toks = feed.tokens;
      if (input?.query) {
        const q = String(input.query).toLowerCase();
        toks = toks.filter((t) => t.symbol.toLowerCase().includes(q) || t.name.toLowerCase().includes(q));
      }
      return JSON.stringify({
        view,
        count: toks.length,
        tokens: toks.slice(0, 25).map((t) => ({
          symbol: t.symbol,
          name: t.name,
          address: t.address,
          dex: t.dex,
          priceUsd: t.priceUsd,
          marketCapUsd: t.marketCapUsd,
          liquidityUsd: t.liquidityUsd,
          volume24hUsd: t.volume24hUsd,
          change24hPct: t.priceChange.h24,
          buys24h: t.txns24h.buys,
          sells24h: t.txns24h.sells,
          feedRiskScore: t.risk.score,
          ageHours: t.ageMs != null ? Math.round(t.ageMs / 3.6e6) : null,
        })),
      });
    }

    if (name === "get_token") {
      let address = String(input?.addressOrSymbol ?? "").trim();
      if (!isAddress(address)) {
        const feed = await provider.getDiscoveryFeed("top");
        const match = feed.tokens.find((t) => t.symbol.toLowerCase() === address.toLowerCase());
        if (!match) return JSON.stringify({ error: `No token matched "${address}". Call search_tokens to find its address.` });
        address = match.address;
      }
      const d = await provider.getTokenDetail(address);
      if (!d) return JSON.stringify({ error: "Token not found or data unavailable." });
      cites.add(`token:${d.address}`);
      return JSON.stringify({
        symbol: d.symbol,
        name: d.name,
        address: d.address,
        dex: d.dex,
        priceUsd: d.priceUsd,
        marketCapUsd: d.marketCapUsd,
        fdvUsd: d.fdvUsd,
        liquidityUsd: d.liquidityUsd,
        volume24hUsd: d.volume24hUsd,
        priceChange: d.priceChange,
        txns24h: d.txns24h,
        ageHours: d.ageMs != null ? Math.round(d.ageMs / 3.6e6) : null,
        holders: d.onchain.holders,
        top10ConcentrationPct: d.onchain.concentrationTop10,
        topHolders: d.onchain.topHolders.slice(0, 6).map((h) => ({ address: h.address, pct: h.pct, label: h.label })),
        cortexRisk: {
          score: d.cortex.score,
          grade: d.cortex.grade,
          level: d.cortex.level,
          flags: d.cortex.flags,
          subs: d.cortex.subs.map((s) => ({ label: s.label, score: s.score })),
        },
        recentTradeCount: d.trades.length,
      });
    }

    if (name === "get_wallet") {
      const address = String(input?.address ?? "").trim();
      if (!isAddress(address)) return JSON.stringify({ error: "Provide a 0x wallet address." });
      const w = await provider.getWalletProfile(address);
      if (!w) return JSON.stringify({ error: "Wallet not found or data unavailable." });
      cites.add(`wallet:${w.address}`);
      return JSON.stringify({
        address: w.address,
        isContract: w.isContract,
        label: w.label,
        portfolioValueUsd: w.portfolioValueUsd,
        nativeBalance: w.nativeBalance,
        txCount: w.txCount,
        transferCount: w.transferCount,
        holdings: w.holdings.slice(0, 10).map((h) => ({ symbol: h.symbol, address: h.address, valueUsd: h.valueUsd })),
        cortexReputation: {
          score: w.cortex.score,
          grade: w.cortex.grade,
          tags: w.cortex.tags,
          subs: w.cortex.subs.map((s) => ({ label: s.label, score: s.score })),
          flags: w.cortex.flags,
        },
      });
    }
    return JSON.stringify({ error: `Unknown tool ${name}` });
  } catch (err) {
    return JSON.stringify({ error: err instanceof Error ? err.message : "tool failed" });
  }
}

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error: "no_key",
        message:
          "The AI Analyst needs an Anthropic API key. Set ANTHROPIC_API_KEY in your environment (.env.local locally, or the Vercel project settings) to enable it.",
      },
      { status: 200 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const question: string = (body?.question ?? "").toString().slice(0, 800);
  const context = body?.context ?? {};
  if (!question.trim()) {
    return NextResponse.json({ error: "empty", message: "Ask a question." }, { status: 400 });
  }

  const client = new Anthropic();
  const cites = new Set<string>();

  const ctxNote =
    context?.tokenAddress
      ? `\n\n[The user is currently viewing token ${context.tokenAddress}.]`
      : context?.walletAddress
      ? `\n\n[The user is currently viewing wallet ${context.walletAddress}.]`
      : "";

  const messages: Anthropic.MessageParam[] = [
    { role: "user", content: question + ctxNote },
  ];

  try {
    for (let i = 0; i < MAX_ITERS; i++) {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 3000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        system: SYSTEM,
        tools,
        messages,
      } as any);

      if (res.stop_reason !== "tool_use") {
        const answer = res.content
          .filter((b: any) => b.type === "text")
          .map((b: any) => b.text)
          .join("\n")
          .trim();
        const citations = [...cites].map((c) => {
          const [type, address] = c.split(":");
          return { type, address };
        });
        return NextResponse.json({ answer: answer || "No answer produced.", citations });
      }

      messages.push({ role: "assistant", content: res.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of res.content as any[]) {
        if (block.type === "tool_use") {
          const out = await runTool(block.name, block.input, cites);
          toolResults.push({ type: "tool_result", tool_use_id: block.id, content: out });
        }
      }
      messages.push({ role: "user", content: toolResults });
    }
    return NextResponse.json({
      answer: "I couldn't finish analyzing that in time — try a more specific question.",
      citations: [],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "analyst error";
    return NextResponse.json({ error: "failed", message: msg }, { status: 502 });
  }
}
