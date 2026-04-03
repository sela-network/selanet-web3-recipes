/**
 * Recipe: Recent Transactions from Hedera (HashScan) (SPA)
 * Scrapes recent transactions on Hedera Mainnet.
 *
 * URL: https://hashscan.io/mainnet/transactions
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx hedera/transactions.ts
 *   npx tsx hedera/transactions.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildUrl } from "./utils.js";

export interface HederaTransaction {
  id: string;
  tx_url: string;
  type: string;
  content: string;
  time: string;
}

export function parseTransactions(markdown: string): HederaTransaction[] {
  const lines = markdown.split("\n").map((l) => l.trim());
  const results: HederaTransaction[] = [];

  // HashScan may render as table: | ID | TYPE | CONTENT | TIME |
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    const idCell = cells[1] || "";
    // Hedera tx IDs: 0.0.xxxxx@timestamp
    if (!/0\.0\.\d+/.test(idCell)) continue;
    const id = idCell.replace(/\[([^\]]+)\].*/, "$1").trim();

    let txUrl = "";
    const urlMatch = idCell.match(/\]\((https?:\/\/[^)]+|\/[^)]+)\)/);
    if (urlMatch) {
      txUrl = urlMatch[1].startsWith("http") ? urlMatch[1] : `https://hashscan.io${urlMatch[1]}`;
    } else {
      txUrl = `https://hashscan.io/mainnet/transaction/${id}`;
    }

    results.push({
      id,
      tx_url: txUrl,
      type: cells[2]?.trim() || "",
      content: cells[3]?.trim() || "",
      time: cells[4]?.trim() || "",
    });
  }

  // Fallback: find Hedera tx ID patterns in non-table layout
  if (results.length === 0) {
    const txIdRe = /(0\.0\.\d+@[\d.]+)/;
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(txIdRe);
      if (!m) continue;
      if (results.some((r) => r.id === m[1])) continue;

      let txUrl = "";
      const urlMatch = lines[i].match(/\]\((https?:\/\/[^)]+)\)/);
      if (urlMatch) txUrl = urlMatch[1];

      // Look at surrounding lines for type
      const context = lines.slice(Math.max(0, i - 3), Math.min(lines.length, i + 3)).join(" ").toUpperCase();
      const typeWords = ["CRYPTOTRANSFER", "CRYPTO TRANSFER", "CONTRACTCALL", "CONTRACT CALL",
        "TOKENMINT", "TOKEN MINT", "TOKENBURN", "CONSENSUSSUBMITMESSAGE", "FILEUPDATE",
        "ETHEREUM TRANSACTION", "TOKEN ASSOCIATE"];
      let type = "";
      for (const tw of typeWords) {
        if (context.includes(tw)) { type = tw; break; }
      }

      results.push({
        id: m[1],
        tx_url: txUrl || `https://hashscan.io/mainnet/transaction/${m[1]}`,
        type,
        content: "",
        time: "",
      });
    }
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildUrl("transactions");
  console.log(`Fetching recent transactions from Hedera: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const txs = parseTransactions(md);
  console.log(JSON.stringify(txs, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("transactions.ts") || process.argv[1]?.endsWith("transactions.js");
if (isDirectRun) main();
