/**
 * Recipe: Crypto Exchanges from CoinGecko
 * Scrapes centralized exchange (CEX) trust scores and volume rankings.
 *
 * URL: https://www.coingecko.com/en/exchanges
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/exchanges_cex.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ExchangeCex {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  trust_score: string;
  volume_24h: number;
  sparkline: string;
}

export function parseMarkdownTable(markdown: string): ExchangeCex[] {
  const lines = markdown.split("\n");
  const results: ExchangeCex[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, exchange, trust_score, volume_24h, sparkline, empty]

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

    const trustScore = cells[3]?.trim() || "";

    // Volume: "$7,283,787,393" or "BTC109,976.6631"
    const volCell = cells[4] || "";
    let volume = 0;
    const usdMatch = volCell.match(/\$([\d,]+(?:\.\d+)?)/);
    const btcMatch = volCell.match(/BTC([\d,]+(?:\.\d+)?)/);
    if (usdMatch) {
      volume = parseFloat(usdMatch[1].replace(/,/g, ""));
    } else if (btcMatch) {
      volume = parseFloat(btcMatch[1].replace(/,/g, ""));
    }

    const sparkCell = cells[5] || "";
    const sparkMatch = sparkCell.match(
      /\(https:\/\/www\.coingecko\.com\/exchanges\/[^)]+\/sparkline\.svg\)/
    );
    const sparkline = sparkMatch ? sparkMatch[0].slice(1, -1) : "";

    results.push({
      rank,
      name,
      slug,
      url,
      image,
      trust_score: trustScore,
      volume_24h: volume,
      sparkline,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching exchange rankings from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/exchanges");
  const markdown = data?.extracted_content ?? "";
  const exchanges = parseMarkdownTable(markdown);
  console.log(JSON.stringify(exchanges, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("exchanges_cex.ts") || process.argv[1]?.endsWith("exchanges_cex.js");
if (isDirectRun) main();
