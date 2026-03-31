/**
 * Recipe: Projects from RootData
 * Scrapes crypto project listings with categories and tags.
 *
 * URL: https://www.rootdata.com/Projects
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/projects.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Project {
  name: string;
  symbol: string;
  slug: string;
  url: string;
  image: string;
  tags: string[];
  ecosystem: string;
  intro: string;
  growth_index: number;
  popularity_index: number;
}

export function parseMarkdownTable(markdown: string): Project[] {
  const lines = markdown.split("\n");
  const results: Project[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, project, tags, ecosystem, intro, growth_index, popularity_index, empty]

    const projCell = cells[1] || "";
    // [![Name](img)](url)  [Name](url) SYMBOL
    const nameMatch = projCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)\s+\[([^\]]+)\]\(https:\/\/www\.rootdata\.com\/Projects\/detail\/([^?]+)\?[^)]*\)(?:\s+([A-Za-z0-9$]+))?/
    );
    if (!nameMatch) continue;

    const name = nameMatch[4];
    const image = nameMatch[2];
    const url = nameMatch[3];
    const slug = nameMatch[5];
    const symbol = nameMatch[6] || "";

    // Tags: "DeFi、Infra、Crypto Card" (fullwidth comma separator)
    const tagsStr = cells[2] || "";
    const tags = tagsStr
      .split(/[、,]/)
      .map((t) => t.trim())
      .filter(Boolean);

    // Ecosystem: ![EcoName](img)
    const ecoCell = cells[3] || "";
    const ecoMatch = ecoCell.match(/!\[([^\]]*)\]/);
    const ecosystem = ecoMatch ? ecoMatch[1] : "";

    const intro = cells[4]?.trim() || "";

    // Growth index: "![](icon) 795"
    const growthCell = cells[5] || "";
    const growthMatch = growthCell.match(/(\d+)\s*$/);
    const growthIndex = growthMatch ? parseInt(growthMatch[1], 10) : 0;

    // Popularity index
    const popCell = cells[6] || "";
    const popMatch = popCell.match(/(\d+)\s*$/);
    const popularityIndex = popMatch ? parseInt(popMatch[1], 10) : 0;

    results.push({
      name,
      symbol,
      slug,
      url,
      image,
      tags,
      ecosystem,
      intro,
      growth_index: growthIndex,
      popularity_index: popularityIndex,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching projects from RootData...\n");
  const data = await browse("https://www.rootdata.com/Projects");
  const markdown = data?.extracted_content ?? "";
  const projects = parseMarkdownTable(markdown);
  console.log(JSON.stringify(projects, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("projects.ts") || process.argv[1]?.endsWith("projects.js");
if (isDirectRun) main();
