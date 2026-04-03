/**
 * Recipe: Address Detail from Flare Explorer (SPA)
 * Scrapes detailed information for a specific Flare address.
 *
 * URL: https://flare-explorer.flare.network/address/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx flare/address_detail.ts 0x1000000000000000000000000000000000000002
 *   npx tsx flare/address_detail.ts 0x... --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, BASE_URL, extractField } from "./utils.js";

export interface AddressDetail {
  address: string;
  balance: string;
  tokens: string;
  transactions: string;
  gas_used: string;
  last_balance_update: string;
  contract_name: string;
  creator: string;
  url: string;
}

export function parseAddressDetail(markdown: string, address: string, url: string): AddressDetail {
  const lines = markdown.split("\n");

  return {
    address,
    balance: extractField(lines, "Balance") || extractField(lines, "FLR Balance"),
    tokens: extractField(lines, "Token") || extractField(lines, "Tokens"),
    transactions: extractField(lines, "Transaction") || extractField(lines, "Txns"),
    gas_used: extractField(lines, "Gas Used") || extractField(lines, "Gas"),
    last_balance_update: extractField(lines, "Last Balance") || extractField(lines, "Updated"),
    contract_name: extractField(lines, "Contract") || extractField(lines, "Name"),
    creator: extractField(lines, "Creator") || extractField(lines, "Created by"),
    url,
  };
}

async function main() {
  const addr = process.argv[2] || "0x1000000000000000000000000000000000000002";
  const debug = process.argv.includes("--debug");
  const url = addr.startsWith("http") ? addr : `${BASE_URL}/address/${addr}`;
  console.log(`Fetching address detail from Flare: ${addr.substring(0, 12)}...\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const detail = parseAddressDetail(md, addr, url);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("address_detail.ts") || process.argv[1]?.endsWith("address_detail.js");
if (isDirectRun) main();
