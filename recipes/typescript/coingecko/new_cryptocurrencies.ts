/**
 * Recipe: New Cryptocurrencies from CoinGecko
 * Scrapes recently listed new token listings.
 *
 * URL: https://www.coingecko.com/en/new-cryptocurrencies
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/new_cryptocurrencies.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface NewCrypto {
  rank: number;
  name: string;
  symbol: string;
  slug: string;
  url: string;
  image: string;
  price: number;
  chain: string;
  change_1h: number;
  change_24h: number;
  volume_24h: number;
  fdv: number;
  last_added: string;
}

export function parseMarkdownTable(markdown: string): NewCrypto[] {
  const lines = markdown.split("\n");
  const results: NewCrypto[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, empty, rank, coin, empty(buy), price, chain, 1h, 24h, volume, fdv, last_added, empty]

    const rank = parseInt(cells[2], 10);
    if (isNaN(rank)) continue;

    const coinCell = cells[3] || "";
    const coinMatch = coinCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\s+(.+?)\s+([A-Z0-9]+)\]\((https:\/\/www\.coingecko\.com\/en\/coins\/([^)]+))\)/
    );

    // Chain: "![](img) ChainName"
    const chainCell = cells[6] || "";
    const chainMatch = chainCell.match(/\)\s+(.+)/);
    const chain = chainMatch ? chainMatch[1].trim() : chainCell.trim();

    const parseNum = (s: string): number => {
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
      price: parseNum(cells[5]),
      chain,
      change_1h: parseNum(cells[7]),
      change_24h: parseNum(cells[8]),
      volume_24h: parseNum(cells[9]),
      fdv: parseNum(cells[10]),
      last_added: cells[11]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching new cryptocurrencies from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/new-cryptocurrencies");
  const markdown = data?.extracted_content ?? "";
  const coins = parseMarkdownTable(markdown);
  console.log(JSON.stringify(coins, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("new_cryptocurrencies.ts") || process.argv[1]?.endsWith("new_cryptocurrencies.js");
if (isDirectRun) main();
