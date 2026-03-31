/**
 * Recipe: Decentralized Exchanges from CoinGecko
 * Scrapes decentralized exchange (DEX) volume rankings.
 *
 * URL: https://www.coingecko.com/en/exchanges/decentralized
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/exchanges_dex.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ExchangeDex {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  volume_24h: number;
  market_share: number;
  num_coins: number;
  num_pairs: number;
  most_traded_pair: string;
}

export function parseMarkdownTable(markdown: string): ExchangeDex[] {
  const lines = markdown.split("\n");
  const results: ExchangeDex[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, exchange, volume, market_share, coins_pairs, most_traded, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const exchCell = cells[2] || "";
    const linkMatch = exchCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\s+([^\]]+)\]\((https:\/\/www\.coingecko\.com\/en\/exchanges\/([^)]+))\)/
    );
    const name = linkMatch ? linkMatch[3].trim() : "";
    const image = linkMatch ? linkMatch[2] : "";
    const url = linkMatch ? linkMatch[4] : "";
    const slug = linkMatch ? linkMatch[5] : "";

    const parseUsd = (s: string): number => {
      const n = parseFloat(s?.replace(/[$,\s]/g, ""));
      return isNaN(n) ? 0 : n;
    };

    const parsePercent = (s: string): number => {
      const n = parseFloat(s?.replace(/%/g, "").trim());
      return isNaN(n) ? 0 : n;
    };

    // "989 / 1,547"
    const pairsCell = cells[5] || "";
    const pairsMatch = pairsCell.match(/([\d,]+)\s*\/\s*([\d,]+)/);
    const numCoins = pairsMatch ? parseInt(pairsMatch[1].replace(/,/g, ""), 10) : 0;
    const numPairs = pairsMatch ? parseInt(pairsMatch[2].replace(/,/g, ""), 10) : 0;

    // Most traded pair: "WETH/0XA0B...  $223,540,467.78"
    const mostTraded = (cells[6] || "").trim();

    results.push({
      rank,
      name,
      slug,
      url,
      image,
      volume_24h: parseUsd(cells[3]),
      market_share: parsePercent(cells[4]),
      num_coins: numCoins,
      num_pairs: numPairs,
      most_traded_pair: mostTraded,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching DEX rankings from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/exchanges/decentralized");
  const markdown = data?.extracted_content ?? "";
  const exchanges = parseMarkdownTable(markdown);
  console.log(JSON.stringify(exchanges, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("exchanges_dex.ts") || process.argv[1]?.endsWith("exchanges_dex.js");
if (isDirectRun) main();
