/**
 * Recipe: Uniswap Auctions (SPA)
 * Scrapes auction listings from the Uniswap explore page.
 *
 * URL: https://app.uniswap.org/explore/auctions/{chain}?lng=en
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx uniswap/auctions.ts [ethereum|base|arbitrum|...]
 */

import "dotenv/config";
import { browse } from "../utils.js";
import { BROWSE_OPTS, resolveChain, buildUrl, parseLinkBlocks } from "./utils.js";

export interface Auction {
  rank: number;
  name: string;
  symbol: string;
  fdv: string;
  committed_volume: string;
  status: string;
  url: string;
}

const URL_RE = /https:\/\/app\.uniswap\.org\/explore\/auctions\/[^\s)]+/;

export function parseAuctions(markdown: string): Auction[] {
  return parseLinkBlocks(markdown, URL_RE).map(({ rank, lines, url }) => {
    // lines may start with a short symbol text if the token has no icon image.
    // Find the NameSYMBOL line (has lowercase+uppercase pattern) to align fields.
    let nameIdx = lines.findIndex((l) => /^.+[a-z\s][A-Z][A-Z0-9]{1,9}$/.test(l));
    if (nameIdx < 0) nameIdx = 0;

    const nameSymbol = lines[nameIdx] || "";
    const nsMatch = nameSymbol.match(/^(.+[a-z\s])([A-Z][A-Z0-9]{1,9})$/);
    return {
      rank,
      name: nsMatch ? nsMatch[1].trim() : nameSymbol,
      symbol: nsMatch ? nsMatch[2] : "",
      fdv: lines[nameIdx + 1] || "",
      committed_volume: lines[nameIdx + 2] || "",
      status: lines[nameIdx + 3] || "",
      url,
    };
  });
}

async function main() {
  const chain = resolveChain(process.argv[2]);
  const url = buildUrl("auctions", chain.slug);
  console.log(`Fetching Uniswap auctions: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  const result: { chain: string; auctions: Auction[] } = {
    chain: chain.name,
    auctions: parseAuctions(md),
  };
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("auctions.ts") || process.argv[1]?.endsWith("auctions.js");
if (isDirectRun) main();
