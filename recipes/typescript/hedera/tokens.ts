/**
 * Recipe: Tokens from Hedera (HashScan) (SPA)
 * Scrapes token listings on Hedera Mainnet.
 *
 * URL: https://hashscan.io/mainnet/tokens
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx hedera/tokens.ts
 *   npx tsx hedera/tokens.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildUrl } from "./utils.js";

export interface HederaToken {
  token_id: string;
  name: string;
  symbol: string;
  token_url: string;
}

export function parseTokens(markdown: string): HederaToken[] {
  const lines = markdown.split("\n");
  const results: HederaToken[] = [];

  // HashScan table: | TOKEN | NAME | SYMBOL |
  // Token IDs are plain text like "0.0.10418527"
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 3) continue;

    const tokenId = cells[1] || "";
    if (tokenId.startsWith("---") || tokenId.toLowerCase() === "token" || !/^0\.0\.\d+$/.test(tokenId)) continue;

    results.push({
      token_id: tokenId,
      name: cells[2] || "",
      symbol: cells[3] || "",
      token_url: `https://hashscan.io/mainnet/token/${tokenId}`,
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildUrl("tokens");
  console.log(`Fetching tokens from Hedera: ${url}\n`);

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
