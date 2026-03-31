/**
 * Recipe: Derivatives Exchanges from CoinGecko
 * Scrapes derivatives exchange volume and open interest (OI) rankings.
 *
 * URL: https://www.coingecko.com/en/exchanges/derivatives
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/exchanges_derivatives.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ExchangeDerivatives {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  settlement: string;
  open_interest_24h: number;
  volume_24h: number;
  perpetuals: number;
  futures: number;
  sparkline_open_interest: string;
  sparkline_volume: string;
}

export function parseMarkdownTable(markdown: string): ExchangeDerivatives[] {
  const lines = markdown.split("\n");
  const results: ExchangeDerivatives[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, exchange, settlement, oi_24h, vol_24h, perpetuals, futures, oi_7d_sparkline, vol_7d_sparkline, empty]

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

    const extractSparkline = (cell: string, pattern: RegExp): string => {
      const m = cell.match(pattern);
      return m ? m[0].slice(1, -1) : "";
    };

    results.push({
      rank,
      name,
      slug,
      url,
      image,
      settlement: cells[3] || "",
      open_interest_24h: parseUsd(cells[4]),
      volume_24h: parseUsd(cells[5]),
      perpetuals: parseInt(cells[6], 10) || 0,
      futures: parseInt(cells[7], 10) || 0,
      sparkline_open_interest: extractSparkline(
        cells[8] || "",
        /\(https:\/\/www\.coingecko\.com\/exchanges\/[^)]+\/sparkline_open_interest\.svg\)/
      ),
      sparkline_volume: extractSparkline(
        cells[9] || "",
        /\(https:\/\/www\.coingecko\.com\/exchanges\/[^)]+\/sparkline\.svg\)/
      ),
    });
  }

  return results;
}

async function main() {
  console.log("Fetching derivatives exchange rankings from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/exchanges/derivatives");
  const markdown = data?.extracted_content ?? "";
  const exchanges = parseMarkdownTable(markdown);
  console.log(JSON.stringify(exchanges, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("exchanges_derivatives.ts") || process.argv[1]?.endsWith("exchanges_derivatives.js");
if (isDirectRun) main();
