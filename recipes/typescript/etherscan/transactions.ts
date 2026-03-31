/**
 * Recipe: Recent Transactions from Etherscan
 * Scrapes recent Ethereum transactions.
 *
 * URL: https://etherscan.io/txs
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/transactions.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Transaction {
  tx_hash: string;
  tx_url: string;
  method: string;
  block: string;
  age: string;
  from: string;
  to: string;
  amount: string;
  txn_fee: string;
}

export function parseMarkdownTable(markdown: string): Transaction[] {
  const lines = markdown.split("\n");
  const results: Transaction[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, empty, tx_hash, method, block, age, from, arrow, to, amount, txn_fee, empty]

    const txCell = cells[2] || "";
    const txMatch = txCell.match(
      /\[([0-9a-fx]+)\]\((https:\/\/etherscan\.io\/tx\/[^)]+)\)/
    );
    if (!txMatch) continue;

    const blockCell = cells[4] || "";
    const blockMatch = blockCell.match(/\[(\d+)\]/);

    // From
    const fromCell = cells[6] || "";
    const fromMatch = fromCell.match(/\[([^\]]+)\]/);

    // To
    const toCell = cells[8] || "";
    const toMatch = toCell.match(/\[([^\]]+)\]/);

    results.push({
      tx_hash: txMatch[1],
      tx_url: txMatch[2],
      method: cells[3]?.trim() || "",
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
  console.log("Fetching recent transactions from Etherscan...\n");
  const data = await browse("https://etherscan.io/txs");
  const markdown = data?.extracted_content ?? "";
  const txs = parseMarkdownTable(markdown);
  console.log(JSON.stringify(txs, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("transactions.ts") || process.argv[1]?.endsWith("transactions.js");
if (isDirectRun) main();
