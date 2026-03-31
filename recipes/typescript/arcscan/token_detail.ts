/**
 * Recipe: Token Detail from Arc Testnet (Arcscan)
 * Scrapes detailed information for a specific token on Arc Testnet.
 *
 * URL: https://testnet.arcscan.app/token/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/token_detail.ts 0x2B51Ae4412F79c3c1cB12AA40Ea4ECEb4e80511a
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TokenDetail {
  name: string;
  contract_address: string;
  total_supply: string;
  holders: string;
  transfers: string;
  decimals: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === label || lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("*") && !val.startsWith("![")) return val;
      }
    }
  }
  return "";
}

export function parseTokenDetail(markdown: string): TokenDetail {
  const lines = markdown.split("\n");

  let name = "";
  let contractAddress = "";
  for (const line of lines) {
    const m = line.match(/(0x[0-9a-fA-F]{40})/);
    if (m && !contractAddress) contractAddress = m[1];
  }
  // Name from title
  const titleMatch = lines[0]?.match(/token\s+(.+?)\s*\|/i);
  if (titleMatch) name = titleMatch[1].trim();
  // Fallback: look for "# Token" or "# " heading
  if (!name) {
    for (const line of lines) {
      if (line.startsWith("# ") && !line.includes("Token transfers")) {
        name = line.replace(/^#+\s*/, "").trim();
        break;
      }
    }
  }

  return {
    name,
    contract_address: contractAddress,
    total_supply: extractField(lines, "Total supply") || extractField(lines, "Max total supply"),
    holders: extractField(lines, "Holders"),
    transfers: extractField(lines, "Transfers"),
    decimals: extractField(lines, "Decimals"),
  };
}

async function main() {
  const token = process.argv[2] || "0x2B51Ae4412F79c3c1cB12AA40Ea4ECEb4e80511a";
  const url = token.startsWith("http") ? token : `https://testnet.arcscan.app/token/${token}`;
  console.log(`Fetching token detail from Arc Testnet: ${token.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseTokenDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("token_detail.ts") || process.argv[1]?.endsWith("token_detail.js");
if (isDirectRun) main();
