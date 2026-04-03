/**
 * Recipe: Uniswap Token Detail (SPA)
 * Scrapes detailed token information from Uniswap explore.
 *
 * URL: https://app.uniswap.org/explore/tokens/{chain}/{address}?lng=en
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx uniswap/token_detail.ts 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
 *   npx tsx uniswap/token_detail.ts 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 ethereum
 *   npx tsx uniswap/token_detail.ts 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48 base --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, resolveChain } from "./utils.js";

export interface UniswapTokenDetail {
  name: string;
  symbol: string;
  price: string;
  change_1d: string;
  tvl: string;
  market_cap: string;
  fdv: string;
  volume_1d: string;
  description: string;
  top_pools: { pair: string; fee: string; tvl: string }[];
}

export function parseTokenDetail(markdown: string): UniswapTokenDetail {
  const result: UniswapTokenDetail = {
    name: "", symbol: "", price: "", change_1d: "",
    tvl: "", market_cap: "", fdv: "", volume_1d: "",
    description: "", top_pools: [],
  };

  const lines = markdown.split("\n");
  const dollarRe = /^\$[\d,.]+[KMBT]?$/;
  const pctRe = /^[+-]?[\d.]+%$/;

  // Format: "# USD Coin" then "## USDC" then "## $1.00"
  let foundName = false;
  for (const line of lines) {
    const nameMatch = line.match(/^#\s+([A-Z][A-Za-z0-9 .]+)\s*$/);
    if (nameMatch && !nameMatch[1].includes("Uniswap") && !nameMatch[1].includes("Stats")) {
      if (!foundName) { result.name = nameMatch[1].trim(); foundName = true; }
    }
    const symMatch = line.match(/^##\s+([A-Z][A-Z0-9]+)\s*$/);
    if (symMatch && !result.symbol && foundName) result.symbol = symMatch[1];
    const priceMatch = line.match(/^##\s+\$([\d,.]+)\s*$/);
    if (priceMatch && !result.price && foundName) result.price = "$" + priceMatch[1];
  }

  // Change: "$0.00 (0.00%)" or "-$0.01 (0.02%)"
  for (const line of lines) {
    const cm = line.trim().match(/^[+-]?\$[\d,.]+\s*\(([\d.]+%)\)/);
    if (cm && !result.change_1d) result.change_1d = cm[1];
  }

  // Key-value patterns: label on one line, value 1-2 lines after (may have blank lines)
  for (let i = 0; i < lines.length; i++) {
    const label = lines[i].trim().toLowerCase();
    // Find next non-empty line as value
    let val = "";
    for (let j = i + 1; j < Math.min(lines.length, i + 3); j++) {
      const v = lines[j].trim();
      if (v) { val = v; break; }
    }
    if (!val) continue;
    if (label === "tvl" && dollarRe.test(val)) result.tvl = val;
    if (label === "market cap" && dollarRe.test(val)) result.market_cap = val;
    if (label === "fdv" && dollarRe.test(val)) result.fdv = val;
    if ((label.includes("1d volume") || label === "volume (1d)") && dollarRe.test(val)) result.volume_1d = val;
  }

  // Description
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 80 && !t.startsWith("[") && !t.startsWith("|") && !t.startsWith("#") && !t.startsWith("!")) {
      result.description = t.substring(0, 500);
      break;
    }
  }

  return result;
}

async function main() {
  const tokenAddr = process.argv[2];
  if (!tokenAddr || tokenAddr === "--debug") {
    console.error("Usage: npx tsx uniswap/token_detail.ts <token_address> [chain]");
    console.error("Example: npx tsx uniswap/token_detail.ts 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48");
    process.exit(1);
  }
  const chainArg = process.argv[3];
  const debug = process.argv.includes("--debug");
  const chain = chainArg && chainArg !== "--debug" ? resolveChain(chainArg) : resolveChain();

  const url = `https://app.uniswap.org/explore/tokens/${chain.slug}/${tokenAddr}?lng=en`;
  console.log(`Fetching Uniswap token detail: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) { printMarkdown(data); console.log("\n--- Parsed ---\n"); }

  const detail = parseTokenDetail(md);
  console.log(JSON.stringify({ chain: chain.name, token: tokenAddr, ...detail }, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("token_detail.ts") || process.argv[1]?.endsWith("token_detail.js");
if (isDirectRun) main();
