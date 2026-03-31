/**
 * Recipe: Token Unlocks from RootData
 * Scrapes upcoming token unlock schedules and details.
 *
 * URL: https://www.rootdata.com/token-unlocks
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/token_unlocks.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TokenUnlock {
  rank: number;
  project: string;
  symbol: string;
  slug: string;
  url: string;
  image: string;
  price: string;
  change_24h: string;
  market_cap: string;
  fdv: string;
  circulating_supply: string;
  unlocked_ratio: string;
  next_unlock_value: string;
  unlock_countdown: string;
}

export function parseMarkdownTable(markdown: string): TokenUnlock[] {
  const lines = markdown.split("\n");
  const results: TokenUnlock[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, star_icon, rank, project, price, 24h, mcap, fdv, cir_supply, unlocked_ratio, next_unlock, countdown, empty]

    const rank = parseInt(cells[2], 10);
    if (isNaN(rank)) continue;

    const projCell = cells[3] || "";
    const match = projCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]+\)\s+\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/Projects\/detail\/([^?]+)\?[^)]*)\)/
    );
    if (!match) continue;

    // Name may include symbol like "[DYDX](url)" or "[WorldWLD](url)"
    const rawName = match[3];
    // Symbol is typically the link text itself (e.g., "DYDX")
    const symbol = match[1] || rawName;

    results.push({
      rank,
      project: match[1], // alt text is the display name
      symbol: rawName,
      slug: match[5],
      url: match[4],
      image: match[2],
      price: cells[4]?.trim() || "",
      change_24h: cells[5]?.trim() || "",
      market_cap: cells[6]?.trim() || "",
      fdv: cells[7]?.trim() || "",
      circulating_supply: cells[8]?.trim() || "",
      unlocked_ratio: cells[9]?.trim() || "",
      next_unlock_value: cells[10]?.trim() || "",
      unlock_countdown: cells[11]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching token unlocks from RootData...\n");
  const data = await browse("https://www.rootdata.com/token-unlocks");
  const markdown = data?.extracted_content ?? "";
  const unlocks = parseMarkdownTable(markdown);
  console.log(JSON.stringify(unlocks, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("token_unlocks.ts") || process.argv[1]?.endsWith("token_unlocks.js");
if (isDirectRun) main();
