/**
 * Recipe: Tokens from Flare Explorer (SPA)
 * Scrapes token listings on Flare Mainnet using Blockscout-based explorer.
 *
 * URL: https://flare-explorer.flare.network/tokens
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx flare/tokens.ts
 *   npx tsx flare/tokens.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildUrl } from "./utils.js";

export interface FlareToken {
  name: string;
  symbol: string;
  address: string;
  token_url: string;
  type: string;
  rank: number;
  holders: string;
}

export function parseTokens(markdown: string): FlareToken[] {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: FlareToken[] = [];

  // Blockscout card layout:
  // [Name (SYMBOL)](https://flare-explorer.flare.network/token/0x...)
  // ERC-20
  // rank
  // [0xAB...CD](address url)
  // Holders
  // count

  const tokenLinkRe = /^\[(.+)\]\((https:\/\/flare-explorer\.flare\.network\/token\/(0x[0-9a-fA-F]+))\)$/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(tokenLinkRe);
    if (!m) continue;

    const fullName = m[1];
    const tokenUrl = m[2];
    const address = m[3];

    // Parse "Name (SYMBOL)" or just "Name"
    const nsMatch = fullName.match(/^(.+?)\s*\(([^)]+)\)$/);
    const name = nsMatch ? nsMatch[1].trim() : fullName;
    const symbol = nsMatch ? nsMatch[2] : "";

    // Look ahead for type, rank, holders
    const context = lines.slice(i + 1, Math.min(lines.length, i + 8));
    let type = "";
    let rank = 0;
    let holders = "";
    for (let j = 0; j < context.length; j++) {
      if (context[j].startsWith("ERC-")) type = context[j];
      if (/^\d+$/.test(context[j]) && !rank) rank = parseInt(context[j], 10);
      if (context[j] === "Holders" && context[j + 1]) {
        holders = context[j + 1].replace(/,/g, "").trim();
      }
    }

    results.push({ name, symbol, address, token_url: tokenUrl, type, rank, holders });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildUrl("tokens");
  console.log(`Fetching tokens from Flare: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const tokens = parseTokens(md);
  console.log(JSON.stringify(tokens, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("tokens.ts") || process.argv[1]?.endsWith("tokens.js");
if (isDirectRun) main();
