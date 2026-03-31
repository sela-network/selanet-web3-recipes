/**
 * Recipe: Recent Blocks from Arc Testnet (Arcscan)
 * Scrapes recent blocks on Arc Testnet.
 *
 * URL: https://testnet.arcscan.app/blocks
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/blocks.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ArcBlock {
  block: string;
  block_url: string;
  size_bytes: string;
  fee_recipient: string;
  txn: string;
  gas_used: string;
}

export function parseMarkdownTable(markdown: string): ArcBlock[] {
  const lines = markdown.split("\n");
  const results: ArcBlock[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, block, size, fee_recipient, txn, gas_used, empty]

    const blockCell = cells[1] || "";
    const blockMatch = blockCell.match(
      /\[(\d+)\]\((https:\/\/testnet\.arcscan\.app\/block\/[^)]+)\)/
    );
    if (!blockMatch) continue;

    // Fee recipient may contain a link
    const feeCell = cells[3] || "";
    const feeMatch = feeCell.match(/\[([^\]]+)\]/);

    results.push({
      block: blockMatch[1],
      block_url: blockMatch[2],
      size_bytes: cells[2]?.trim() || "",
      fee_recipient: feeMatch ? feeMatch[1] : feeCell,
      txn: cells[4]?.trim() || "",
      gas_used: cells[5]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching recent blocks from Arc Testnet...\n");
  const data = await browse("https://testnet.arcscan.app/blocks");
  const markdown = data?.extracted_content ?? "";
  const blocks = parseMarkdownTable(markdown);
  console.log(JSON.stringify(blocks, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("blocks.ts") || process.argv[1]?.endsWith("blocks.js");
if (isDirectRun) main();
