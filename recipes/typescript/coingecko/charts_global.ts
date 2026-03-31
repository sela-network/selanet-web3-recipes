/**
 * Recipe: Global Charts from CoinGecko
 * Scrapes global crypto market charts including total market cap, volume, and BTC dominance.
 *
 * URL: https://www.coingecko.com/en/charts
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/charts_global.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface GlobalCharts {
  market_cap: string;
  market_cap_change_24h: number;
  market_cap_change_1y: number;
  btc_market_cap: string;
  btc_dominance: number;
  stablecoin_market_cap: string;
  stablecoin_share: number;
  total_coins_tracked: number;
  total_exchanges_tracked: number;
  total_categories_tracked: number;
}

export function parseGlobalCharts(markdown: string): GlobalCharts {
  const result: GlobalCharts = {
    market_cap: "",
    market_cap_change_24h: 0,
    market_cap_change_1y: 0,
    btc_market_cap: "",
    btc_dominance: 0,
    stablecoin_market_cap: "",
    stablecoin_share: 0,
    total_coins_tracked: 0,
    total_exchanges_tracked: 0,
    total_categories_tracked: 0,
  };

  // "market cap today is $2.37 Trillion, a -1.57% change in the last 24 hours and -14.24% change one year ago"
  const mcapMatch = markdown.match(
    /market cap today is \$([\d.]+)\s*(Trillion|Billion)/i
  );
  if (mcapMatch) result.market_cap = `$${mcapMatch[1]} ${mcapMatch[2]}`;

  const change24hMatch = markdown.match(
    /a\s+([-\d.]+)%\s*change in the last 24 hours/
  );
  if (change24hMatch) result.market_cap_change_24h = parseFloat(change24hMatch[1]);

  const change1yMatch = markdown.match(
    /([-\d.]+)%\s*change one year ago/
  );
  if (change1yMatch) result.market_cap_change_1y = parseFloat(change1yMatch[1]);

  // "market cap of Bitcoin (BTC) is at $1.33 Trillion"
  const btcMatch = markdown.match(
    /market cap of.*?Bitcoin.*?is at \$([\d.]+)\s*(Trillion|Billion)/i
  );
  if (btcMatch) result.btc_market_cap = `$${btcMatch[1]} ${btcMatch[2]}`;

  // "Bitcoin dominance of 56.0%"
  const btcDomMatch = markdown.match(/Bitcoin dominance of ([\d.]+)%/i);
  if (btcDomMatch) result.btc_dominance = parseFloat(btcDomMatch[1]);

  // "Stablecoins' market cap is at $311 Billion and has a 13.11% share"
  const stableMatch = markdown.match(
    /Stablecoins'?\s*market cap is at \$([\d.]+)\s*(Trillion|Billion)/i
  );
  if (stableMatch) result.stablecoin_market_cap = `$${stableMatch[1]} ${stableMatch[2]}`;

  const stableShareMatch = markdown.match(
    /has a ([\d.]+)%\s*share/
  );
  if (stableShareMatch) result.stablecoin_share = parseFloat(stableShareMatch[1]);

  // "16,877\n\nTotal Coins Tracked"
  const lines = markdown.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (i + 2 < lines.length) {
      const label = lines[i + 2]?.trim();
      if (label === "Total Coins Tracked") {
        result.total_coins_tracked = parseInt(trimmed.replace(/,/g, ""), 10) || 0;
      } else if (label === "Total Exchanges Tracked") {
        result.total_exchanges_tracked = parseInt(trimmed.replace(/,/g, ""), 10) || 0;
      } else if (label === "Total Categories Tracked") {
        result.total_categories_tracked = parseInt(trimmed.replace(/,/g, ""), 10) || 0;
      }
    }
  }

  return result;
}

async function main() {
  console.log("Fetching global charts from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/charts");
  const markdown = data?.extracted_content ?? "";
  const globalCharts = parseGlobalCharts(markdown);
  console.log(JSON.stringify(globalCharts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("charts_global.ts") || process.argv[1]?.endsWith("charts_global.js");
if (isDirectRun) main();
