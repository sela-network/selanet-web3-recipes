/**
 * Recipe: Token Detail from Etherscan
 * Scrapes detailed information for a specific ERC-20 token.
 *
 * URL: https://etherscan.io/token/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/token_detail.ts 0xdac17f958d2ee523a2206206994597c13d831ec7
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TokenDetail {
  name: string;
  contract_address: string;
  max_total_supply: string;
  holders: string;
  total_transfers: string;
  price: string;
  onchain_market_cap: string;
  circulating_market_cap: string;
  decimals: string;
  website: string;
  description: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("*") && !val.startsWith("#")) return val;
      }
    }
  }
  return "";
}

export function parseTokenDetail(markdown: string): TokenDetail {
  const lines = markdown.split("\n");

  // Name from title: "Tether USD (USDT) | ERC-20 | Address: 0x..."
  const titleMatch = lines[0]?.match(/\\t(.+?)\s*\|/);
  const name = titleMatch ? titleMatch[1].trim() : "";

  // Contract address from "Token Contract" section
  let contractAddress = "";
  const contractField = extractField(lines, "#### Token Contract");
  const addrMatch = contractField.match(/(0x[0-9a-fA-F]{40})/);
  if (addrMatch) contractAddress = addrMatch[1];

  // Decimals from "Token Contract (WITH N Decimals)"
  let decimals = "";
  for (const line of lines) {
    const decMatch = line.match(/WITH\s+\**(\d+)\**\s+Decimals/);
    if (decMatch) { decimals = decMatch[1]; break; }
  }

  // Website
  let website = "";
  for (const line of lines) {
    const m = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
    if (m && !m[2].includes("etherscan") && !m[2].includes("coinmarketcap") && !m[2].includes("coingecko") && !m[2].includes("goto.") && !m[2].includes("twitter") && !m[2].includes("t.me") && !m[2].includes("reddit") && !m[2].includes("linkedin") && !m[2].includes("facebook") && line.includes("tether.to") || line.includes(".io") || line.includes(".org")) {
      // too complex, just find the first URL after social links section
    }
  }
  // Simpler: find the website URL
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().match(/^https?:\/\/[^\s]+/) && !lines[i].includes("etherscan")) {
      website = lines[i].trim();
      break;
    }
  }

  // Description from OVERVIEW section
  let description = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "**OVERVIEW**") {
      for (let j = i + 1; j < Math.min(lines.length, i + 6); j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("**") && val.length > 10) { description = val; break; }
      }
      break;
    }
  }

  return {
    name,
    contract_address: contractAddress,
    max_total_supply: extractField(lines, "#### Max Total Supply"),
    holders: extractField(lines, "#### Holders"),
    total_transfers: extractField(lines, "More than"),
    price: extractField(lines, "#### Price"),
    onchain_market_cap: extractField(lines, "#### Onchain Market Cap"),
    circulating_market_cap: extractField(lines, "#### Circulating Supply Market Cap"),
    decimals,
    website,
    description,
  };
}

async function main() {
  const token = process.argv[2] || "0xdac17f958d2ee523a2206206994597c13d831ec7";
  const url = token.startsWith("http") ? token : `https://etherscan.io/token/${token}`;
  console.log(`Fetching token detail from Etherscan: ${token.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseTokenDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("token_detail.ts") || process.argv[1]?.endsWith("token_detail.js");
if (isDirectRun) main();
