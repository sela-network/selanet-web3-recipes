/**
 * Recipe: Recent Blocks from World Chain (Worldscan)
 * Scrapes recent blocks on World Chain Mainnet.
 *
 * URL: https://worldscan.org/blocks
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx worldscan/blocks.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface WorldBlock {
  block: number;
  block_url: string;
  age: string;
  txn: string;
  gas_used: string;
  gas_limit: string;
}

export function parseMarkdownTable(markdown: string): WorldBlock[] {
  const lines = markdown.split("\n");
  const results: WorldBlock[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());

    const blockCell = cells[1] || "";
    const blockMatch = blockCell.match(/\[(\d+)\]\((https:\/\/worldscan\.org\/block\/\d+)\)/);
    if (!blockMatch) continue;

    const txnCell = cells[3] || "";
    const txnMatch = txnCell.match(/\[(\d+)\]/);

    results.push({
      block: parseInt(blockMatch[1], 10),
      block_url: blockMatch[2],
      age: cells[2]?.trim() || "",
      txn: txnMatch ? txnMatch[1] : cells[3]?.trim() || "",
      gas_used: cells[4]?.trim() || "",
      gas_limit: cells[5]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching recent blocks from World Chain...\n");
  const data = await browse("https://worldscan.org/blocks");
  const markdown = data?.extracted_content ?? "";
  const blocks = parseMarkdownTable(markdown);
  console.log(JSON.stringify(blocks, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("blocks.ts") || process.argv[1]?.endsWith("blocks.js");
if (isDirectRun) main();
