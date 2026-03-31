/**
 * Recipe: Transaction Detail from Arc Testnet (Arcscan)
 * Scrapes detailed information for a specific transaction.
 *
 * URL: https://testnet.arcscan.app/tx/{hash}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/tx_detail.ts 0x3f9699f86445110f99abfb7435a02a4153d1c42b637c7e4f6481eb4c0c6bdc5f
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
  transaction_action: string;
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

export function parseTxDetail(markdown: string): TxDetail {
  const lines = markdown.split("\n");

  const txHash = extractField(lines, "Transaction hash");
  const statusField = extractField(lines, "Status and method");
  const status = statusField.replace(/placeholder.*/, "").trim();

  const block = extractLink(lines, "Block");
  const from = extractLink(lines, "From");
  const to = extractLink(lines, "To");

  return {
    tx_hash: txHash,
    status,
    block: block.text,
    block_url: block.url,
    timestamp: extractField(lines, "Timestamp"),
    from: from.text,
    from_url: from.url,
    to: to.text,
    to_url: to.url,
    value: extractField(lines, "Value"),
    transaction_fee: extractField(lines, "Transaction fee"),
    transaction_action: extractField(lines, "Transaction action"),
  };
}

async function main() {
  const txHash = process.argv[2] || "0x3f9699f86445110f99abfb7435a02a4153d1c42b637c7e4f6481eb4c0c6bdc5f";
  const url = txHash.startsWith("http") ? txHash : `https://testnet.arcscan.app/tx/${txHash}`;

  console.log(`Fetching tx detail from Arc Testnet: ${txHash.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseTxDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("tx_detail.ts") || process.argv[1]?.endsWith("tx_detail.js");
if (isDirectRun) main();
