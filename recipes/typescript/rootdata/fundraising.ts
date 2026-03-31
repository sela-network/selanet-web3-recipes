/**
 * Recipe: Fundraising Data from RootData
 * Scrapes recent and historical fundraising data in crypto industry.
 *
 * URL: https://www.rootdata.com/Fundraising
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/fundraising.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Investor {
  name: string;
  url: string;
  image: string;
}

interface FundraisingRound {
  project: string;
  slug: string;
  url: string;
  image: string;
  round: string;
  amount: string;
  valuation: string;
  date: string;
  source_url: string;
  investors: Investor[];
}

export function parseMarkdownTable(markdown: string): FundraisingRound[] {
  const lines = markdown.split("\n");
  const results: FundraisingRound[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, project, round, amount, valuation, date, source, investors, empty]

    const projCell = cells[1] || "";
    const nameMatch = projCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]+\)\s+\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/Projects\/detail\/([^?]+)\?[^)]*)\)/
    );
    if (!nameMatch) continue;

    const project = nameMatch[3];
    const image = nameMatch[2];
    const url = nameMatch[4];
    const slug = nameMatch[5];

    const round = cells[2]?.trim() || "";
    const amount = cells[3]?.trim() || "";
    const valuation = cells[4]?.trim() || "";
    const date = cells[5]?.trim() || "";

    // Source URL
    const sourceCell = cells[6] || "";
    const sourceMatch = sourceCell.match(/\]\((https?:\/\/[^)]+)\)/);
    const sourceUrl = sourceMatch ? sourceMatch[1] : "";

    // Investors: [![Name](img) Name](url)
    const invCell = cells[7] || "";
    const investors: Investor[] = [];
    const invRegex =
      /\[!\[([^\]]*)\]\(([^)]+)\)\s+([^\]]+)\]\((https:\/\/www\.rootdata\.com\/Investors\/detail\/[^)]+)\)/g;
    let m;
    while ((m = invRegex.exec(invCell)) !== null) {
      investors.push({
        name: m[3].trim(),
        url: m[4],
        image: m[2],
      });
    }

    results.push({
      project,
      slug,
      url,
      image,
      round,
      amount,
      valuation,
      date,
      source_url: sourceUrl,
      investors,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching fundraising data from RootData...\n");
  const data = await browse("https://www.rootdata.com/Fundraising");
  const markdown = data?.extracted_content ?? "";
  const rounds = parseMarkdownTable(markdown);
  console.log(JSON.stringify(rounds, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("fundraising.ts") || process.argv[1]?.endsWith("fundraising.js");
if (isDirectRun) main();
