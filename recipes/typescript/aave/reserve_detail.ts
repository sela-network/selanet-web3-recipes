/**
 * Recipe: Aave Reserve Detail
 * Scrapes detailed reserve/asset information from Aave V3.
 *
 * URL: https://app.aave.com/reserve-overview/?underlyingAsset=0x...&marketName=proto_aave_v3
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx aave/reserve_detail.ts 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
 *   npx tsx aave/reserve_detail.ts 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 base
 *   npx tsx aave/reserve_detail.ts 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2 ethereum --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, resolveNetwork, BASE_URL } from "./utils.js";

export interface ReserveDetail {
  asset: string;
  supply_info: {
    total_supplied: string;
    apy: string;
    supply_cap: string;
    utilization: string;
  };
  borrow_info: {
    total_borrowed: string;
    apy_variable: string;
    borrow_cap: string;
  };
  reserve_info: {
    reserve_factor: string;
    collector_contract: string;
    liquidation_threshold: string;
    ltv: string;
    liquidation_penalty: string;
  };
  raw_sections: Record<string, string>;
}

export function parseReserveDetail(markdown: string): ReserveDetail {
  const result: ReserveDetail = {
    asset: "",
    supply_info: { total_supplied: "", apy: "", supply_cap: "", utilization: "" },
    borrow_info: { total_borrowed: "", apy_variable: "", borrow_cap: "" },
    reserve_info: {
      reserve_factor: "",
      collector_contract: "",
      liquidation_threshold: "",
      ltv: "",
      liquidation_penalty: "",
    },
    raw_sections: {},
  };

  const lines = markdown.split("\n");

  // Extract asset name from heading
  for (const line of lines) {
    const headingMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headingMatch && !headingMatch[1].toLowerCase().includes("aave")) {
      result.asset = headingMatch[1].replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
      if (result.asset) break;
    }
  }

  // Extract key-value pairs from the page
  const kvPairs = extractKeyValues(markdown);

  // Map known keys to structured fields
  const supplyKeys = ["total supplied", "supply apy", "supply cap", "utilization"];
  const borrowKeys = ["total borrowed", "borrow apy", "variable apy", "borrow cap"];
  const reserveKeys = ["reserve factor", "collector contract", "liquidation threshold", "ltv", "max ltv", "liquidation penalty"];

  for (const [key, val] of Object.entries(kvPairs)) {
    const k = key.toLowerCase();
    if (k.includes("total supplied")) result.supply_info.total_supplied = val;
    else if (k.includes("supply apy") || k.includes("supply apr")) result.supply_info.apy = val;
    else if (k.includes("supply cap")) result.supply_info.supply_cap = val;
    else if (k.includes("utilization")) result.supply_info.utilization = val;
    else if (k.includes("total borrowed")) result.borrow_info.total_borrowed = val;
    else if (k.includes("borrow apy") || k.includes("variable apy")) result.borrow_info.apy_variable = val;
    else if (k.includes("borrow cap")) result.borrow_info.borrow_cap = val;
    else if (k.includes("reserve factor")) result.reserve_info.reserve_factor = val;
    else if (k.includes("collector")) result.reserve_info.collector_contract = val;
    else if (k.includes("liquidation threshold")) result.reserve_info.liquidation_threshold = val;
    else if (k.includes("ltv") || k.includes("loan to value")) result.reserve_info.ltv = val;
    else if (k.includes("liquidation penalty") || k.includes("liquidation bonus")) result.reserve_info.liquidation_penalty = val;
  }

  // Store raw sections for debugging
  let currentSection = "";
  for (const line of lines) {
    const sectionMatch = line.match(/^#{2,4}\s+(.+)/);
    if (sectionMatch) {
      currentSection = sectionMatch[1].trim();
      result.raw_sections[currentSection] = "";
    } else if (currentSection && line.trim()) {
      result.raw_sections[currentSection] += line.trim() + "\n";
    }
  }

  return result;
}

function extractKeyValues(markdown: string): Record<string, string> {
  const kvs: Record<string, string> = {};

  // Pattern 1: "Key: Value" or "Key Value" on same line
  const kvRe = /^([A-Za-z\s]+?)\s*[:]\s*(.+)$/gm;
  let m;
  while ((m = kvRe.exec(markdown)) !== null) {
    kvs[m[1].trim()] = m[2].trim();
  }

  // Pattern 2: Table rows "| Key | Value |"
  const tableRe = /\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/g;
  while ((m = tableRe.exec(markdown)) !== null) {
    const key = m[1].trim();
    const val = m[2].trim();
    if (key && val && !key.startsWith("---") && !key.toLowerCase().startsWith("metric")) {
      kvs[key] = val;
    }
  }

  // Pattern 3: Adjacent lines "Key\nValue"
  const lines = markdown.split("\n").map((l) => l.trim()).filter(Boolean);
  const valueRe = /^[\d$%,.]+|^\$[\d,.]+/;
  for (let i = 0; i < lines.length - 1; i++) {
    if (!valueRe.test(lines[i]) && valueRe.test(lines[i + 1])) {
      const key = lines[i].replace(/[*_#]/g, "").trim();
      if (key.length > 2 && key.length < 40) {
        kvs[key] = lines[i + 1];
      }
    }
  }

  return kvs;
}

async function main() {
  const assetAddress = process.argv[2];
  if (!assetAddress) {
    console.error("Usage: npx tsx aave/reserve_detail.ts <underlyingAsset> [network]");
    console.error("Example: npx tsx aave/reserve_detail.ts 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2");
    process.exit(1);
  }

  const networkArg = process.argv[3];
  const debug = process.argv.includes("--debug");
  const network = networkArg && networkArg !== "--debug" ? resolveNetwork(networkArg) : resolveNetwork();

  const url = `${BASE_URL}/reserve-overview/?underlyingAsset=${assetAddress}&marketName=${network.slug}`;
  console.log(`Fetching Aave reserve detail: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const detail = parseReserveDetail(md);
  console.log(
    JSON.stringify(
      {
        network: network.name,
        underlying_asset: assetAddress,
        ...detail,
      },
      null,
      2
    )
  );
}

const isDirectRun =
  process.argv[1]?.endsWith("reserve_detail.ts") || process.argv[1]?.endsWith("reserve_detail.js");
if (isDirectRun) main();
