/**
 * Recipe: Chainlink Feed Detail (SPA)
 * Scrapes detailed information for a specific Chainlink data feed.
 *
 * URL: https://data.chain.link/feeds/ethereum/mainnet/btc-usd
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx chainlink/feed_detail.ts btc-usd
 *   npx tsx chainlink/feed_detail.ts eth-usd arbitrum
 *   npx tsx chainlink/feed_detail.ts link-usd --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, BASE_URL, resolveNetwork } from "./utils.js";

export interface FeedDetail {
  pair: string;
  asset_name: string;
  answer: string;
  asset_class: string;
  network: string;
  tier: string;
  deviation_threshold: string;
  heartbeat: string;
  last_update: string;
  market_cap: string;
  circulating_supply: string;
  volume_24h: string;
  product_name: string;
  product_type: string;
  product_sub_type: string;
  quote_asset: string;
  contract_standard: string;
  contract_svr: string;
  ens_address: string;
  oracle_count: string;
  min_answers: string;
  oracles: { name: string; answer: string; address: string }[];
  available_networks: string[];
  url: string;
}

/** Strip markdown image syntax */
function strip(s: string): string {
  return s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
}

/**
 * Extract value from a line where label and value are concatenated (e.g., "Deviation threshold0.5%")
 * or on adjacent lines.
 */
function fieldFromMd(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    const clean = strip(lines[i]);
    if (!clean.toLowerCase().includes(label.toLowerCase())) continue;

    // Same-line: "LabelValue" pattern
    const afterLabel = clean.slice(clean.toLowerCase().indexOf(label.toLowerCase()) + label.length).trim();
    if (afterLabel && afterLabel.length > 0) return afterLabel;

    // Next non-empty line
    for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
      const val = strip(lines[j]);
      if (val && !val.startsWith("#") && !val.startsWith("---") && !val.startsWith("*")) return val;
    }
  }
  return "";
}

export function parseFeedDetail(markdown: string, url: string): FeedDetail {
  const lines = markdown.split("\n");

  // Pair from title: "# ...BTC / USD"
  let pair = "";
  for (const line of lines) {
    const m = strip(line).match(/^#\s+(.+?\/\s*.+)$/);
    if (m) { pair = m[1].trim(); break; }
  }

  // Asset name: standalone "# AssetName" after pair heading
  let assetName = "";
  let foundPair = false;
  for (const line of lines) {
    if (strip(line).match(/^#\s+.+\/.+/)) { foundPair = true; continue; }
    if (foundPair && line.trim().startsWith("# ")) {
      assetName = line.trim().replace(/^#\s+/, "");
      break;
    }
  }

  // Answer: line with $ or Ξ or ₿ after "Answer"
  let answer = "";
  const answerRaw = fieldFromMd(lines, "Answer");
  const answerMatch = answerRaw.match(/([\$Ξ₿][\d,.\s]+)/);
  if (answerMatch) answer = answerMatch[1].trim();

  // Contract addresses: [0xABCD...1234](etherscan url)
  const contracts: { label: string; address: string }[] = [];
  let inAddresses = false;
  let currentLabel = "";
  for (const line of lines) {
    if (line.trim().startsWith("## Addresses") || line.trim() === "Contract addresses") {
      inAddresses = true;
      continue;
    }
    if (inAddresses) {
      if (line.trim().startsWith("## ") && !line.includes("Addresses")) break;
      if (line.trim() === "Standard" || line.trim() === "SVR Proxy" || line.trim() === "AAVE SVR Proxy") {
        currentLabel = line.trim();
        continue;
      }
      if (line.trim().startsWith("ENS address")) { currentLabel = "ENS"; continue; }
      const addrMatch = line.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
      if (addrMatch && currentLabel) {
        contracts.push({ label: currentLabel, address: addrMatch[1] });
        currentLabel = "";
      }
    }
  }

  // Oracle table
  const oracles: { name: string; answer: string; address: string }[] = [];
  let inOracleTable = false;
  for (const line of lines) {
    if (line.includes("| Oracle")) { inOracleTable = true; continue; }
    if (inOracleTable) {
      if (!line.startsWith("|")) { if (line.trim()) break; continue; }
      const cells = line.split("|").map((c) => c.trim());
      if (cells[1]?.startsWith("---")) continue;
      const nameRaw = cells[1] || "";
      const name = nameRaw.replace(/(Responded|Awaiting response)$/, "").trim();
      if (!name) continue;
      const oracleAnswer = cells[2] || "";
      let address = "";
      const ethMatch = (cells[4] || "").match(/etherscan\.io\/address\/(0x[0-9a-fA-F]+)/);
      if (ethMatch) address = ethMatch[1];
      oracles.push({ name, answer: oracleAnswer, address });
    }
  }

  // Available networks from "Also on" links
  const availableNetworks: string[] = [];
  const netRe = /data\.chain\.link\/feeds\/([^/]+)\//g;
  let nm;
  while ((nm = netRe.exec(markdown)) !== null) {
    const net = nm[1];
    if (net !== "ethereum" && !availableNetworks.includes(net)) availableNetworks.push(net);
  }

  // Oracle count: "Minimum of XX / YY"
  const minMatch = markdown.match(/Minimum of\s*(\d+)\s*(\d+)\s*\/\s*(\d+)/);

  return {
    pair,
    asset_name: assetName,
    answer,
    asset_class: strip(fieldFromMd(lines, "Crypto") ? "Crypto" : fieldFromMd(lines, "Fiat") ? "Fiat" : ""),
    network: fieldFromMd(lines, "Network").replace(/^.*Mainnet/, "").trim() || fieldFromMd(lines, "Ethereum Mainnet") ? strip(fieldFromMd(lines, "Network")) : "",
    tier: fieldFromMd(lines, "Tier").replace(/Tier/i, "").trim() || fieldFromMd(lines, "Market Risk"),
    deviation_threshold: fieldFromMd(lines, "Deviation threshold"),
    heartbeat: fieldFromMd(lines, "Heartbeat"),
    last_update: fieldFromMd(lines, "Last update"),
    market_cap: fieldFromMd(lines, "Market cap"),
    circulating_supply: fieldFromMd(lines, "Circulating supply"),
    volume_24h: fieldFromMd(lines, "Volume (24hr)"),
    product_name: fieldFromMd(lines, "Product name"),
    product_type: strip(fieldFromMd(lines, "Product type")),
    product_sub_type: strip(fieldFromMd(lines, "Product sub-type")),
    quote_asset: fieldFromMd(lines, "Quote asset"),
    contract_standard: contracts.find((c) => c.label === "Standard")?.address || "",
    contract_svr: contracts.find((c) => c.label === "SVR Proxy")?.address || "",
    ens_address: contracts.find((c) => c.label === "ENS")?.address || "",
    oracle_count: minMatch ? `${minMatch[1]} / ${minMatch[3]}` : String(oracles.length || ""),
    min_answers: minMatch ? minMatch[1] : "",
    oracles,
    available_networks: availableNetworks,
    url,
  };
}

function buildFeedUrl(pair: string, networkSlug?: string): string {
  const network = networkSlug ?? "ethereum";
  const chain = network === "ethereum" ? "ethereum/mainnet" : `${network}/mainnet`;
  return `${BASE_URL}/feeds/${chain}/${pair}`;
}

async function main() {
  const pair = process.argv[2] || "btc-usd";
  const networkArg = process.argv[3];
  const debug = process.argv.includes("--debug");

  const network = networkArg && networkArg !== "--debug" ? resolveNetwork(networkArg) : undefined;
  const url = buildFeedUrl(pair, network?.slug);
  console.log(`Fetching Chainlink feed detail: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const detail = parseFeedDetail(md, url);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("feed_detail.ts") || process.argv[1]?.endsWith("feed_detail.js");
if (isDirectRun) main();
