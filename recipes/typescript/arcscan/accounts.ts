/**
 * Recipe: Top Accounts from Arc Testnet (Arcscan)
 * Scrapes top accounts by USDC balance on Arc Testnet.
 *
 * URL: https://testnet.arcscan.app/accounts
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/accounts.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface ArcAccount {
  rank: number;
  address: string;
  address_url: string;
  balance: string;
  txn_count: string;
}

export function parseMarkdownTable(markdown: string): ArcAccount[] {
  const lines = markdown.split("\n");
  const results: ArcAccount[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, address, balance, txn_count, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const addrCell = cells[2] || "";
    const addrMatch = addrCell.match(
      /\[([^\]]+)\]\((https:\/\/testnet\.arcscan\.app\/address\/[^)]+)\)/
    );

    results.push({
      rank,
      address: addrMatch ? addrMatch[1] : "",
      address_url: addrMatch ? addrMatch[2] : "",
      balance: cells[3]?.trim() || "",
      txn_count: cells[4]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching top accounts from Arc Testnet...\n");
  const data = await browse("https://testnet.arcscan.app/accounts");
  const markdown = data?.extracted_content ?? "";
  const accounts = parseMarkdownTable(markdown);
  console.log(JSON.stringify(accounts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("accounts.ts") || process.argv[1]?.endsWith("accounts.js");
if (isDirectRun) main();
