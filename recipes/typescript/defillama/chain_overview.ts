/**
 * Recipe: DefiLlama Chain Overview
 * Scrapes DeFi key metrics for a specific blockchain from DefiLlama.
 * Includes TVL, stablecoin mcap, fees, revenue, DEX volume, and more.
 *
 * URL: https://defillama.com/chain/{chain}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx defillama/chain_overview.ts
 *   npx tsx defillama/chain_overview.ts ethereum
 *   npx tsx defillama/chain_overview.ts solana
 *   npx tsx defillama/chain_overview.ts arbitrum --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS } from "./utils.js";

export interface ChainOverview {
  chain: string;
  tvl: string;
  tvl_change_24h: string;
  stablecoins_mcap: string;
  stablecoins_change_7d: string;
  usdt_dominance: string;
  chain_fees_24h: string;
  chain_revenue_24h: string;
  app_revenue_24h: string;
  app_fees_24h: string;
  dex_volume_24h: string;
  dex_volume_7d: string;
  perps_volume_24h: string;
  active_addresses_24h: string;
  transactions_24h: string;
  inflows_24h: string;
  eth_price: string;
  bridged_tvl: string;
}

export function parseChainOverview(markdown: string, chain: string): ChainOverview {
  const result: ChainOverview = {
    chain,
    tvl: "",
    tvl_change_24h: "",
    stablecoins_mcap: "",
    stablecoins_change_7d: "",
    usdt_dominance: "",
    chain_fees_24h: "",
    chain_revenue_24h: "",
    app_revenue_24h: "",
    app_fees_24h: "",
    dex_volume_24h: "",
    dex_volume_7d: "",
    perps_volume_24h: "",
    active_addresses_24h: "",
    transactions_24h: "",
    inflows_24h: "",
    eth_price: "",
    bridged_tvl: "",
  };

  const lines = markdown.split("\n");

  // Parse "Key Value" patterns where value follows key on the same line or next line
  // DefiLlama chain page uses format: "Key$ValueUnit" or "Key\nValue"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Same-line patterns: "Stablecoins Mcap$164.706b"
    const kvMatch = line.match(/^(.+?)(\$[\d,.]+[bBmMkK]?)$/);
    if (kvMatch) {
      mapMetric(result, kvMatch[1].trim(), kvMatch[2]);
      continue;
    }

    // Same-line with percentage: "USDT Dominance48.88%"
    const pctMatch = line.match(/^(.+?)([\d.]+%)$/);
    if (pctMatch) {
      mapMetric(result, pctMatch[1].trim(), pctMatch[2]);
      continue;
    }

    // Same-line with number: "Active Addresses (24h)658,329"
    const numMatch = line.match(/^(.+?)([\d,]+\.\d+[mMbB]?|[\d,]+[mMbBkK]?)$/);
    if (numMatch && numMatch[1].length > 3) {
      mapMetric(result, numMatch[1].trim(), numMatch[2]);
      continue;
    }

    // "## Total Value Locked" followed by value (may have blank lines between)
    if (line.includes("Total Value Locked")) {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const nextVal = lines[j].trim();
        if (!nextVal) continue;
        const valMatch = nextVal.match(/^\$[\d,.]+[bBmMkK]?$/);
        if (valMatch) { result.tvl = valMatch[0]; continue; }
        const changeMatch = nextVal.match(/^([+-]?[\d.]+%)/);
        if (changeMatch && result.tvl) { result.tvl_change_24h = changeMatch[1]; break; }
      }
    }

    // "Change (7d)+0.70%" pattern
    if (line.startsWith("Change (7d)")) {
      const cm = line.match(/([+-]?[\d.]+%)/);
      if (cm) result.stablecoins_change_7d = cm[1];
    }
    if (line.startsWith("Change (1d)")) {
      const cm = line.match(/([+-]?[\d.]+%)/);
      if (cm && !result.tvl_change_24h) result.tvl_change_24h = cm[1];
    }
  }

  return result;
}

function mapMetric(result: ChainOverview, key: string, value: string): void {
  const k = key.toLowerCase().replace(/[()]/g, "");
  if (k.includes("stablecoins") && k.includes("mcap")) result.stablecoins_mcap = value;
  else if (k.includes("usdt") && k.includes("dominan")) result.usdt_dominance = value;
  else if (k.includes("chain fees")) result.chain_fees_24h = value;
  else if (k.includes("chain revenue")) result.chain_revenue_24h = value;
  else if (k.includes("chain rev") && !k.includes("revenue")) result.chain_revenue_24h = result.chain_revenue_24h || value;
  else if (k.includes("app revenue")) result.app_revenue_24h = value;
  else if (k.includes("app fees")) result.app_fees_24h = value;
  else if (k.includes("dexs volume") || (k.includes("dex") && k.includes("24h"))) result.dex_volume_24h = value;
  else if (k.includes("volume") && k.includes("7d")) result.dex_volume_7d = value;
  else if (k.includes("perps")) result.perps_volume_24h = value;
  else if (k.includes("active address")) result.active_addresses_24h = value;
  else if (k.includes("transaction")) result.transactions_24h = value;
  else if (k.includes("inflow")) result.inflows_24h = value;
  else if (k.includes("price") && k.includes("eth")) result.eth_price = value;
  else if (k.includes("bridged")) result.bridged_tvl = value;
}

async function main() {
  const chainArg = process.argv[2];
  const debug = process.argv.includes("--debug");
  const chain = chainArg && chainArg !== "--debug" ? chainArg.toLowerCase() : "ethereum";

  const url = `https://defillama.com/chain/${chain}`;
  console.log(`Fetching DefiLlama chain overview: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const overview = parseChainOverview(md, chain);
  console.log(JSON.stringify(overview, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("chain_overview.ts") || process.argv[1]?.endsWith("chain_overview.js");
if (isDirectRun) main();
