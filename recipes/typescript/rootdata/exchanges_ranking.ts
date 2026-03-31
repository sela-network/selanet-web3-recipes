/**
 * Recipe: Exchange Rankings from RootData
 * Scrapes crypto exchange transparency scores and trading volumes.
 *
 * URL: https://www.rootdata.com/exchanges/ranking
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/exchanges_ranking.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ExchangeRanking {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  transparency_score: string;
  wealth_potential: string;
  volume_24h: string;
  overall_score: string;
}

export function parseMarkdownTable(markdown: string): ExchangeRanking[] {
  const lines = markdown.split("\n");
  const results: ExchangeRanking[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, exchange, transparency, wealth, volume, overall, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const exchCell = cells[2] || "";
    const match = exchCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)[^\]]*\]\([^)]*\)/
    );
    // Extract name from alt text or link text
    const nameMatch = exchCell.match(
      /\[!\[[^\]]*\]\([^)]+\)[^[]*\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/[^)]+)\)/
    );
    // Fallback: try simpler pattern
    const simpleMatch = exchCell.match(
      /\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/Projects\/detail\/([^?]+)\?[^)]*)\)/
    );

    let name = "";
    let url = "";
    let slug = "";
    let image = "";

    if (nameMatch) {
      name = nameMatch[1];
      url = nameMatch[2];
    } else if (simpleMatch) {
      name = simpleMatch[1];
      url = simpleMatch[2];
      slug = simpleMatch[3];
    }

    const imgMatch = exchCell.match(/!\[[^\]]*\]\(([^)]+)\)/);
    if (imgMatch) image = imgMatch[1];

    const slugMatch = url.match(/detail\/([^?]+)/);
    if (slugMatch) slug = decodeURIComponent(slugMatch[1]);

    if (!name) continue;

    results.push({
      rank,
      name,
      slug,
      url,
      image,
      transparency_score: cells[3]?.trim() || "",
      wealth_potential: cells[4]?.trim() || "",
      volume_24h: cells[5]?.trim() || "",
      overall_score: cells[6]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching exchange rankings from RootData...\n");
  const data = await browse("https://www.rootdata.com/exchanges/ranking");
  const markdown = data?.extracted_content ?? "";
  const exchanges = parseMarkdownTable(markdown);
  console.log(JSON.stringify(exchanges, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("exchanges_ranking.ts") || process.argv[1]?.endsWith("exchanges_ranking.js");
if (isDirectRun) main();
