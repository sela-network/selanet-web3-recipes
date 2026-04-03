/**
 * Recipe: Chainlink Data Feeds
 * Scrapes price feed listings from the Chainlink data feeds page.
 *
 * URL: https://data.chain.link/feeds
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx chainlink/feeds.ts
 *   npx tsx chainlink/feeds.ts ethereum crypto
 *   npx tsx chainlink/feeds.ts arbitrum --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, resolveNetwork, buildFeedsUrl } from "./utils.js";
import type { Category } from "./utils.js";

export interface Feed {
  name: string;
  network: string;
  answer: string;
  deviation: string;
  heartbeat: string;
  asset_class: string;
  svr_enabled: boolean;
  url: string;
}

export function parseFeeds(markdown: string): Feed[] {
  const results: Feed[] = [];
  const lines = markdown.split("\n");

  // Chainlink feeds page renders as a table or structured list
  // Try table format first (markdown table with | delimiters)
  const tableFeeds = parseTable(lines);
  if (tableFeeds.length > 0) return tableFeeds;

  // Fallback: parse structured blocks (SPA may render as cards/rows)
  return parseBlocks(lines);
}

/** Strip markdown image syntax `![...](...)` from a string */
function stripImages(s: string): string {
  return s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
}

function parseTable(lines: string[]): Feed[] {
  const results: Feed[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map((c) => c.trim());
    if (cells.length < 5) continue;

    // Skip header/separator rows
    const first = cells[1] || "";
    if (first.startsWith("---") || first.toLowerCase().startsWith("feed") || first.toLowerCase() === "name") continue;

    // Look for feed name pattern (e.g., "BTC / USD", "ETH / USD")
    if (!first.includes("/")) continue;

    // Extract URL from markdown link in the feed cell
    let url = "";
    const urlMatch = first.match(/\]\((https:\/\/data\.chain\.link\/feeds[^)]*)\)/);
    if (urlMatch) url = urlMatch[1];

    // Strip images and extract clean name; detect SVR from feed cell text
    const feedCellClean = stripImages(first);
    const svr = feedCellClean.includes("SVR");
    const nameMatch = feedCellClean.match(/\[([^\]]+)\]/);
    const feedName = nameMatch ? nameMatch[1].trim() : feedCellClean.replace(/SVR$/, "").replace(/\[.*\]\(.*\)/g, "").trim();

    results.push({
      name: feedName,
      network: stripImages(cells[2] || ""),
      answer: cells[3] || "",
      deviation: cells[4] || "",
      heartbeat: cells[5] || "",
      asset_class: stripImages(cells[6] || ""),
      svr_enabled: svr,
      url,
    });
  }

  return results;
}

function parseBlocks(lines: string[]): Feed[] {
  const results: Feed[] = [];
  const feedRe = /([A-Z0-9]+\s*\/\s*[A-Z0-9]+)/;
  const answerRe = /(\$?[\d,]+\.?\d*)/;
  const deviationRe = /([\d.]+\s*%)/;
  const heartbeatRe = /(\d+[smh]|\d+\s*(?:sec|min|hour|day))/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const feedMatch = line.match(feedRe);
    if (!feedMatch) continue;

    const name = feedMatch[1].trim();
    // Avoid matching navigation/header items
    if (name.length < 3) continue;

    // Look at surrounding lines for context
    const context = lines.slice(i, Math.min(lines.length, i + 8)).join("\n");

    let url = "";
    const urlMatch = context.match(/\]\((https:\/\/data\.chain\.link\/feeds[^)]*)\)/);
    if (urlMatch) url = urlMatch[1];

    const answerMatch = context.match(answerRe);
    const devMatch = context.match(deviationRe);
    const hbMatch = context.match(heartbeatRe);

    // Determine network and asset class from context
    let network = "";
    let assetClass = "";
    const networkWords = ["ethereum", "arbitrum", "avalanche", "base", "bnb", "polygon", "optimism", "scroll", "sonic"];
    const assetWords = ["crypto", "fiat", "commodity", "equity", "etf", "index", "stablecoin"];
    const ctxLower = context.toLowerCase();
    for (const nw of networkWords) {
      if (ctxLower.includes(nw)) { network = nw; break; }
    }
    for (const aw of assetWords) {
      if (ctxLower.includes(aw)) { assetClass = aw; break; }
    }

    results.push({
      name,
      network,
      answer: answerMatch ? answerMatch[1] : "",
      deviation: devMatch ? devMatch[1] : "",
      heartbeat: hbMatch ? hbMatch[1] : "",
      asset_class: assetClass,
      svr_enabled: ctxLower.includes("svr"),
      url,
    });
  }

  return results;
}

async function main() {
  const networkArg = process.argv[2];
  const categoryArg = process.argv[3] as Category | undefined;
  const debug = process.argv.includes("--debug");

  const network = networkArg && networkArg !== "--debug" ? resolveNetwork(networkArg) : undefined;
  const url = buildFeedsUrl(network?.slug, categoryArg);
  console.log(`Fetching Chainlink feeds: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const feeds = parseFeeds(md);
  console.log(
    JSON.stringify(
      {
        network: network?.name ?? "all",
        category: categoryArg ?? "all",
        count: feeds.length,
        feeds,
      },
      null,
      2
    )
  );
}

const isDirectRun =
  process.argv[1]?.endsWith("feeds.ts") || process.argv[1]?.endsWith("feeds.js");
if (isDirectRun) main();
