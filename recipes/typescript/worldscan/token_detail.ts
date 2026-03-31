/**
 * Recipe: Token Detail from World Chain (Worldscan)
 * Scrapes detailed information for a specific token on World Chain.
 *
 * URL: https://worldscan.org/token/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx worldscan/token_detail.ts 0x4200000000000000000000000000000000000006
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

  const titleMatch = lines[0]?.match(/\\t(.+?)\s*\|/);
  const name = titleMatch ? titleMatch[1].trim() : "";

  let contractAddress = "";
  const contractField = extractField(lines, "#### Token Contract");
  const addrMatch = contractField.match(/(0x[0-9a-fA-F]{40})/);
  if (addrMatch) contractAddress = addrMatch[1];

  let decimals = "";
  for (const line of lines) {
    const m = line.match(/WITH\s+(\d+)\s+Decimals/);
    if (m) { decimals = m[1]; break; }
  }

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
    description,
  };
}

async function main() {
  const token = process.argv[2] || "0x4200000000000000000000000000000000000006";
  const url = token.startsWith("http") ? token : `https://worldscan.org/token/${token}`;
  console.log(`Fetching token detail from World Chain: ${token.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseTokenDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("token_detail.ts") || process.argv[1]?.endsWith("token_detail.js");
if (isDirectRun) main();
