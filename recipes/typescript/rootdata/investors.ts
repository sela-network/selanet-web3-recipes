/**
 * Recipe: Investors from RootData
 * Scrapes crypto investor/VC rankings with portfolio data.
 *
 * URL: https://www.rootdata.com/Investors
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/investors.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface InvestorInfo {
  name: string;
  slug: string;
  url: string;
  image: string;
  founded: string;
  latest_investment: string;
  rounds_1yr: number;
  portfolio: number;
  total_raised: string;
}

export function parseMarkdownTable(markdown: string): InvestorInfo[] {
  const lines = markdown.split("\n");
  const results: InvestorInfo[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, name, founded, latest_investment, rounds_1yr, portfolio, total_raised, empty]

    const nameCell = cells[1] || "";
    const match = nameCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]+\)\s+\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/Investors\/detail\/([^?]+)(?:\?[^)]*)?)\)/
    );
    if (!match) continue;

    results.push({
      name: match[3],
      slug: decodeURIComponent(match[5]),
      url: match[4],
      image: match[2],
      founded: cells[2]?.trim() || "",
      latest_investment: cells[3]?.trim() || "",
      rounds_1yr: parseInt(cells[4], 10) || 0,
      portfolio: parseInt(cells[5], 10) || 0,
      total_raised: cells[6]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching investors from RootData...\n");
  const data = await browse("https://www.rootdata.com/Investors");
  const markdown = data?.extracted_content ?? "";
  const investors = parseMarkdownTable(markdown);
  console.log(JSON.stringify(investors, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("investors.ts") || process.argv[1]?.endsWith("investors.js");
if (isDirectRun) main();
