/**
 * Recipe: Gainers & Losers from CoinGecko
 * Scrapes top gaining and losing tokens over the last 24 hours.
 *
 * URL: https://www.coingecko.com/en/crypto-gainers-losers
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/crypto_gainers_losers.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface GainerLoser {
  rank: number;
  name: string;
  symbol: string;
  slug: string;
  url: string;
  image: string;
  price: number;
  volume_24h: number;
  change_24h: number;
}

interface GainersLosersResult {
  top_gainers: GainerLoser[];
  top_losers: GainerLoser[];
}

function parseRows(lines: string[]): GainerLoser[] {
  const results: GainerLoser[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, empty, rank, name_link, price, volume, change_24h, empty]

    const rank = parseInt(cells[2], 10);
    if (isNaN(rank)) continue;

    const nameCell = cells[3] || "";
    const coinMatch = nameCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\s+(.+?)\s+([A-Z0-9]+)\]\((https:\/\/www\.coingecko\.com\/en\/coins\/([^)]+))\)/
    );

    const parseUsd = (s: string): number => {
      const n = parseFloat(s?.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      return isNaN(n) ? 0 : n;
    };

    results.push({
      rank,
      name: coinMatch ? coinMatch[3] : "",
      symbol: coinMatch ? coinMatch[4] : "",
      slug: coinMatch ? coinMatch[6] : "",
      url: coinMatch ? coinMatch[5] : "",
      image: coinMatch ? coinMatch[2] : "",
      price: parseUsd(cells[4]),
      volume_24h: parseUsd(cells[5]),
      change_24h: parseUsd(cells[6]),
    });
  }

  return results;
}

export function parseMarkdown(markdown: string): GainersLosersResult {
  const lines = markdown.split("\n");

  let gainersStart = -1;
  let losersStart = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/Top Gainers/.test(lines[i])) gainersStart = i;
    if (/Top Losers/.test(lines[i])) losersStart = i;
  }

  const gainersLines =
    gainersStart >= 0 && losersStart >= 0
      ? lines.slice(gainersStart, losersStart)
      : [];

  const losersLines = losersStart >= 0 ? lines.slice(losersStart) : [];

  return {
    top_gainers: parseRows(gainersLines),
    top_losers: parseRows(losersLines),
  };
}

async function main() {
  console.log("Fetching gainers & losers from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/crypto-gainers-losers");
  const markdown = data?.extracted_content ?? "";
  const result = parseMarkdown(markdown);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("crypto_gainers_losers.ts") || process.argv[1]?.endsWith("crypto_gainers_losers.js");
if (isDirectRun) main();
