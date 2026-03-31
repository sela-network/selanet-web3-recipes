/**
 * Recipe: Recent Blocks from Etherscan
 * Scrapes recent Ethereum blocks with gas and reward data.
 *
 * URL: https://etherscan.io/blocks
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/blocks.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Block {
  block: number;
  block_url: string;
  slot: string;
  age: string;
  blobs: string;
  txn: string;
  fee_recipient: string;
  gas_used: string;
  gas_limit: string;
  base_fee: string;
  reward: string;
  burnt_fees: string;
}

export function parseMarkdownTable(markdown: string): Block[] {
  const lines = markdown.split("\n");
  const results: Block[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, block, slot, age, blobs, txn, fee_recipient, gas_used, gas_limit, base_fee, reward, burnt_fees, empty]

    const blockCell = cells[1] || "";
    const blockMatch = blockCell.match(/\[(\d+)\]\((https:\/\/etherscan\.io\/block\/\d+)\)/);
    if (!blockMatch) continue;

    const txnCell = cells[5] || "";
    const txnMatch = txnCell.match(/\[(\d+)\]/);

    const feeCell = cells[6] || "";
    const feeMatch = feeCell.match(/\[([^\]]+)\]/);

    results.push({
      block: parseInt(blockMatch[1], 10),
      block_url: blockMatch[2],
      slot: cells[2]?.replace(/\[([^\]]+)\]\([^)]+\)/, "$1").trim() || "",
      age: cells[3]?.trim() || "",
      blobs: cells[4]?.trim().replace(/\([^)]*\)/, "").trim() || "",
      txn: txnMatch ? txnMatch[1] : cells[5]?.trim() || "",
      fee_recipient: feeMatch ? feeMatch[1] : cells[6]?.trim() || "",
      gas_used: cells[7]?.trim() || "",
      gas_limit: cells[8]?.trim() || "",
      base_fee: cells[9]?.trim() || "",
      reward: cells[10]?.trim() || "",
      burnt_fees: cells[11]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching recent blocks from Etherscan...\n");
  const data = await browse("https://etherscan.io/blocks");
  const markdown = data?.extracted_content ?? "";
  const blocks = parseMarkdownTable(markdown);
  console.log(JSON.stringify(blocks, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("blocks.ts") || process.argv[1]?.endsWith("blocks.js");
if (isDirectRun) main();
