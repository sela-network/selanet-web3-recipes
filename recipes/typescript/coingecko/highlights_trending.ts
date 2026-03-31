/**
 * Recipe: Highlights from CoinGecko
 * Scrapes trending tokens, most searched, and most viewed coins.
 *
 * URL: https://www.coingecko.com/en/highlights
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/highlights_trending.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TrendingCoin {
  name: string;
  slug: string;
  image: string;
  price: number;
  change_24h: number;
}

interface TrendingSearch {
  name: string;
  symbol: string;
  slug: string;
  image: string;
  change: number;
}

interface TrendingNft {
  name: string;
  slug: string;
  image: string;
  change: number;
}

interface TrendingCategory {
  name: string;
  slug: string;
  change: number;
}

interface HighlightsResult {
  trending_search: TrendingSearch[];
  trending_nft: TrendingNft[];
  trending_categories: TrendingCategory[];
  trending_coins: TrendingCoin[];
  top_gainers: TrendingCoin[];
  top_losers: TrendingCoin[];
  most_viewed: TrendingCoin[];
}

function parseTrendingSearch(lines: string[], start: number, end: number): TrendingSearch[] {
  const results: TrendingSearch[] = [];
  // Pattern: [![](img)\n\nname\n\nSYMBOL\n\n change%\n\nSelect](redirect_url)
  const block = lines.slice(start, end).join("\n");
  const regex =
    /\[!\[\]\(([^)]+)\)\s+([\s\S]*?)\s+([A-Z0-9]+)\s+([\d.]+)%\s+Select\]\(https:\/\/www\.coingecko\.com\/en\/search_redirect\?id=([^&]+)&type=coin/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    results.push({
      name: m[2].trim(),
      symbol: m[3],
      slug: m[5],
      image: m[1],
      change: parseFloat(m[4]) || 0,
    });
  }
  return results;
}

function parseTrendingNft(lines: string[], start: number, end: number): TrendingNft[] {
  const results: TrendingNft[] = [];
  const block = lines.slice(start, end).join("\n");
  const regex =
    /\[!\[\]\(([^)]+)\)\s+([\s\S]*?)\s+([\d.]+)%\s+Select\]\(https:\/\/www\.coingecko\.com\/en\/search_redirect\?id=([^&]+)&type=nft/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    results.push({
      name: m[2].trim(),
      slug: m[4],
      image: m[1],
      change: parseFloat(m[3]) || 0,
    });
  }
  return results;
}

function parseTrendingCategories(lines: string[], start: number, end: number): TrendingCategory[] {
  const results: TrendingCategory[] = [];
  const block = lines.slice(start, end).join("\n");
  const regex =
    /\[([^\n]+?)\s+([\d.]+)%\s+Select\]\(https:\/\/www\.coingecko\.com\/en\/search_redirect\?id=([^&]+)&type=category/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    results.push({
      name: m[1].trim(),
      slug: m[3],
      change: parseFloat(m[2]) || 0,
    });
  }
  return results;
}

function parseCoinList(lines: string[], start: number, end: number): TrendingCoin[] {
  const results: TrendingCoin[] = [];
  // Pattern: [![Name](img)\n\n Name\n\n$price\n\nchange%](coin_url)
  const block = lines.slice(start, end).join("\n");
  const regex =
    /\[!\[([^\]]*)\]\(([^)]+)\)\s+([^\n]+?)\s+\$([\d,.]+)\s+([\d.]+)%\]\(https:\/\/www\.coingecko\.com\/en\/coins\/([^)]+)\)/g;
  let m;
  while ((m = regex.exec(block)) !== null) {
    results.push({
      name: m[3].trim(),
      slug: m[6],
      image: m[2],
      price: parseFloat(m[4].replace(/,/g, "")) || 0,
      change_24h: parseFloat(m[5]) || 0,
    });
  }
  return results;
}

function findSectionBounds(
  lines: string[],
  markers: string[]
): { start: number; end: number }[] {
  const positions: number[] = [];
  for (const marker of markers) {
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(marker)) {
        positions.push(i);
        break;
      }
    }
  }
  // Add end
  positions.push(lines.length);

  const bounds: { start: number; end: number }[] = [];
  for (let i = 0; i < positions.length - 1; i++) {
    bounds.push({ start: positions[i], end: positions[i + 1] });
  }
  return bounds;
}

export function parseHighlights(markdown: string): HighlightsResult {
  const lines = markdown.split("\n");

  // Use emoji-specific markers to avoid ambiguity with tab navigation text
  const markerPatterns: [string, RegExp][] = [
    ["Trending Search", /Trending Search 🔥/],
    ["Trending NFT", /Trending NFT 💎/],
    ["Trending Categories", /Trending Categories ✨/],
    ["Trending Coins", /Trending Coins/],
    ["Top Gainers", /Top Gainers/],
    ["Top Losers", /Top Losers/],
    ["Most Viewed", /Most Viewed/],
  ];

  const sectionStarts: Record<string, number> = {};
  for (const [key, pattern] of markerPatterns) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.test(lines[i])) {
        sectionStarts[key] = i;
        break;
      }
    }
  }

  const getRange = (marker: string, nextMarker?: string) => {
    const start = sectionStarts[marker] ?? 0;
    const end = nextMarker ? (sectionStarts[nextMarker] ?? lines.length) : lines.length;
    return { start, end };
  };

  const r1 = getRange("Trending Search", "Trending NFT");
  const r2 = getRange("Trending NFT", "Trending Categories");
  const r3 = getRange("Trending Categories", "Trending Coins");
  const r4 = getRange("Trending Coins", "Top Gainers");
  const r5 = getRange("Top Gainers", "Top Losers");
  const r6 = getRange("Top Losers", "Most Viewed");
  const r7 = getRange("Most Viewed");

  return {
    trending_search: parseTrendingSearch(lines, r1.start, r1.end),
    trending_nft: parseTrendingNft(lines, r2.start, r2.end),
    trending_categories: parseTrendingCategories(lines, r3.start, r3.end),
    trending_coins: parseCoinList(lines, r4.start, r4.end),
    top_gainers: parseCoinList(lines, r5.start, r5.end),
    top_losers: parseCoinList(lines, r6.start, r6.end),
    most_viewed: parseCoinList(lines, r7.start, r7.end),
  };
}

async function main() {
  console.log("Fetching highlights from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/highlights");
  const markdown = data?.extracted_content ?? "";
  const result = parseHighlights(markdown);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("highlights_trending.ts") || process.argv[1]?.endsWith("highlights_trending.js");
if (isDirectRun) main();
