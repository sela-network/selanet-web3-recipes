/**
 * Recipe: ENS Reverse Lookup
 * Given an Ethereum address, finds associated ENS names using the ENS app.
 *
 * URL: https://app.ens.domains/{address}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx ens/reverse_lookup.ts 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045
 *   npx tsx ens/reverse_lookup.ts 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS } from "./utils.js";

export interface ReverseResult {
  address: string;
  primary_name: string;
  owned_names: { name: string; url: string; expiry: string }[];
}

export function parseReverseLookup(markdown: string, address: string): ReverseResult {
  const result: ReverseResult = {
    address,
    primary_name: "",
    owned_names: [],
  };

  const lines = markdown.split("\n");

  // Primary name: look for ".eth" name in heading or near the address
  for (const line of lines) {
    const m = line.match(/([a-z0-9-]+\.eth)/i);
    if (m && !line.includes("app.ens.domains") && !line.includes("http")) {
      if (!result.primary_name) result.primary_name = m[1];
    }
  }

  // Owned names: look for ENS name links
  const nameRe = /\[([a-z0-9-]+\.eth)\]\((https:\/\/app\.ens\.domains\/[^)]+)\)/gi;
  let nm;
  const seen = new Set<string>();
  for (const line of lines) {
    while ((nm = nameRe.exec(line)) !== null) {
      const name = nm[1].toLowerCase();
      if (seen.has(name)) continue;
      seen.add(name);
      result.owned_names.push({ name, url: nm[2], expiry: "" });
    }
  }

  // Try to find expiry dates near name entries
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    for (const owned of result.owned_names) {
      if (line.includes(owned.name)) {
        // Look for date patterns nearby
        for (let j = i; j < Math.min(lines.length, i + 5); j++) {
          const dateMatch = lines[j].match(/(\w{3}\s+\d{1,2},\s*\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}월\s+\d{1,2},\s*\d{4})/);
          if (dateMatch && !owned.expiry) owned.expiry = dateMatch[1];
        }
      }
    }
  }

  // If no primary name found but we have owned names, use the first one
  if (!result.primary_name && result.owned_names.length > 0) {
    result.primary_name = result.owned_names[0].name;
  }

  return result;
}

async function main() {
  const address = process.argv[2];
  if (!address || address === "--debug") {
    console.error("Usage: npx tsx ens/reverse_lookup.ts <ethereum_address>");
    console.error("Example: npx tsx ens/reverse_lookup.ts 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
    process.exit(1);
  }
  const debug = process.argv.includes("--debug");
  const url = `https://app.ens.domains/${address}`;
  console.log(`Looking up ENS names for: ${address}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) { printMarkdown(data); console.log("\n--- Parsed ---\n"); }

  const result = parseReverseLookup(md, address);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("reverse_lookup.ts") || process.argv[1]?.endsWith("reverse_lookup.js");
if (isDirectRun) main();
