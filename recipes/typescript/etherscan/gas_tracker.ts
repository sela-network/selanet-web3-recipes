/**
 * Recipe: Etherscan Gas Tracker
 * Scrapes real-time Ethereum gas prices and estimated costs.
 *
 * URL: https://etherscan.io/gastracker
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/gas_tracker.ts
 *   npx tsx etherscan/gas_tracker.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

export interface GasPrice {
  low: string;
  average: string;
  high: string;
}

export interface GasEstimate {
  action: string;
  low: string;
  average: string;
  high: string;
}

export interface GasTracker {
  gas_prices: GasPrice;
  base_fee: string;
  priority_fee: string;
  estimates: GasEstimate[];
}

export function parseGasTracker(markdown: string): GasTracker {
  const result: GasTracker = {
    gas_prices: { low: "", average: "", high: "" },
    base_fee: "",
    priority_fee: "",
    estimates: [],
  };

  const lines = markdown.split("\n");
  const gweiRe = /(\d+(?:\.\d+)?)\s*(?:Gwei|gwei)/;
  const priceRe = /\$[\d,.]+/;

  // Extract gas price tiers
  const gweisFound: string[] = [];
  for (const line of lines) {
    const m = line.match(gweiRe);
    if (m) gweisFound.push(m[0]);
  }

  if (gweisFound.length >= 3) {
    result.gas_prices.low = gweisFound[0];
    result.gas_prices.average = gweisFound[1];
    result.gas_prices.high = gweisFound[2];
  }

  // Extract base fee and priority fee
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("base") && lower.includes("fee")) {
      const m = line.match(gweiRe);
      if (m) result.base_fee = m[0];
    }
    if (lower.includes("priority") && lower.includes("fee")) {
      const m = line.match(gweiRe);
      if (m) result.priority_fee = m[0];
    }
  }

  // Parse cost estimates table — only rows whose action looks like a known operation
  // and whose value cells contain dollar prices. This avoids capturing other tables
  // (Top Gas Spenders, Block history, etc.).
  const knownActions = new Set([
    "swap", "nft sale", "bridging", "borrowing",
    "opensea: sale", "uniswap v3: swap", "uniswap v2: swap",
    "usdt: transfer", "sushiswap: swap", "curve: swap",
    "balancer: swap", "bancor: swap", "1inch: swap",
    "kyberswap: swap", "erc20: transfer", "erc721: transfer",
    "cow protocol: swap", "superrare: sale", "rarible: sale",
  ]);

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;

    const action = cells[1] || "";
    if (action.startsWith("---") || !action) continue;

    const cleanAction = action.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
    if (!knownActions.has(cleanAction.toLowerCase())) continue;

    // Extract dollar prices from remaining cells
    const vals = cells.slice(2).filter((c) => c);
    const prices = vals.map((v) => {
      const m = v.match(priceRe);
      return m ? m[0] : v;
    });

    result.estimates.push({
      action: cleanAction,
      low: prices[0] || "",
      average: prices[1] || "",
      high: prices[2] || "",
    });
  }

  return result;
}

async function main() {
  const debug = process.argv.includes("--debug");
  console.log("Fetching Ethereum gas tracker from Etherscan...\n");

  const data = await browse("https://etherscan.io/gastracker");
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const tracker = parseGasTracker(md);
  console.log(JSON.stringify(tracker, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("gas_tracker.ts") || process.argv[1]?.endsWith("gas_tracker.js");
if (isDirectRun) main();
