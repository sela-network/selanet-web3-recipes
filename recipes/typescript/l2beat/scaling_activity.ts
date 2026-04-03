/**
 * Recipe: L2 Scaling Activity from L2Beat
 * Scrapes daily transaction counts across Layer 2 solutions.
 *
 * URL: https://l2beat.com/scaling/activity
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx l2beat/scaling_activity.ts
 *   npx tsx l2beat/scaling_activity.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

interface L2Activity {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  type: string;
  past_day_uops: string;
  max_daily_uops: string;
  count_30d: string;
  uops_tps_ratio: string;
}

function cleanCell(cell: string): string {
  return cell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
}

export function parseMarkdownTable(markdown: string): L2Activity[] {
  const lines = markdown.split("\n");
  const results: L2Activity[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5) continue;

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const iconCell = cells[2] || "";
    const imgMatch = iconCell.match(/!\[[^\]]*\]\(([^)]+)\)/);

    const nameCell = cells[3] || "";
    const nameMatch = nameCell.match(
      /\[([^\]]+)\]\((https:\/\/l2beat\.com\/scaling\/projects\/([^)#]+))/
    );
    if (!nameMatch) continue;

    // Table: | # | icon | name | Type | Past day UOPS | Max UOPS | 30D Count | UOPS/TPS RATIO |
    results.push({
      rank,
      name: nameMatch[1],
      slug: nameMatch[3],
      url: nameMatch[2],
      image: imgMatch ? imgMatch[1] : "",
      type: cleanCell(cells[4] || ""),
      past_day_uops: cleanCell(cells[5] || ""),
      max_daily_uops: cleanCell(cells[6] || ""),
      count_30d: cleanCell(cells[7] || ""),
      uops_tps_ratio: cleanCell(cells[8] || ""),
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  console.log("Fetching L2 scaling activity from L2Beat...\n");

  const data = await browse("https://l2beat.com/scaling/activity");
  const md = data?.extracted_content ?? "";

  if (debug) { printMarkdown(data); console.log("\n--- Parsed ---\n"); }

  const activities = parseMarkdownTable(md);
  console.log(JSON.stringify(activities, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("scaling_activity.ts") || process.argv[1]?.endsWith("scaling_activity.js");
if (isDirectRun) main();
