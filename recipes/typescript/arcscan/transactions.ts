/**
 * Recipe: Recent Transactions from Arc Testnet (Arcscan)
 * Scrapes recent transactions on Arc Testnet.
 *
 * URL: https://testnet.arcscan.app/txs
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/transactions.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ArcTransaction {
  tx_hash: string;
  tx_url: string;
  type: string;
  method: string;
  block: string;
  from_to: string;
  value: string;
  fee: string;
}

export function parseMarkdownTable(markdown: string): ArcTransaction[] {
  const lines = markdown.split("\n");
  const results: ArcTransaction[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, empty, tx_hash, type, method, block, from_to, value, fee, empty]

    const txCell = cells[2] || "";
    const txMatch = txCell.match(
      /\[([0-9a-fA-Fx]+[.]*[0-9a-fA-F]*)\]\((https:\/\/testnet\.arcscan\.app\/tx\/[^)]+)\)/
    );
    if (!txMatch) continue;

    const blockCell = cells[5] || "";
    const blockMatch = blockCell.match(/\[(\d+)\]/);

    results.push({
      tx_hash: txMatch[1],
      tx_url: txMatch[2],
      type: cells[3]?.trim() || "",
      method: cells[4]?.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim() || "",
      block: blockMatch ? blockMatch[1] : cells[5]?.trim() || "",
      from_to: cells[6]?.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim() || "",
      value: cells[7]?.trim() || "",
      fee: cells[8]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching recent transactions from Arc Testnet...\n");
  const data = await browse("https://testnet.arcscan.app/txs");
  const markdown = data?.extracted_content ?? "";
  const txs = parseMarkdownTable(markdown);
  console.log(JSON.stringify(txs, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("transactions.ts") || process.argv[1]?.endsWith("transactions.js");
if (isDirectRun) main();
