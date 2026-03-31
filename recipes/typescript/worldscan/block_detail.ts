/**
 * Recipe: Block Detail from World Chain (Worldscan)
 * Scrapes detailed information for a specific World Chain block.
 *
 * URL: https://worldscan.org/block/{number}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx worldscan/block_detail.ts 27812998
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface BlockDetail {
  block_height: string;
  status: string;
  timestamp: string;
  transactions: string;
  gas_used: string;
  gas_limit: string;
  base_fee: string;
  burnt_fees: string;
  hash: string;
  parent_hash: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && val !== "|" && !val.startsWith("*")) return val;
      }
    }
  }
  return "";
}

export function parseBlockDetail(markdown: string): BlockDetail {
  const lines = markdown.split("\n");

  const parentField = extractField(lines, "Parent Hash:");
  const parentMatch = parentField.match(/\[([^\]]+)\]/);

  return {
    block_height: extractField(lines, "Block Height:"),
    status: extractField(lines, "Status:"),
    timestamp: extractField(lines, "Timestamp:"),
    transactions: extractField(lines, "Transactions:"),
    gas_used: extractField(lines, "Gas Used:"),
    gas_limit: extractField(lines, "Gas Limit:"),
    base_fee: extractField(lines, "Base Fee Per Gas:"),
    burnt_fees: extractField(lines, "Burnt Fees:"),
    hash: extractField(lines, "Hash:"),
    parent_hash: parentMatch ? parentMatch[1] : parentField,
  };
}

async function main() {
  const blockNum = process.argv[2] || "27812998";
  const url = blockNum.startsWith("http") ? blockNum : `https://worldscan.org/block/${blockNum}`;
  console.log(`Fetching block detail from World Chain: ${blockNum}\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseBlockDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("block_detail.ts") || process.argv[1]?.endsWith("block_detail.js");
if (isDirectRun) main();
