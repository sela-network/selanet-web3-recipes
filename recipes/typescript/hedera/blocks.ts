/**
 * Recipe: Recent Blocks from Hedera (HashScan) (SPA)
 * Scrapes recent blocks on Hedera Mainnet.
 *
 * URL: https://hashscan.io/mainnet/blocks
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx hedera/blocks.ts
 *   npx tsx hedera/blocks.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildUrl } from "./utils.js";

export interface HederaBlock {
  block: string;
  block_url: string;
  start_time: string;
  transactions: string;
  gas_used: string;
}

export function parseBlocks(markdown: string): HederaBlock[] {
  const lines = markdown.split("\n");
  const results: HederaBlock[] = [];

  // HashScan table: | NUMBER | START TIME | NO. TRANSACTIONS | GAS USED |
  // Block numbers are plain text (no links)
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 4) continue;

    const blockNum = cells[1] || "";
    if (blockNum.startsWith("---") || blockNum.toLowerCase() === "number" || !/^\d+$/.test(blockNum)) continue;

    results.push({
      block: blockNum,
      block_url: `https://hashscan.io/mainnet/block/${blockNum}`,
      start_time: cells[2] || "",
      transactions: cells[3] || "",
      gas_used: cells[4] || "",
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildUrl("blocks");
  console.log(`Fetching recent blocks from Hedera: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const blocks = parseBlocks(md);
  console.log(JSON.stringify(blocks, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("blocks.ts") || process.argv[1]?.endsWith("blocks.js");
if (isDirectRun) main();
