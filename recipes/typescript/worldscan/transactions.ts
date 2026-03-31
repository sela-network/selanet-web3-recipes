/**
 * Recipe: Recent Transactions from World Chain (Worldscan)
 * Scrapes recent transactions on World Chain Mainnet.
 *
 * URL: https://worldscan.org/txs
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx worldscan/transactions.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface WorldTransaction {
  tx_hash: string;
  tx_url: string;
  action: string;
  block: string;
  age: string;
  from: string;
  to: string;
  amount: string;
  txn_fee: string;
}

export function parseMarkdownTable(markdown: string): WorldTransaction[] {
  const lines = markdown.split("\n");
  const results: WorldTransaction[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());

    const txCell = cells[2] || "";
    const txMatch = txCell.match(/\[([0-9a-fx]+)\]\((https:\/\/worldscan\.org\/tx\/[^)]+)\)/);
    if (!txMatch) continue;

    const blockCell = cells[4] || "";
    const blockMatch = blockCell.match(/\[(\d+)\]/);

    const fromCell = cells[6] || "";
    const fromMatch = fromCell.match(/\[([^\]]+)\]/);

    const toCell = cells[8] || "";
    const toMatch = toCell.match(/\[([^\]]+)\]/);

    results.push({
      tx_hash: txMatch[1],
      tx_url: txMatch[2],
      action: cells[3]?.trim() || "",
      block: blockMatch ? blockMatch[1] : cells[4]?.trim() || "",
      age: cells[5]?.trim() || "",
      from: fromMatch ? fromMatch[1] : fromCell,
      to: toMatch ? toMatch[1] : toCell,
      amount: cells[9]?.trim() || "",
      txn_fee: cells[10]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching recent transactions from World Chain...\n");
  const data = await browse("https://worldscan.org/txs");
  const markdown = data?.extracted_content ?? "";
  const txs = parseMarkdownTable(markdown);
  console.log(JSON.stringify(txs, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("transactions.ts") || process.argv[1]?.endsWith("transactions.js");
if (isDirectRun) main();
