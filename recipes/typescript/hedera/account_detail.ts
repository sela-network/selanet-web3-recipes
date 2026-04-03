/**
 * Recipe: Account Detail from Hedera (HashScan) (SPA)
 * Scrapes detailed information for a specific Hedera account.
 *
 * URL: https://hashscan.io/mainnet/account/{id}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx hedera/account_detail.ts 0.0.98
 *   npx tsx hedera/account_detail.ts 0.0.800559 --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, BASE_URL, extractField } from "./utils.js";

export interface AccountDetail {
  account_id: string;
  evm_address: string;
  balance: string;
  key_type: string;
  memo: string;
  created: string;
  expires: string;
  auto_renew: string;
  staked_to: string;
  tokens: string;
  nfts: string;
  url: string;
}

export function parseAccountDetail(markdown: string, accountId: string, url: string): AccountDetail {
  const lines = markdown.split("\n");

  // Extract EVM address (0x...)
  let evmAddress = "";
  for (const line of lines) {
    const m = line.match(/(0x[0-9a-fA-F]{40})/);
    if (m) { evmAddress = m[1]; break; }
  }

  return {
    account_id: accountId,
    evm_address: evmAddress,
    balance: extractField(lines, "Balance") || extractField(lines, "HBAR Balance"),
    key_type: extractField(lines, "Key") || extractField(lines, "Key Type"),
    memo: extractField(lines, "Memo"),
    created: extractField(lines, "Created") || extractField(lines, "Create"),
    expires: extractField(lines, "Expir"),
    auto_renew: extractField(lines, "Auto Renew") || extractField(lines, "Renewal"),
    staked_to: extractField(lines, "Staked") || extractField(lines, "Stake"),
    tokens: extractField(lines, "Token") || extractField(lines, "Tokens"),
    nfts: extractField(lines, "NFT"),
    url,
  };
}

async function main() {
  const accountId = process.argv[2] || "0.0.98";
  const debug = process.argv.includes("--debug");
  const url = accountId.startsWith("http") ? accountId : `${BASE_URL}/account/${accountId}`;
  console.log(`Fetching account detail from Hedera: ${accountId}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const detail = parseAccountDetail(md, accountId, url);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("account_detail.ts") || process.argv[1]?.endsWith("account_detail.js");
if (isDirectRun) main();
