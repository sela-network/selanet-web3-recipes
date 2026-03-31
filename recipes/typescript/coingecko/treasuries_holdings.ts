/**
 * Recipe: Crypto Treasuries from CoinGecko
 * Scrapes corporate and institutional crypto holdings (BTC, ETH, etc.).
 *
 * URL: https://www.coingecko.com/en/treasuries
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/treasuries_holdings.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Holding {
  symbol: string;
  image: string;
}

interface TreasuryHolding {
  rank: number;
  entity: string;
  slug: string;
  url: string;
  type: string;
  top_holdings: Holding[];
  activity_30d: string;
  total_cost_usd: number;
  todays_value_usd: number;
  mnav: string;
}

export function parseMarkdownTable(markdown: string): TreasuryHolding[] {
  const lines = markdown.split("\n");
  const results: TreasuryHolding[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, entity, type, holdings, activity, total_cost, todays_value, mnav, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    // Entity: "[🇺🇸   Strategy   MSTR.US](url)"
    const entityCell = cells[2] || "";
    const entityMatch = entityCell.match(
      /\[([^\]]+)\]\((https:\/\/www\.coingecko\.com\/en\/treasuries\/[^)]*\/([^)]+))\)/
    );
    const rawName = entityMatch ? entityMatch[1].trim() : "";
    // Clean emoji flags and extra spaces
    const entity = rawName.replace(/[\u{1F1E0}-\u{1F1FF}]/gu, "").replace(/\s+/g, " ").trim();
    const url = entityMatch ? entityMatch[2] : "";
    const slug = entityMatch ? entityMatch[3] : "";

    const type = cells[3]?.trim() || "";

    // Top holdings: [![BTC](img)](link) ...
    const holdingsCell = cells[4] || "";
    const holdings: Holding[] = [];
    const holdRegex = /\[!\[([^\]]*)\]\(([^)]+)\)\]/g;
    let hm;
    while ((hm = holdRegex.exec(holdingsCell)) !== null) {
      holdings.push({ symbol: hm[1], image: hm[2] });
    }

    const activity = cells[5]?.trim() || "";

    const parseUsd = (s: string): number => {
      const n = parseFloat(s?.replace(/[$,\s]/g, ""));
      return isNaN(n) ? 0 : n;
    };

    results.push({
      rank,
      entity,
      slug,
      url,
      type,
      top_holdings: holdings,
      activity_30d: activity,
      total_cost_usd: parseUsd(cells[6]),
      todays_value_usd: parseUsd(cells[7]),
      mnav: cells[8]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching crypto treasuries from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/treasuries");
  const markdown = data?.extracted_content ?? "";
  const treasuries = parseMarkdownTable(markdown);
  console.log(JSON.stringify(treasuries, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("treasuries_holdings.ts") || process.argv[1]?.endsWith("treasuries_holdings.js");
if (isDirectRun) main();
