/** AI provider abstraction for the Market Analyst.
 *
 *  Priority: Anthropic (Claude) → Gemini → Groq. Setting ANTHROPIC_API_KEY is
 *  all it takes to revert to Claude — no code changes. Until then the free
 *  tiers keep the feature alive.
 *
 *  Both free providers are used through their OpenAI-compatible endpoints, so
 *  they share a single code path. Function calling is required (the analyst is
 *  grounded by a tool loop), which is why these two were chosen.
 */

export type ProviderId = "anthropic" | "gemini" | "groq";

export interface ProviderConfig {
  id: ProviderId;
  label: string;
  model: string;
  /** OpenAI-compatible providers only */
  baseURL?: string;
  apiKey: string;
}

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/openai/";
const GROQ_BASE = "https://api.groq.com/openai/v1";

export function resolveProvider(): ProviderConfig | null {
  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) {
    return {
      id: "anthropic",
      label: "Claude",
      model: process.env.ANTHROPIC_MODEL || "claude-opus-4-8",
      apiKey: anthropic,
    };
  }

  const gemini = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (gemini) {
    return {
      id: "gemini",
      label: "Gemini",
      // override with GEMINI_MODEL if Google renames the free-tier flash model
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
      baseURL: GEMINI_BASE,
      apiKey: gemini,
    };
  }

  const groq = process.env.GROQ_API_KEY;
  if (groq) {
    return {
      id: "groq",
      label: "Groq",
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      baseURL: GROQ_BASE,
      apiKey: groq,
    };
  }

  return null;
}

export const NO_KEY_MESSAGE =
  "The AI Analyst needs an API key. Free options: set GEMINI_API_KEY (Google AI Studio — ~1,500 requests/day, no card) or GROQ_API_KEY (console.groq.com). Set ANTHROPIC_API_KEY to switch back to Claude. Add it to .env.local locally, or your Vercel project settings.";
