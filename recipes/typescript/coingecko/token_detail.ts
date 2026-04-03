/**
 * Recipe: CoinGecko Token Detail
 * Scrapes detailed information for a specific cryptocurrency.
 *
 * URL: https://www.coingecko.com/en/coins/{id}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/token_detail.ts bitcoin
 *   npx tsx coingecko/token_detail.ts ethereum
 *   npx tsx coingecko/token_detail.ts solana --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

export interface TokenDetail {
  name: string;
  symbol: string;
  price: string;
  change_24h: string;
  market_cap: string;
  market_cap_rank: string;
  volume_24h: string;
  fdv: string;
  circulating_supply: string;
  total_supply: string;
  max_supply: string;
  ath: string;
  atl: string;
  description: string;
  categories: string[];
  links: { label: string; url: string }[];
}

export function parseTokenDetail(markdown: string): TokenDetail {
  const result: TokenDetail = {
    name: "", symbol: "", price: "", change_24h: "",
    market_cap: "", market_cap_rank: "", volume_24h: "",
    fdv: "", circulating_supply: "", total_supply: "",
    max_supply: "", ath: "", atl: "", description: "",
    categories: [], links: [],
  };

  const lines = markdown.split("\n");
  const dollarRe = /\$[\d,.]+[KMBT]?/;
  const pctRe = /[+-]?[\d.]+%/;

  // Extract name from heading: "# Bitcoin" (no symbol in heading)
  for (const line of lines) {
    const m = line.match(/^#\s+([A-Z][A-Za-z0-9 .]+)\s*$/);
    if (m && !m[1].includes("Price") && !m[1].includes("Chart") && !m[1].includes("Statistics")) {
      result.name = m[1].trim();
      break;
    }
  }

  // Extract symbol and price from "BTC $66,870.05" pattern
  for (const line of lines) {
    const m = line.trim().match(/^([A-Z]{2,10})\s+\$([\d,.]+)\s*/);
    if (m && !result.price) {
      result.symbol = m[1];
      result.price = "$" + m[2];
      const cm = line.match(pctRe);
      if (cm) result.change_24h = cm[0];
      break;
    }
  }

  // Key-value extraction
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    const raw = lines[i].trim();
    const nextRaw = lines[i + 1]?.trim() || "";

    if (line.includes("market cap") && !line.includes("fdv") && !result.market_cap) {
      const m = (raw + " " + nextRaw).match(dollarRe);
      if (m) result.market_cap = m[0];
    }
    if (line.includes("rank") && line.includes("#")) {
      const m = raw.match(/#(\d+)/);
      if (m) result.market_cap_rank = "#" + m[1];
    }
    if (line.includes("24h") && line.includes("vol")) {
      const m = (raw + " " + nextRaw).match(dollarRe);
      if (m) result.volume_24h = m[0];
    }
    if (line.includes("fully diluted") || (line.includes("fdv") && !line.includes("market cap"))) {
      const m = (raw + " " + nextRaw).match(dollarRe);
      if (m) result.fdv = m[0];
    }
    if (line.includes("circulating supply")) {
      const m = (raw + " " + nextRaw).match(/[\d,.]+[KMBT]?/);
      if (m) result.circulating_supply = m[0];
    }
    if (line.includes("total supply") && !line.includes("max")) {
      const m = (raw + " " + nextRaw).match(/[\d,.]+[KMBT]?/);
      if (m) result.total_supply = m[0];
    }
    if (line.includes("max supply")) {
      const m = (raw + " " + nextRaw).match(/[\d,.]+[KMBT]?/);
      if (m) result.max_supply = m[0];
    }
    if (line.includes("all-time high") || line.includes("ath")) {
      const m = (raw + " " + nextRaw).match(dollarRe);
      if (m && !result.ath) result.ath = m[0];
    }
    if (line.includes("all-time low") || line.includes("atl")) {
      const m = (raw + " " + nextRaw).match(dollarRe);
      if (m && !result.atl) result.atl = m[0];
    }
  }

  // Description: find first long paragraph that's actual content (not nav/menu)
  const skipWords = ["developer", "login", "sign", "upgrade", "premium", "manage", "dashboard", "cookie", "privacy", "terms"];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 100 && !trimmed.startsWith("[") && !trimmed.startsWith("|") && !trimmed.startsWith("#") && !trimmed.startsWith("!")) {
      const lower = trimmed.toLowerCase();
      if (skipWords.some(w => lower.includes(w))) continue;
      result.description = trimmed.substring(0, 500);
      break;
    }
  }

  // Categories
  for (const line of lines) {
    if (line.toLowerCase().includes("categor")) {
      const cats = line.match(/\[([^\]]+)\]\([^)]*categor[^)]*\)/g);
      if (cats) {
        result.categories = cats.map(c => {
          const m = c.match(/\[([^\]]+)\]/);
          return m ? m[1] : "";
        }).filter(Boolean);
      }
    }
  }

  return result;
}

async function main() {
  const coinId = process.argv[2];
  if (!coinId || coinId === "--debug") {
    console.error("Usage: npx tsx coingecko/token_detail.ts <coin_id>");
    console.error("Example: npx tsx coingecko/token_detail.ts bitcoin");
    process.exit(1);
  }
  const debug = process.argv.includes("--debug");
  const url = `https://www.coingecko.com/en/coins/${coinId}`;
  console.log(`Fetching token detail from CoinGecko: ${url}\n`);

  const data = await browse(url);
  const md = data?.extracted_content ?? "";

  if (debug) { printMarkdown(data); console.log("\n--- Parsed ---\n"); }

  const detail = parseTokenDetail(md);
  console.log(JSON.stringify({ coin_id: coinId, ...detail }, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("token_detail.ts") || process.argv[1]?.endsWith("token_detail.js");
if (isDirectRun) main();
