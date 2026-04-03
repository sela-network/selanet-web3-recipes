/**
 * Recipe: Uniswap Top Pools (SPA)
 * Scrapes top pools from the Uniswap explore page.
 *
 * URL: https://app.uniswap.org/explore/pools/{chain}?lng=en
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx uniswap/pools.ts [ethereum|base|arbitrum|...]
 */

import "dotenv/config";
import { browse } from "../utils.js";
import { BROWSE_OPTS, resolveChain, buildUrl, parseStats, parseLinkBlocks } from "./utils.js";
import type { Stats } from "./utils.js";

export interface Pool {
  rank: number;
  pair: string;
  protocol: string;
  fee_tier: string;
  tvl: string;
  pool_apr: string;
  reward_apr: string;
  volume_1d: string;
  volume_30d: string;
  url: string;
}

const URL_RE = /https:\/\/app\.uniswap\.org\/explore\/pools\/[^\s)]+/;

export function parsePools(markdown: string): Pool[] {
  return parseLinkBlocks(markdown, URL_RE).map(({ rank, lines, url }) => ({
    rank,
    pair: lines[0] || "",
    protocol: lines[1] || "",
    fee_tier: lines[2] || "",
    tvl: lines[3] || "",
    pool_apr: lines[4] || "",
    reward_apr: lines[5] || "",
    volume_1d: lines[6] || "",
    volume_30d: lines[7] || "",
    url,
  }));
}

async function main() {
  const chain = resolveChain(process.argv[2]);
  const url = buildUrl("pools", chain.slug);
  console.log(`Fetching Uniswap pools: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  const result: { chain: string; stats: Stats; pools: Pool[] } = {
    chain: chain.name,
    stats: parseStats(md),
    pools: parsePools(md),
  };
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("pools.ts") || process.argv[1]?.endsWith("pools.js");
if (isDirectRun) main();
