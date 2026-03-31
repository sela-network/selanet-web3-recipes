/**
 * Recipe: Address Detail from Etherscan
 * Scrapes detailed information for a specific Ethereum address.
 *
 * URL: https://etherscan.io/address/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/address_detail.ts 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface AddressDetail {
  address: string;
  name: string;
  eth_balance: string;
  eth_value: string;
  token_holdings: string;
  contract_creator: string;
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

export function parseAddressDetail(markdown: string): AddressDetail {
  const lines = markdown.split("\n");

  let address = "";
  let name = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("# Contract") || lines[i].includes("# Address")) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const m = lines[j].trim().match(/(0x[0-9a-fA-F]{40})/);
        if (m) { address = m[1]; break; }
      }
      break;
    }
  }

  // Name from page title: "Wrapped Ether | Address: 0x..."
  const titleMatch = lines[0]?.match(/\\t(.+?)\s*\|/);
  if (titleMatch) name = titleMatch[1].trim();

  return {
    address,
    name,
    eth_balance: extractField(lines, "#### ETH Balance") || extractField(lines, "ETH Balance"),
    eth_value: extractField(lines, "#### Eth Value") || extractField(lines, "Eth Value"),
    token_holdings: extractField(lines, "#### Token Holdings") || extractField(lines, "Token Holdings"),
    contract_creator: extractField(lines, "#### ContractCreator") || extractField(lines, "ContractCreator"),
  };
}

async function main() {
  const addr = process.argv[2] || "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
  const url = addr.startsWith("http") ? addr : `https://etherscan.io/address/${addr}`;
  console.log(`Fetching address detail from Etherscan: ${addr.substring(0, 12)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseAddressDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("address_detail.ts") || process.argv[1]?.endsWith("address_detail.js");
if (isDirectRun) main();
