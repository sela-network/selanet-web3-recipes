/**
 * Recipe: Recent Transactions from Flare Explorer (SPA)
 * Scrapes recent transactions on Flare Mainnet using Blockscout-based explorer.
 *
 * URL: https://flare-explorer.flare.network/txs
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx flare/transactions.ts
 *   npx tsx flare/transactions.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildUrl } from "./utils.js";

export interface FlareTransaction {
  tx_hash: string;
  tx_url: string;
  type: string;
  method: string;
  block: string;
  age: string;
  from: string;
  to: string;
  value: string;
  fee: string;
}

export function parseTransactions(markdown: string): FlareTransaction[] {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: FlareTransaction[] = [];

  // Blockscout card layout:
  // Contract call (or Token transfer, etc.)
  // [0xhash...](url)
  // age
  // Method 0x...
  // Block [number](url)
  // From [addr](url) To [addr](url)
  // Value amount FLR
  // Fee amount FLR

  const txLinkRe = /^\[(0x[0-9a-fA-F]{10,}(?:\.\.\.[0-9a-fA-F]+)?)\]\((https:\/\/flare-explorer\.flare\.network\/tx\/0x[^)]+)\)$/;

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(txLinkRe);
    if (!m) continue;

    const txHash = m[1];
    const txUrl = m[2];

    // Type is on the line before
    const type = i > 0 && !lines[i - 1].startsWith("[") && !lines[i - 1].startsWith("#") ? lines[i - 1] : "";

    // Look ahead
    const context = lines.slice(i + 1, Math.min(lines.length, i + 15));
    let age = "", method = "", block = "", from = "", to = "", value = "", fee = "";

    for (let j = 0; j < context.length; j++) {
      const l = context[j];
      const next = context[j + 1] || "";
      if (!age && /ago$/.test(l)) age = l;
      // Method label on its own line, value on next line (e.g., "0x7577109d")
      if (l === "Method" || l.startsWith("Method")) {
        const inline = l.replace("Method", "").trim();
        if (inline) method = inline;
        else if (next.match(/^0x[0-9a-fA-F]+$/)) { method = next; j++; }
      }
      // Block label on its own line, value as link on next line
      if (l === "Block" || l.startsWith("Block")) {
        const bm = l.match(/\[(\d+)\]/);
        if (bm) block = bm[1];
        else {
          const bnm = next.match(/\[(\d+)\]/);
          if (bnm) { block = bnm[1]; j++; }
        }
      }
      // Address links: first one is From, second is To
      const addrMatch = l.match(/\[(0x[A-Fa-f0-9.]+)\]\(https:\/\/flare-explorer/);
      if (addrMatch) {
        if (!from) from = addrMatch[1];
        else if (!to) to = addrMatch[1];
      }
      // Value: label on own line, amount on next (e.g., "0 FLR")
      if (l === "Value" || l.startsWith("Value")) {
        const inline = l.replace("Value", "").trim();
        if (inline) value = inline;
        else if (next.match(/[\d.]+\s*FLR/)) { value = next; j++; }
      }
      // Fee: label on own line, amount on next
      if (l === "Fee" || l.startsWith("Fee")) {
        const inline = l.replace("Fee", "").trim();
        if (inline) fee = inline;
        else if (next.match(/[\d.]+\s*FLR/)) { fee = next; j++; }
      }
    }

    results.push({ tx_hash: txHash, tx_url: txUrl, type, method, block, age, from, to, value, fee });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildUrl("txs");
  console.log(`Fetching recent transactions from Flare: ${url}\n`);

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
