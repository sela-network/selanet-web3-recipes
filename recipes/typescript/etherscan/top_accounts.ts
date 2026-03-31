/**
 * Recipe: Top Accounts from Etherscan
 * Scrapes top Ethereum accounts by ETH balance.
 *
 * URL: https://etherscan.io/accounts
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/top_accounts.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TopAccount {
  rank: number;
  address: string;
  address_url: string;
  name_tag: string;
  balance: string;
  percentage: string;
  txn_count: string;
}

export function parseMarkdownTable(markdown: string): TopAccount[] {
  const lines = markdown.split("\n");
  const results: TopAccount[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, rank, address, name_tag, balance, percentage, txn_count, empty]

    const rank = parseInt(cells[1], 10);
    if (isNaN(rank)) continue;

    const addrCell = cells[2] || "";
    const addrMatch = addrCell.match(
      /\[([^\]]+)\]\((https:\/\/etherscan\.io\/address\/([^)]+))\)/
    );

    results.push({
      rank,
      address: addrMatch ? addrMatch[3] : "",
      address_url: addrMatch ? addrMatch[2] : "",
      name_tag: cells[3]?.trim() || "",
      balance: cells[4]?.trim() || "",
      percentage: cells[5]?.trim() || "",
      txn_count: cells[6]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching top accounts from Etherscan...\n");
  const data = await browse("https://etherscan.io/accounts");
  const markdown = data?.extracted_content ?? "";
  const accounts = parseMarkdownTable(markdown);
  console.log(JSON.stringify(accounts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("top_accounts.ts") || process.argv[1]?.endsWith("top_accounts.js");
if (isDirectRun) main();
