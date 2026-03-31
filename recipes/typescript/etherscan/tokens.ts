/**
 * Recipe: ERC-20 Tokens from Etherscan
 * Scrapes top ERC-20 tokens by market cap.
 *
 * URL: https://etherscan.io/tokens
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/tokens.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Token {
  rank: number;
  name: string;
  symbol: string;
  url: string;
  image: string;
  price: string;
  change_24h: string;
  volume_24h: string;
  circulating_market_cap: string;
  onchain_market_cap: string;
  holders: string;
}

export function parseMarkdownTable(markdown: string): Token[] {
  const lines = markdown.split("\n");
  const results: Token[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, token, empty(ad), price, change, volume, circ_mcap, onchain_mcap, holders, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const tokenCell = cells[2] || "";
    const match = tokenCell.match(
      /\[!\[\]\(([^)]+)\)\s+([^\s]+(?:\s+[^\s(]+)*)\s+\(([^)]+)\)\]\((https:\/\/etherscan\.io\/token\/[^)]+)\)/
    );
    if (!match) continue;

    results.push({
      rank,
      name: match[2].trim(),
      symbol: match[3],
      url: match[4],
      image: match[1],
      price: cells[4]?.trim() || "",
      change_24h: cells[5]?.trim() || "",
      volume_24h: cells[6]?.trim() || "",
      circulating_market_cap: cells[7]?.trim() || "",
      onchain_market_cap: cells[8]?.trim() || "",
      holders: cells[9]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching ERC-20 tokens from Etherscan...\n");
  const data = await browse("https://etherscan.io/tokens");
  const markdown = data?.extracted_content ?? "";
  const tokens = parseMarkdownTable(markdown);
  console.log(JSON.stringify(tokens, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("tokens.ts") || process.argv[1]?.endsWith("tokens.js");
if (isDirectRun) main();
