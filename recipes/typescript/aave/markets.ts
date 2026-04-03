/**
 * Recipe: Aave Markets
 * Scrapes lending/borrowing market data from Aave V3.
 *
 * URL: https://app.aave.com/markets/
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx aave/markets.ts
 *   npx tsx aave/markets.ts ethereum
 *   npx tsx aave/markets.ts base --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, resolveNetwork, buildMarketsUrl } from "./utils.js";

export interface Market {
  asset: string;
  symbol: string;
  image: string;
  url: string;
  total_supplied: string;
  supply_apy: string;
  total_borrowed: string;
  borrow_apy_variable: string;
}

/** Strip markdown image syntax and return the URL */
function extractImage(s: string): string {
  const m = s.match(/!\[[^\]]*\]\(([^)]+)\)/);
  return m ? m[1] : "";
}

function stripImages(s: string): string {
  return s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
}

export function parseMarkets(markdown: string): Market[] {
  const results: Market[] = [];
  const lines = markdown.split("\n");

  // Try markdown table format first
  const tableResults = parseTable(lines);
  if (tableResults.length > 0) return tableResults;

  // Fallback: parse link-block style (SPA rendering)
  return parseBlocks(lines);
}

function parseTable(lines: string[]): Market[] {
  const results: Market[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 6) continue;

    // Skip header/separator rows
    const first = cells[1] || "";
    if (first.startsWith("---") || first.toLowerCase().includes("asset")) continue;

    // Extract asset info from first cell (may contain image + link)
    const image = extractImage(first);
    const clean = stripImages(first);

    let asset = "";
    let symbol = "";
    let url = "";

    // Pattern: [AssetName (SYM)](url) or [AssetName](url)
    const linkMatch = clean.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (linkMatch) {
      const nameStr = linkMatch[1].trim();
      url = linkMatch[2];
      const symMatch = nameStr.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (symMatch) {
        asset = symMatch[1].trim();
        symbol = symMatch[2].trim();
      } else {
        asset = nameStr;
        symbol = nameStr;
      }
    } else {
      // Plain text
      const symMatch = clean.match(/^(.+?)\s*\(([^)]+)\)$/);
      if (symMatch) {
        asset = symMatch[1].trim();
        symbol = symMatch[2].trim();
      } else {
        asset = clean;
        symbol = clean;
      }
    }

    if (!asset || asset.toLowerCase() === "asset") continue;

    results.push({
      asset,
      symbol,
      image,
      url,
      total_supplied: cells[2] || "",
      supply_apy: cells[3] || "",
      total_borrowed: cells[4] || "",
      borrow_apy_variable: cells[5] || "",
    });
  }

  return results;
}

/**
 * Block-based parser for Aave SPA rendering.
 * Each asset block looks like:
 *   #### Asset Name          ← h4 heading
 *   SYMBOL                   ← ticker symbol
 *   2.98M                    ← supply amount
 *   $6.11B                   ← supply value
 *   1.67%                    ← supply APY
 *   ...                      ← optional reward/multiplier lines
 *   2.60M                    ← borrow amount
 *   $5.34B                   ← borrow value
 *   2.26%                    ← borrow APY
 *   [Details](reserve-url)   ← detail link
 */
function parseBlocks(lines: string[]): Market[] {
  const results: Market[] = [];
  const dollarRe = /^\$[\d,.]+[KMBT]?$/;
  const apyRe = /^[<>]?[\d.]+%$/;
  const detailsRe = /\[Details\]\((https:\/\/app\.aave\.com\/reserve-overview\/[^)]+)\)/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Detect asset heading: "#### Asset Name"
    const headingMatch = line.match(/^#{4}\s+(.+)/);
    if (!headingMatch) continue;

    const asset = headingMatch[1].replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
    if (!asset) continue;

    // Collect subsequent non-empty lines until next heading or a long gap
    const block: string[] = [];
    for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
      const l = lines[j].trim();
      if (l.match(/^#{1,4}\s/)) break; // next heading
      if (l) block.push(l);
    }

    // Find the [Details] link
    let url = "";
    for (const b of block) {
      const dm = b.match(detailsRe);
      if (dm) { url = dm[1]; break; }
    }
    if (!url) continue; // not an asset block

    // First non-empty line after heading is typically the symbol
    const symbol = block[0] || asset;

    // Collect dollar values and APY values in order
    const dollars: string[] = [];
    const apys: string[] = [];
    for (const b of block) {
      if (dollarRe.test(b)) dollars.push(b);
      if (apyRe.test(b)) apys.push(b);
    }

    results.push({
      asset,
      symbol,
      image: "",
      url,
      total_supplied: dollars[0] || "",
      supply_apy: apys[0] || "",
      total_borrowed: dollars[1] || "",
      borrow_apy_variable: apys[1] || "",
    });
  }

  return results;
}

async function main() {
  const networkArg = process.argv[2];
  const debug = process.argv.includes("--debug");

  const network = networkArg && networkArg !== "--debug" ? resolveNetwork(networkArg) : undefined;
  const url = buildMarketsUrl(network?.slug);
  console.log(`Fetching Aave markets: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const markets = parseMarkets(md);
  console.log(
    JSON.stringify(
      {
        network: network?.name ?? "ethereum",
        count: markets.length,
        markets,
      },
      null,
      2
    )
  );
}

const isDirectRun =
  process.argv[1]?.endsWith("markets.ts") || process.argv[1]?.endsWith("markets.js");
if (isDirectRun) main();
