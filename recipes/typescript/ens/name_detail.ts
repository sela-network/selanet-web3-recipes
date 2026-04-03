/**
 * Recipe: ENS Name Detail (SPA)
 * Scrapes detailed information for a specific ENS name from the ENS app.
 *
 * URL: https://app.ens.domains/{name}.eth
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx ens/name_detail.ts vitalik.eth
 *   npx tsx ens/name_detail.ts nick
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildNameUrl, normalizeDate } from "./utils.js";

export interface NameDetail {
  name: string;
  url: string;
  description: string;
  website: string;
  accounts: Record<string, string>;
  eth_address: string;
  owner: string;
  manager: string;
  expiry: string;
  parent: string;
  records: Record<string, string>;
}

/**
 * Find the next non-empty line after a line that exactly matches `label`.
 * Handles blank lines between label and value.
 */
function exactLineField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().toLowerCase() === label.toLowerCase()) {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        const val = lines[j]?.trim();
        if (val) return val;
      }
    }
  }
  return "";
}

export function parseNameDetail(markdown: string, name: string, url: string): NameDetail {
  const lines = markdown.split("\n").map((l) => l.trim());

  // ETH address from Etherscan link
  let ethAddress = "";
  for (const line of lines) {
    const m = line.match(/etherscan\.io\/address\/(0x[0-9a-fA-F]{40})/);
    if (m) { ethAddress = m[1]; break; }
  }

  // Description: first non-empty, non-link line after the second occurrence of the ENS name
  let description = "";
  let nameCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === name) {
      nameCount++;
      if (nameCount === 2) {
        const descLines: string[] = [];
        for (let j = i + 1; j < lines.length; j++) {
          const l = lines[j];
          if (l.startsWith("[") || l.startsWith("!") || l === "Accounts" || l === "Addresses") break;
          if (l) descLines.push(l);
        }
        description = descLines.join(" ");
        break;
      }
    }
  }

  // Website: standalone URL link before Accounts section
  let website = "";
  for (const line of lines) {
    const m = line.match(/^\[([^\]]+)\]\((https?:\/\/(?!x\.com|github\.com|etherscan)[^)]+)\)$/);
    if (m && !m[2].includes("ens.domains") && !m[2].includes("euc.li")) {
      website = m[2];
      break;
    }
  }

  // Accounts: links in the Accounts section (Twitter, GitHub, etc.)
  const accounts: Record<string, string> = {};
  let inAccounts = false;
  for (const line of lines) {
    if (line === "Accounts") { inAccounts = true; continue; }
    if (inAccounts) {
      if (line === "Addresses" || line === "Other Records" || line === "") {
        if (line === "Addresses" || line === "Other Records") break;
        continue;
      }
      const m = line.match(/^\[([^\]]+)\]\((https?:\/\/([^/]+)[^)]*)\)$/);
      if (m) {
        const domain = m[3].replace("www.", "");
        if (domain.includes("x.com") || domain.includes("twitter.com")) accounts.twitter = m[1];
        else if (domain.includes("github.com")) accounts.github = m[1];
        else if (domain.includes("discord")) accounts.discord = m[1];
        else if (domain.includes("telegram")) accounts.telegram = m[1];
        else accounts[domain] = m[1];
      }
    }
  }

  // Other Records: avatar, header, contenthash, pgp, etc.
  // Markdown pattern: "[key" (blank) "value...](url)" or "key" (blank) "value"
  const records: Record<string, string> = {};
  let inRecords = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === "Other Records") { inRecords = true; continue; }
    if (inRecords) {
      if (lines[i].startsWith("Ownership")) break;
      if (!lines[i]) continue;

      // Pattern: "[key" ... "value...](url)"
      const linkMatch = lines[i].match(/^\[(\w+)$/);
      if (linkMatch) {
        const key = linkMatch[1];
        for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
          if (!lines[j]) continue;
          const urlMatch = lines[j].match(/\]\((https?:\/\/[^)]+)\)$/);
          records[key] = urlMatch ? urlMatch[1] : lines[j];
          i = j; // skip past the value line
          break;
        }
        continue;
      }
      // Pattern: "key" ... "value" (no link, e.g., pgp)
      if (/^[a-z]/.test(lines[i])) {
        const key = lines[i];
        for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
          if (!lines[j]) continue;
          records[key] = lines[j];
          i = j; // skip past the value line
          break;
        }
      }
    }
  }

  // Ownership section: exact line matches
  const owner = exactLineField(lines, "owner");
  const manager = exactLineField(lines, "manager");
  const expiry = exactLineField(lines, "expiry");
  const parent = exactLineField(lines, "parent");

  return {
    name,
    url,
    description,
    website,
    accounts,
    eth_address: ethAddress,
    owner,
    manager,
    expiry: normalizeDate(expiry),
    parent,
    records,
  };
}

async function main() {
  const input = process.argv[2] || "vitalik.eth";
  const debug = process.argv.includes("--debug");
  const name = input.endsWith(".eth") ? input : `${input}.eth`;
  const url = buildNameUrl(name);
  console.log(`Fetching ENS name detail: ${url}\n`);

  const data = await browse(url, BROWSE_OPTS);
  const md = data?.extracted_content ?? "";

  if (debug) {
    printMarkdown(data);
    console.log("\n--- Parsed ---\n");
  }

  const detail = parseNameDetail(md, name, url);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("name_detail.ts") || process.argv[1]?.endsWith("name_detail.js");
if (isDirectRun) main();
