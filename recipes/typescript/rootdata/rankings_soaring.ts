/**
 * Recipe: Soaring Rankings from RootData
 * Scrapes trending/soaring project rankings by popularity.
 *
 * URL: https://www.rootdata.com/rankings/soaring
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/rankings_soaring.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface SoaringProject {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  tags: string[];
  popularity_trend_24h: string;
  user_rating: string;
}

export function parseMarkdownTable(markdown: string): SoaringProject[] {
  const lines = markdown.split("\n");
  const results: SoaringProject[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, project_name, tags, popularity_trend, user_rating, empty]

    // Rank: "1   ![](base64...)" - extract leading number
    const rankMatch = cells[1]?.match(/^(\d+)/);
    if (!rankMatch) continue;
    const rank = parseInt(rankMatch[1], 10);

    const projCell = cells[2] || "";
    const nameMatch = projCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]+\)\s+\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/Projects\/detail\/([^?]+)\?[^)]*)\)/
    );
    if (!nameMatch) continue;

    const tagsStr = cells[3] || "";
    // Tags may be markdown links: [#DeFi](url) [#RWA](url) or plain "DeFi、RWA"
    const tagLinks = [...tagsStr.matchAll(/\[#([^\]]+)\]\([^)]+\)/g)];
    const tags = tagLinks.length > 0
      ? tagLinks.map((m) => m[1])
      : tagsStr.split(/[、,]/).map((t) => t.trim()).filter(Boolean);

    const trend = cells[4]?.trim() || "";
    const rating = cells[5]?.trim().replace(/!\[[^\]]*\]\([^)]+\)/g, "").trim() || "";

    results.push({
      rank,
      name: nameMatch[3],
      slug: nameMatch[5],
      url: nameMatch[4],
      image: nameMatch[2],
      tags,
      popularity_trend_24h: trend,
      user_rating: rating,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching soaring rankings from RootData...\n");
  const data = await browse("https://www.rootdata.com/rankings/soaring");
  const markdown = data?.extracted_content ?? "";
  const projects = parseMarkdownTable(markdown);
  console.log(JSON.stringify(projects, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("rankings_soaring.ts") || process.argv[1]?.endsWith("rankings_soaring.js");
if (isDirectRun) main();
