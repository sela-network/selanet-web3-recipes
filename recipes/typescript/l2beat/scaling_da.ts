/**
 * Recipe: L2 Data Availability from L2Beat
 * Scrapes data availability solution comparisons across Layer 2s.
 *
 * URL: https://l2beat.com/scaling/data-availability
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx l2beat/scaling_da.ts
 *   npx tsx l2beat/scaling_da.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

interface L2DataAvailability {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  da_layer: string;
  da_bridge: string;
  type: string;
}

function cleanCell(cell: string): string {
  return cell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim();
}

export function parseMarkdownTable(markdown: string): L2DataAvailability[] {
  const lines = markdown.split("\n");
  const results: L2DataAvailability[] = [];

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

    results.push({
      rank,
      name: nameMatch[1],
      slug: nameMatch[3],
      url: nameMatch[2],
      image: imgMatch ? imgMatch[1] : "",
      da_layer: cleanCell(cells[4] || ""),
      da_bridge: cleanCell(cells[5] || ""),
      type: cleanCell(cells[6] || ""),
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  console.log("Fetching L2 data availability from L2Beat...\n");

  const data = await browse("https://l2beat.com/scaling/data-availability");
  const md = data?.extracted_content ?? "";

  if (debug) { printMarkdown(data); console.log("\n--- Parsed ---\n"); }

  const entries = parseMarkdownTable(md);
  console.log(JSON.stringify(entries, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("scaling_da.ts") || process.argv[1]?.endsWith("scaling_da.js");
if (isDirectRun) main();
