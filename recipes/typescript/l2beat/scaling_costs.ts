/**
 * Recipe: L2 Scaling Costs from L2Beat
 * Scrapes transaction cost comparison across Layer 2 solutions.
 *
 * URL: https://l2beat.com/scaling/costs
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx l2beat/scaling_costs.ts
 *   npx tsx l2beat/scaling_costs.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

interface L2ScalingCost {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  avg_per_user_op: string;
  calldata: string;
  blobs: string;
  compute: string;
  overhead: string;
  user_ops_count: string;
}

function cleanCell(cell: string): string {
  return cell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
}

export function parseMarkdownTable(markdown: string): L2ScalingCost[] {
  const lines = markdown.split("\n");
  const results: L2ScalingCost[] = [];

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

    // Table: | # | icon | name | Avg PER L2 User op | (empty) | Calldata | Blobs | Compute | Overhead | L2 User ops count |
    results.push({
      rank,
      name: nameMatch[1],
      slug: nameMatch[3],
      url: nameMatch[2],
      image: imgMatch ? imgMatch[1] : "",
      avg_per_user_op: cleanCell(cells[4] || ""),
      calldata: cleanCell(cells[6] || ""),
      blobs: cleanCell(cells[7] || ""),
      compute: cleanCell(cells[8] || ""),
      overhead: cleanCell(cells[9] || ""),
      user_ops_count: cleanCell(cells[10] || ""),
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  console.log("Fetching L2 scaling costs from L2Beat...\n");

  const data = await browse("https://l2beat.com/scaling/costs");
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const costs = parseMarkdownTable(md);
  console.log(JSON.stringify(costs, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("scaling_costs.ts") || process.argv[1]?.endsWith("scaling_costs.js");
if (isDirectRun) main();
