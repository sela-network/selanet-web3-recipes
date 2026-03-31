/**
 * Recipe: Address Detail from World Chain (Worldscan)
 * Scrapes detailed information for a specific World Chain address.
 *
 * URL: https://worldscan.org/address/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx worldscan/address_detail.ts 0xf8ac0baf3b528368334a3c8deddfa7f135f9e1ec
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TokenHolding {
  chain: string;
  token: string;
  token_url: string;
  portfolio_pct: string;
  price: string;
  amount: string;
  value: string;
}

interface AddressDetail {
  address: string;
  balance: string;
  token_holdings: TokenHolding[];
}

export function parseAddressDetail(markdown: string): AddressDetail {
  const lines = markdown.split("\n");

  // Extract address from title
  let address = "";
  for (const line of lines) {
    const m = line.match(/(0x[0-9a-fA-F]{40})/);
    if (m) { address = m[1]; break; }
  }

  // Balance
  let balance = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "Balance" || lines[i].trim() === "ETH Balance:") {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("*")) { balance = val; break; }
      }
      break;
    }
  }

  // Token holdings table: Chain | Token | Portfolio % | Price | Amount | Value
  const holdings: TokenHolding[] = [];
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    // Look for rows with token links
    const tokenCell = cells[2] || "";
    const tokenMatch = tokenCell.match(
      /\[([^\]]+)\]\((https:\/\/worldscan\.org\/token\/[^)]+)\)/
    );
    if (!tokenMatch) continue;

    holdings.push({
      chain: cells[1]?.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim() || "",
      token: tokenMatch[1],
      token_url: tokenMatch[2],
      portfolio_pct: cells[3]?.trim() || "",
      price: cells[4]?.trim() || "",
      amount: cells[5]?.trim() || "",
      value: cells[6]?.trim() || "",
    });
  }

  return { address, balance, token_holdings: holdings };
}

async function main() {
  const addr = process.argv[2] || "0xf8ac0baf3b528368334a3c8deddfa7f135f9e1ec";
  const url = addr.startsWith("http") ? addr : `https://worldscan.org/address/${addr}`;
  console.log(`Fetching address detail from World Chain: ${addr.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseAddressDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("address_detail.ts") || process.argv[1]?.endsWith("address_detail.js");
if (isDirectRun) main();
