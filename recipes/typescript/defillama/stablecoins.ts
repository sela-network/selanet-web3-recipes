/**
 * Recipe: DefiLlama Stablecoins
 * Scrapes stablecoin market cap rankings and peg data.
 *
 * URL: https://defillama.com/stablecoins
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx defillama/stablecoins.ts
 *   npx tsx defillama/stablecoins.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildStablecoinsUrl } from "./utils.js";

export interface Stablecoin {
  rank: number;
  name: string;
  symbol: string;
  off_peg: string;
  off_peg_1m: string;
  price: string;
  change_1d: string;
  change_7d: string;
  change_1m: string;
  market_cap: string;
  chains: string[];
  url: string;
}

/**
 * Block-based parser for DefiLlama stablecoins.
 * Each stablecoin block:
 *   ![Logo](img)[Name (SYMBOL)](url)       ← name line
 *   [![chain](icon)](link)...+N             ← chain icons
 *   -0.01%                                  ← % off peg
 *   -0.09%                                  ← 1m % off peg
 *   $1                                      ← price
 *   -0.14%                                  ← 1d change
 *   -0.08%                                  ← 7d change
 *   +0.12%                                  ← 1m change
 *   $183.914b                               ← market cap
 */
export function parseStablecoins(markdown: string): Stablecoin[] {
  const results: Stablecoin[] = [];
  const lines = markdown.split("\n");
  const nameRe = /!\[Logo of ([^\]]+)\]\([^)]+\)\[([^\]]+)\]\((https:\/\/defillama\.com\/stablecoin\/[^)]+)\)/;
  const chainRe = /\[Logo of ([^\]]+)\]/g;
  const pctRe = /^[+-]?[\d.]+%$/;
  const priceRe = /^\$[\d,.]+[bBmMkK]?$/;
  let rank = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const m = line.match(nameRe);
    if (!m) continue;

    rank++;
    const rawName = m[2].trim();
    const url = m[3];

    let name = rawName;
    let symbol = rawName;
    const symMatch = rawName.match(/^(.+?)\s*\(([^)]+)\)$/);
    if (symMatch) {
      name = symMatch[1].trim();
      symbol = symMatch[2].trim();
    }

    // Extract chains from the next line(s) with chain icons
    const chains: string[] = [];
    let j = i + 1;
    for (; j < Math.min(lines.length, i + 5); j++) {
      const chainLine = lines[j].trim();
      if (!chainLine.includes("Logo of")) break;
      let cm;
      const re = /\[Logo of ([^\]]+)\]/g;
      while ((cm = re.exec(chainLine)) !== null) {
        chains.push(cm[1]);
      }
    }

    // Collect value lines: percentages and dollar amounts
    const values: string[] = [];
    for (; j < Math.min(lines.length, i + 20); j++) {
      const vline = lines[j].trim();
      if (!vline) continue;
      if (vline.match(nameRe)) break; // next stablecoin
      if (pctRe.test(vline) || priceRe.test(vline)) {
        values.push(vline);
      }
      if (values.length >= 7) break;
    }

    // Values order: off_peg, off_peg_1m, price, change_1d, change_7d, change_1m, market_cap
    results.push({
      rank,
      name,
      symbol,
      off_peg: values[0] || "",
      off_peg_1m: values[1] || "",
      price: values[2] || "",
      change_1d: values[3] || "",
      change_7d: values[4] || "",
      change_1m: values[5] || "",
      market_cap: values[6] || "",
      chains,
      url,
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildStablecoinsUrl();
  console.log(`Fetching DefiLlama stablecoins: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const stablecoins = parseStablecoins(md);
  console.log(
    JSON.stringify(
      {
        count: stablecoins.length,
        stablecoins,
      },
      null,
      2
    )
  );
}

const isDirectRun =
  process.argv[1]?.endsWith("stablecoins.ts") || process.argv[1]?.endsWith("stablecoins.js");
if (isDirectRun) main();
