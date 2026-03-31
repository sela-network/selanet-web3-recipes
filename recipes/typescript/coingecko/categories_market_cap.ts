/**
 * Recipe: Crypto Categories from CoinGecko
 * Scrapes category-level market caps and 24h changes (DeFi, Layer 1, Meme, etc.).
 *
 * URL: https://www.coingecko.com/en/categories
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/categories_market_cap.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TopGainer {
  name: string;
  url: string;
  image: string;
}

interface CategoryMarketCap {
  rank: number;
  category: string;
  slug: string;
  url: string;
  top_gainers: TopGainer[];
  change_1h: number;
  change_24h: number;
  change_7d: number;
  market_cap: number;
  volume_24h: number;
  num_coins: number;
  sparkline: string;
}

function parseTopGainers(cell: string): TopGainer[] {
  const gainers: TopGainer[] = [];
  const regex =
    /\[!\[\]\(([^)]+)\)\]\(https:\/\/www\.coingecko\.com\/en\/coins\/([^)]+)\)/g;
  let match;
  while ((match = regex.exec(cell)) !== null) {
    gainers.push({
      name: match[2],
      url: `https://www.coingecko.com/en/coins/${match[2]}`,
      image: match[1],
    });
  }
  return gainers;
}

function parseSparkline(cell: string): string {
  const match = cell.match(/\(https:\/\/www\.coingecko\.com\/categories\/[^)]+\/sparkline\.svg\)/);
  if (match) return match[0].slice(1, -1);
  return "";
}

export function parseMarkdownTable(markdown: string): CategoryMarketCap[] {
  const lines = markdown.split("\n");
  const results: CategoryMarketCap[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, icon, rank, category, top_gainers, 1h, 24h, 7d, market_cap, volume, num_coins, sparkline, empty]

    const rank = parseInt(cells[2], 10);
    if (isNaN(rank)) continue;

    const categoryCell = cells[3] || "";
    const linkMatch = categoryCell.match(
      /\[([^\]]+)\]\((https:\/\/www\.coingecko\.com\/en\/categories\/([^)]+))\)/
    );
    const category = linkMatch ? linkMatch[1] : categoryCell;
    const slug = linkMatch ? linkMatch[3] : "";
    const url = linkMatch ? linkMatch[2] : "";

    const parsePercent = (s: string): number => {
      const n = parseFloat(s?.replace(/%/g, "").trim());
      return isNaN(n) ? 0 : n;
    };

    const parseUsd = (s: string): number => {
      const n = parseInt(s?.replace(/[$,\s]/g, ""), 10);
      return isNaN(n) ? 0 : n;
    };

    results.push({
      rank,
      category,
      slug,
      url,
      top_gainers: parseTopGainers(cells[4] || ""),
      change_1h: parsePercent(cells[5]),
      change_24h: parsePercent(cells[6]),
      change_7d: parsePercent(cells[7]),
      market_cap: parseUsd(cells[8]),
      volume_24h: parseUsd(cells[9]),
      num_coins: parseInt(cells[10], 10) || 0,
      sparkline: parseSparkline(cells[11] || ""),
    });
  }

  return results;
}

async function main() {
  console.log("Fetching crypto categories from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/categories");
  const markdown = data?.extracted_content ?? "";
  const categories = parseMarkdownTable(markdown);
  console.log(JSON.stringify(categories, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("categories_market_cap.ts") || process.argv[1]?.endsWith("categories_market_cap.js");
if (isDirectRun) main();
