/**
 * Recipe: CoinGecko Global Market Dominance
 * Scrapes global crypto market data including BTC/ETH dominance, market cap, volume.
 * Data is extracted from the CoinGecko header bar and global charts page.
 *
 * URL: https://www.coingecko.com/en/global-charts
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/global_dominance.ts
 *   npx tsx coingecko/global_dominance.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

export interface GlobalDominance {
  total_market_cap: string;
  market_cap_change: string;
  total_volume_24h: string;
  btc_dominance: string;
  eth_dominance: string;
  coins: string;
  exchanges: string;
  gas: string;
}

/**
 * CoinGecko header bar format:
 *   Coins: [17,865](url)
 *   Exchanges: [1,463](url)
 *   Market Cap: [$2.378T](url) 0.8%
 *   24h Vol: [$82.017B](url)
 *   Dominance:
 *   [BTC 56.1%](url) [ETH 10.4%](url)
 *   Gas: 0.184 GWEI
 */
export function parseGlobalDominance(markdown: string): GlobalDominance {
  const result: GlobalDominance = {
    total_market_cap: "",
    market_cap_change: "",
    total_volume_24h: "",
    btc_dominance: "",
    eth_dominance: "",
    coins: "",
    exchanges: "",
    gas: "",
  };

  // Market Cap: [$2.378T](url) 0.8%
  const mcapMatch = markdown.match(/Market Cap:\s*\[\$([^\]]+)\]/);
  if (mcapMatch) result.total_market_cap = "$" + mcapMatch[1].trim();

  const mcapChangeMatch = markdown.match(/Market Cap:\s*\[[^\]]+\]\([^)]+\)\s*([\d.]+%)/);
  if (mcapChangeMatch) result.market_cap_change = mcapChangeMatch[1];

  // 24h Vol: [$82.017B](url)
  const volMatch = markdown.match(/24h Vol:\s*\[\$([^\]]+)\]/);
  if (volMatch) result.total_volume_24h = "$" + volMatch[1].trim();

  // [BTC 56.1%](url)
  const btcMatch = markdown.match(/\[BTC\s+([\d.]+%)\]/);
  if (btcMatch) result.btc_dominance = btcMatch[1];

  // [ETH 10.4%](url)
  const ethMatch = markdown.match(/\[ETH\s+([\d.]+%)\]/);
  if (ethMatch) result.eth_dominance = ethMatch[1];

  // Coins: [17,865](url)
  const coinsMatch = markdown.match(/Coins:\s*\[([\d,]+)\]/);
  if (coinsMatch) result.coins = coinsMatch[1];

  // Exchanges: [1,463](url)
  const exMatch = markdown.match(/Exchanges:\s*\[([\d,]+)\]/);
  if (exMatch) result.exchanges = exMatch[1];

  // Gas: 0.184 GWEI
  const gasMatch = markdown.match(/Gas:\s*([\d.]+\s*GWEI)/i);
  if (gasMatch) result.gas = gasMatch[1];

  return result;
}

async function main() {
  const debug = process.argv.includes("--debug");
  console.log("Fetching global market dominance from CoinGecko...\n");

  const data = await browse("https://www.coingecko.com/en/global-charts");
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const dominance = parseGlobalDominance(md);
  console.log(JSON.stringify(dominance, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("global_dominance.ts") || process.argv[1]?.endsWith("global_dominance.js");
if (isDirectRun) main();
