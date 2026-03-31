/**
 * Recipe: Account Detail from Arc Testnet (Arcscan)
 * Scrapes detailed information for a specific address.
 *
 * URL: https://testnet.arcscan.app/address/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx arcscan/account_detail.ts 0x4f7A67464B5976d7547c860109e4432d50AfB38e
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface AccountDetail {
  address: string;
  balance: string;
  transactions: string;
  gas_used: string;
  last_balance_update: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === label || lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && val !== "*" && !val.startsWith("*")) return val;
      }
    }
  }
  return "";
}

export function parseAccountDetail(markdown: string): AccountDetail {
  const lines = markdown.split("\n");

  // Address is on a standalone line after "# Address details"
  let address = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("Address details") || lines[i].includes("# Address")) {
      for (let j = i + 1; j < Math.min(lines.length, i + 8); j++) {
        const m = lines[j].trim().match(/(0x[0-9a-fA-F]{40})/);
        if (m) { address = m[1]; break; }
      }
      break;
    }
  }

  // Last balance update: "[21837630](url)"
  const lastUpdateField = extractField(lines, "Last balance update");
  const blockMatch = lastUpdateField.match(/\[(\d+)\]/);

  return {
    address,
    balance: extractField(lines, "Balance"),
    transactions: extractField(lines, "Transactions"),
    gas_used: extractField(lines, "Gas used"),
    last_balance_update: blockMatch ? blockMatch[1] : lastUpdateField,
  };
}

async function main() {
  const addr = process.argv[2] || "0x4f7A67464B5976d7547c860109e4432d50AfB38e";
  const url = addr.startsWith("http") ? addr : `https://testnet.arcscan.app/address/${addr}`;

  console.log(`Fetching account detail from Arc Testnet: ${addr.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseAccountDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("account_detail.ts") || process.argv[1]?.endsWith("account_detail.js");
if (isDirectRun) main();
