/**
 * Recipe: Recent Blocks from Flare Explorer (SPA)
 * Scrapes recent blocks on Flare Mainnet using Blockscout-based explorer.
 *
 * URL: https://flare-explorer.flare.network/blocks
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx flare/blocks.ts
 *   npx tsx flare/blocks.ts --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildUrl, BASE_URL } from "./utils.js";

export interface FlareBlock {
  block: string;
  block_url: string;
  age: string;
  size: string;
  miner: string;
  txn: string;
  gas_used: string;
  reward: string;
  burnt_fees: string;
}

export function parseBlocks(markdown: string): FlareBlock[] {
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const results: FlareBlock[] = [];
  const seen = new Set<string>();

  // Blockscout card layout:
  // [blockNumber](url)
  // age
  // Size
  // bytes
  // Miner
  // [address](url)
  // Txn
  // [count](url)
  // Gas used
  // number
  // ...
  // Reward FLR
  // amount
  // Burnt fees
  // amount

  for (let i = 0; i < lines.length; i++) {
    const blockMatch = lines[i].match(/^\[(\d{5,})\]\((https:\/\/flare-explorer\.flare\.network\/block\/\d+)\)$/);
    if (!blockMatch) continue;

    const blockNum = blockMatch[1];
    if (seen.has(blockNum)) continue;
    seen.add(blockNum);

    // Scan forward for fields
    const context = lines.slice(i + 1, Math.min(lines.length, i + 25));
    const getAfter = (label: string): string => {
      for (let j = 0; j < context.length; j++) {
        if (context[j] === label || context[j].startsWith(label)) {
          const val = context[j + 1] || "";
          // Extract link text [text](url) or strip image markdown
          const linkMatch = val.match(/^\[([^\]]+)\]\(/);
          const clean = linkMatch ? linkMatch[1] : val.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
          return clean;
        }
      }
      return "";
    };

    results.push({
      block: blockNum,
      block_url: blockMatch[2],
      age: context[0] || "",
      size: getAfter("Size"),
      miner: getAfter("Miner"),
      txn: getAfter("Txn"),
      gas_used: getAfter("Gas used"),
      reward: getAfter("Reward FLR"),
      burnt_fees: getAfter("Burnt fees"),
    });
  }

  return results;
}

async function main() {
  const debug = process.argv.includes("--debug");
  const url = buildUrl("blocks");
  console.log(`Fetching recent blocks from Flare: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const blocks = parseBlocks(md);
  console.log(JSON.stringify(blocks, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("blocks.ts") || process.argv[1]?.endsWith("blocks.js");
if (isDirectRun) main();
