import { getDiscoveryFeed, getOhlcv, getTrades } from "./geckoterminal";
import { getTokenDetail } from "./detail";
import { getWalletProfile } from "./blockscout";
import type {
  DiscoveryFeedResult,
  FeedView,
  OhlcvPoint,
  OhlcvTimeframe,
  TokenDetail,
  Trade,
  WalletProfile,
} from "./types";

/** The provider seam. Swapping or augmenting data sources (Cortex for real
 *  scores, a fallback mock, our own indexer) happens behind this interface
 *  without the UI changing. */
export interface TerminalDataProvider {
  getDiscoveryFeed(view?: FeedView): Promise<DiscoveryFeedResult>;
  getTokenDetail(address: string): Promise<TokenDetail | null>;
  getOhlcv(pool: string, tf?: OhlcvTimeframe): Promise<OhlcvPoint[]>;
  getTrades(pool: string, limit?: number): Promise<Trade[]>;
  getWalletProfile(address: string): Promise<WalletProfile | null>;
}

export const provider: TerminalDataProvider = {
  getDiscoveryFeed,
  getTokenDetail,
  getOhlcv,
  getTrades,
  getWalletProfile,
};

export * from "./types";
