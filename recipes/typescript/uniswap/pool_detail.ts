/**
 * Recipe: Uniswap Pool Detail
 * Scrapes detailed information for a specific Uniswap pool.
 *
 * URL: https://app.uniswap.org/explore/pools/{chain}/{address}?lng=en
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx uniswap/pool_detail.ts 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
 *   npx tsx uniswap/pool_detail.ts 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 ethereum
 *   npx tsx uniswap/pool_detail.ts 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640 base --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, resolveChain } from "./utils.js";

export interface PoolDetail {
  pair: string;
  protocol: string;
  fee_tier: string;
  value: string;
  recent_transactions: PoolTransaction[];
}

export interface PoolTransaction {
  time: string;
  type: string;
  usd: string;
  token0_amount: string;
  token1_amount: string;
  wallet: string;
}

/**
 * Uniswap pool detail page block format:
 *   # USDC / ETH                          ← pair heading
 *   v3                                     ← protocol version
 *   0.05%                                  ← fee tier
 *   $171.8M                               ← dollar value (TVL or volume)
 *   Past day
 *   ### Transactions
 *   [1m](tx_url) Buy USDC $18,786.49 18,780.07 9.17333 [0xAd35...5299](addr_url)
 */
export function parsePoolDetail(markdown: string): PoolDetail {
  const result: PoolDetail = {
    pair: "",
    protocol: "",
    fee_tier: "",
    value: "",
    recent_transactions: [],
  };

  const lines = markdown.split("\n");

  // Extract pair from heading
  for (const line of lines) {
    const m = line.match(/^#\s+([A-Z0-9]+\s*\/\s*[A-Z0-9]+)/);
    if (m) {
      result.pair = m[1].trim();
      break;
    }
  }

  // Extract protocol version, fee tier, and dollar value from standalone lines
  const feeRe = /^[\d.]+%$/;
  const dollarRe = /^\$[\d,.]+[KMBT]?$/;
  const versionRe = /^v[234]$/;

  for (const line of lines) {
    const trimmed = line.trim();
    if (versionRe.test(trimmed) && !result.protocol) result.protocol = trimmed;
    if (feeRe.test(trimmed) && !result.fee_tier) result.fee_tier = trimmed;
    if (dollarRe.test(trimmed) && !result.value) result.value = trimmed;
  }

  // Parse transactions block format:
  //   [1m](tx_url)                               ← time + link
  //   Buy USDC                                   ← type
  //   $18,786.49                                 ← usd value
  //   18,780.07                                  ← token0 amount
  //   9.17333                                    ← token1 amount
  //   [0xAd35...5299](addr_url)                  ← wallet
  const txTypeRe = /^(Buy|Sell)\s+[A-Z0-9]+$/;
  const usdRe = /^\$[\d,.]+$/;
  const numRe = /^[\d,.]+$/;
  const walletRe = /^\[(0x[A-Fa-f0-9.]+)\]\(/;
  const timeRe = /^\[(\d+[smh])\]\(/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!txTypeRe.test(line)) continue;

    const type = line;

    // Look backwards for time
    let time = "";
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      const tm = lines[j].trim().match(timeRe);
      if (tm) { time = tm[1]; break; }
    }

    // Look forwards for usd, amounts, wallet
    let usd = "";
    const amounts: string[] = [];
    let wallet = "";

    for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
      const l = lines[j].trim();
      if (txTypeRe.test(l)) break; // next transaction
      if (usdRe.test(l) && !usd) usd = l;
      else if (numRe.test(l)) amounts.push(l);
      const wm = l.match(walletRe);
      if (wm) wallet = wm[1];
    }

    result.recent_transactions.push({
      time,
      type,
      usd,
      token0_amount: amounts[0] || "",
      token1_amount: amounts[1] || "",
      wallet,
    });

    if (result.recent_transactions.length >= 20) break;
  }

  return result;
}

async function main() {
  const poolAddress = process.argv[2];
  if (!poolAddress) {
    console.error("Usage: npx tsx uniswap/pool_detail.ts <pool_address> [chain]");
    console.error("Example: npx tsx uniswap/pool_detail.ts 0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640");
    process.exit(1);
  }

  const chainArg = process.argv[3];
  const debug = process.argv.includes("--debug");
  const chain = chainArg && chainArg !== "--debug" ? resolveChain(chainArg) : resolveChain();

  const url = `https://app.uniswap.org/explore/pools/${chain.slug}/${poolAddress}?lng=en`;
  console.log(`Fetching Uniswap pool detail: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const detail = parsePoolDetail(md);
  console.log(
    JSON.stringify(
      {
        chain: chain.name,
        pool_address: poolAddress,
        ...detail,
      },
      null,
      2
    )
  );
}

const isDirectRun =
  process.argv[1]?.endsWith("pool_detail.ts") || process.argv[1]?.endsWith("pool_detail.js");
if (isDirectRun) main();
