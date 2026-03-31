/**
 * Recipe: Block Detail from Arc Testnet (Arcscan)
 * Scrapes detailed information for a specific block.
 *
 * URL: https://testnet.arcscan.app/block/{number}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/block_detail.ts 34746818
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface BlockDetail {
  block_height: string;
  timestamp: string;
  transactions: string;
  fee_recipient: string;
  fee_recipient_url: string;
  gas_used: string;
  gas_limit: string;
  base_fee_per_gas: string;
  priority_fee: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === label || lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && val !== "*" && !val.startsWith("*") && !val.startsWith("![")) return val;
      }
    }
  }
  return "";
}

function extractLink(lines: string[], label: string): { text: string; url: string } {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === label || lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
        const m = lines[j].match(/\[([^\]]+)\]\((https:\/\/testnet\.arcscan\.app\/[^)]+)\)/);
        if (m) return { text: m[1], url: m[2] };
      }
    }
  }
  return { text: "", url: "" };
}

export function parseBlockDetail(markdown: string): BlockDetail {
  const lines = markdown.split("\n");

  const feeRecipient = extractLink(lines, "Fee recipient");
  const txns = extractField(lines, "Transactions");

  return {
    block_height: extractField(lines, "Block height"),
    timestamp: extractField(lines, "Timestamp"),
    transactions: txns.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1"),
    fee_recipient: feeRecipient.text,
    fee_recipient_url: feeRecipient.url,
    gas_used: extractField(lines, "Gas used"),
    gas_limit: extractField(lines, "Gas limit"),
    base_fee_per_gas: extractField(lines, "Base fee per gas"),
    priority_fee: extractField(lines, "Priority fee / Tip"),
  };
}

async function main() {
  const blockNum = process.argv[2] || "34746818";
  const url = blockNum.startsWith("http") ? blockNum : `https://testnet.arcscan.app/block/${blockNum}`;

  console.log(`Fetching block detail from Arc Testnet: ${blockNum}\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseBlockDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("block_detail.ts") || process.argv[1]?.endsWith("block_detail.js");
if (isDirectRun) main();
