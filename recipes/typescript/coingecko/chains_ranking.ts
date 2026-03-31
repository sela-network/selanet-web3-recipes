/**
 * Recipe: Chain Ranking from CoinGecko
 * Scrapes blockchain network rankings by market cap and TVL.
 *
 * URL: https://www.coingecko.com/en/chains
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/chains_ranking.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TopGainer {
  name: string;
  url: string;
  image: string;
}

interface ChainRanking {
  rank: number;
  chain: string;
  slug: string;
  url: string;
  image: string;
  top_gainers: TopGainer[];
  change_24h: number;
  change_7d: number;
  change_30d: number;
  volume_24h: number;
  tvl: number;
  dominance: number;
  num_coins: number;
  sparkline: string;
}

function parseTopGainers(cell: string): TopGainer[] {
  const gainers: TopGainer[] = [];
  const regex =
    /\[!\[([^\]]*)\]\(([^)]+)\)\]\(https:\/\/www\.coingecko\.com\/en\/coins\/([^)]+)\)/g;
  let match;
  while ((match = regex.exec(cell)) !== null) {
    gainers.push({
      name: match[3],
      url: `https://www.coingecko.com/en/coins/${match[3]}`,
      image: match[2],
    });
  }
  return gainers;
}

export function parseMarkdownTable(markdown: string): ChainRanking[] {
  const lines = markdown.split("\n");
  const results: ChainRanking[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, chain, top_gainers, 24h, 7d, 30d, volume, tvl, dominance, num_coins, sparkline, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const chainCell = cells[2] || "";
    const linkMatch = chainCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\s+([^\]]+)\]\((https:\/\/www\.coingecko\.com\/en\/chains\/([^)]+))\)/
    );
    const chain = linkMatch ? linkMatch[3].trim() : chainCell;
    const image = linkMatch ? linkMatch[2] : "";
    const url = linkMatch ? linkMatch[4] : "";
    const slug = linkMatch ? linkMatch[5] : "";

    const parsePercent = (s: string): number => {
      const n = parseFloat(s?.replace(/%/g, "").trim());
      return isNaN(n) ? 0 : n;
    };

    const parseUsd = (s: string): number => {
      const n = parseFloat(s?.replace(/[$,%\s]/g, "").replace(/,/g, ""));
      return isNaN(n) ? 0 : n;
    };

    const sparklineCell = cells[11] || "";
    const sparkMatch = sparklineCell.match(
      /\(https:\/\/www\.coingecko\.com\/chains\/[^)]+\/sparkline\.svg\)/
    );
    const sparkline = sparkMatch ? sparkMatch[0].slice(1, -1) : "";

    results.push({
      rank,
      chain,
      slug,
      url,
      image,
      top_gainers: parseTopGainers(cells[3] || ""),
      change_24h: parsePercent(cells[4]),
      change_7d: parsePercent(cells[5]),
      change_30d: parsePercent(cells[6]),
      volume_24h: parseUsd(cells[7]),
      tvl: parseUsd(cells[8]),
      dominance: parsePercent(cells[9]),
      num_coins: parseInt(cells[10], 10) || 0,
      sparkline,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching chain rankings from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/chains");
  const markdown = data?.extracted_content ?? "";
  const chains = parseMarkdownTable(markdown);
  console.log(JSON.stringify(chains, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("chains_ranking.ts") || process.argv[1]?.endsWith("chains_ranking.js");
if (isDirectRun) main();
