/**
 * Recipe: Uniswap Top Tokens (SPA)
 * Scrapes top tokens from the Uniswap explore page.
 *
 * URL: https://app.uniswap.org/explore/tokens/{chain}?lng=en
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx uniswap/tokens.ts [ethereum|base|arbitrum|...]
 */

import "dotenv/config";
import { browse } from "../utils.js";
import { BROWSE_OPTS, resolveChain, buildUrl, parseStats, parseLinkBlocks } from "./utils.js";
import type { Stats } from "./utils.js";

export interface Token {
  rank: number;
  name: string;
  symbol: string;
  price: string;
  change_1h: string;
  change_1d: string;
  fdv: string;
  volume: string;
  url: string;
}

const URL_RE = /https:\/\/app\.uniswap\.org\/explore\/tokens\/[^\s)]+/;

export function parseTokens(markdown: string): Token[] {
  return parseLinkBlocks(markdown, URL_RE).map(({ rank, lines, url }) => {
    const nameSymbol = lines[0] || "";
    const nsMatch = nameSymbol.match(/^(.+[a-z\s])([A-Z][A-Z0-9]{1,9})$/);
    return {
      rank,
      name: nsMatch ? nsMatch[1].trim() : nameSymbol,
      symbol: nsMatch ? nsMatch[2] : "",
      price: lines[1] || "",
      change_1h: lines[2] || "",
      change_1d: lines[3] || "",
      fdv: lines[4] || "",
      volume: lines[5] || "",
      url,
    };
  });
}

async function main() {
  const chain = resolveChain(process.argv[2]);
  const url = buildUrl("tokens", chain.slug);
  console.log(`Fetching Uniswap tokens: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  const result: { chain: string; stats: Stats; tokens: Token[] } = {
    chain: chain.name,
    stats: parseStats(md),
    tokens: parseTokens(md),
  };
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("tokens.ts") || process.argv[1]?.endsWith("tokens.js");
if (isDirectRun) main();
