/**
 * Recipe: Uniswap Transactions (SPA)
 * Scrapes recent transactions from the Uniswap explore page.
 * Note: Transactions tab does not have a dedicated URL path.
 *       This uses the main explore page — data may vary depending on SPA state.
 *
 * URL: https://app.uniswap.org/explore/{chain}?lng=en
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx uniswap/transactions.ts [ethereum|base|arbitrum|...]
 */

import "dotenv/config";
import { browse } from "../utils.js";
import { BROWSE_OPTS, resolveChain, parseLinkBlocks } from "./utils.js";

export interface Transaction {
  rank: number;
  description: string;
  value: string;
  token_amount_a: string;
  token_amount_b: string;
  account: string;
  time: string;
  url: string;
}

const URL_RE = /https:\/\/app\.uniswap\.org\/explore\/(?:transactions|tx)\/[^\s)]+/;

export function parseTransactions(markdown: string): Transaction[] {
  return parseLinkBlocks(markdown, URL_RE).map(({ rank, lines, url }) => ({
    rank,
    description: lines[0] || "",
    value: lines[1] || "",
    token_amount_a: lines[2] || "",
    token_amount_b: lines[3] || "",
    account: lines[4] || "",
    time: lines[5] || "",
    url,
  }));
}

async function main() {
  const chain = resolveChain(process.argv[2]);
  // Transactions tab has no dedicated URL; use main explore page
  const url = `https://app.uniswap.org/explore/${chain.slug}?lng=en`;
  console.log(`Fetching Uniswap transactions: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  const result: { chain: string; transactions: Transaction[] } = {
    chain: chain.name,
    transactions: parseTransactions(md),
  };
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("transactions.ts") || process.argv[1]?.endsWith("transactions.js");
if (isDirectRun) main();
