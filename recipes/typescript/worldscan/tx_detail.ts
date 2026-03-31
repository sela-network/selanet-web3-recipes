/**
 * Recipe: Transaction Detail from World Chain (Worldscan)
 * Scrapes detailed information for a specific World Chain transaction.
 *
 * URL: https://worldscan.org/tx/{hash}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx worldscan/tx_detail.ts 0x58064d272b6634bac928e733dc92f35f10b34cbd204e595281b2bcba480dfcc9
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TxDetail {
  tx_hash: string;
  status: string;
  block: string;
  block_url: string;
  timestamp: string;
  from: string;
  from_url: string;
  to: string;
  to_url: string;
  value: string;
  transaction_fee: string;
  gas_price: string;
  gas_limit_usage: string;
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

function extractLink(lines: string[], label: string): { text: string; url: string } {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const m = lines[j].match(/\[([^\]]+)\]\((https:\/\/worldscan\.org\/[^)]+)\)/);
        if (m) return { text: m[1], url: m[2] };
      }
    }
  }
  return { text: "", url: "" };
}

export function parseTxDetail(markdown: string): TxDetail {
  const lines = markdown.split("\n");

  const txHashField = extractField(lines, "Transaction Hash:");
  const txHash = txHashField.replace(/\s*\[.*$/, "").trim();
  const block = extractLink(lines, "Block:");
  const from = extractLink(lines, "From:");
  const to = extractLink(lines, "Interacted With (To):");
  const toAlt = to.text ? to : extractLink(lines, "To:");

  return {
    tx_hash: txHash,
    status: extractField(lines, "Status:"),
    block: block.text,
    block_url: block.url,
    timestamp: extractField(lines, "Timestamp:"),
    from: from.text,
    from_url: from.url,
    to: toAlt.text,
    to_url: toAlt.url,
    value: extractField(lines, "Value:"),
    transaction_fee: extractField(lines, "Transaction Fee:"),
    gas_price: extractField(lines, "Gas Price:"),
    gas_limit_usage: extractField(lines, "Gas Limit & Usage by Txn:"),
  };
}

async function main() {
  const txHash = process.argv[2] || "0x58064d272b6634bac928e733dc92f35f10b34cbd204e595281b2bcba480dfcc9";
  const url = txHash.startsWith("http") ? txHash : `https://worldscan.org/tx/${txHash}`;
  console.log(`Fetching tx detail from World Chain: ${txHash.substring(0, 16)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseTxDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("tx_detail.ts") || process.argv[1]?.endsWith("tx_detail.js");
if (isDirectRun) main();
