/**
 * Recipe: ENS Name Availability Check (SPA)
 * Checks multiple ENS names by browsing their profile pages in parallel.
 * A registered name shows profile data; an unregistered name shows registration options.
 *
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx ens/search.ts vitalik satoshi nakamoto
 *   npx tsx ens/search.ts ethereum --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";
import { BROWSE_OPTS, buildNameUrl, normalizeDate } from "./utils.js";

export interface NameCheck {
  name: string;
  url: string;
  registered: boolean;
  owner: string;
  expiry: string;
}

export function parseNameCheck(markdown: string, name: string, url: string): NameCheck {
  const lines = markdown.split("\n").map((l) => l.trim());

  // A registered name has an Ownership section with owner/expiry
  // An unregistered name shows "Register" button or pricing
  const mdLower = markdown.toLowerCase();
  const hasOwnership = mdLower.includes("\nowner\n") || mdLower.includes("\nmanager\n");
  const hasRegister = mdLower.includes("register this name") || mdLower.includes("registration");
  const registered = hasOwnership && !hasRegister;

  // Find owner (next non-empty line after exact "owner" line)
  let owner = "";
  let expiry = "";
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase() === "owner") {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        if (lines[j]) { owner = lines[j]; break; }
      }
    }
    if (lines[i].toLowerCase() === "expiry") {
      for (let j = i + 1; j < Math.min(lines.length, i + 5); j++) {
        if (lines[j]) { expiry = lines[j]; break; }
      }
    }
  }

  return { name, url, registered, owner, expiry: normalizeDate(expiry) };
}

async function main() {
  const args = process.argv.slice(2).filter((a) => a !== "--debug");
  const debug = process.argv.includes("--debug");

  if (args.length === 0) {
    console.log("Usage: npx tsx ens/search.ts name1 [name2 name3 ...]");
    process.exit(1);
  }

  const names = args.map((a) => (a.endsWith(".eth") ? a : `${a}.eth`));

  console.log(`Checking ${names.length} ENS name(s)...\n`);

  const results: NameCheck[] = [];
  for (const name of names) {
    const url = buildNameUrl(name);
    const data = await browse(url, BROWSE_OPTS);
    const md = data?.extracted_content ?? "";

    if (debug) {
      console.log(`--- ${name} raw ---`);
      printMarkdown(data);
      console.log("");
    }

    results.push(parseNameCheck(md, name, url));
  }

  console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
}

const isDirectRun =
  process.argv[1]?.endsWith("search.ts") || process.argv[1]?.endsWith("search.js");
if (isDirectRun) main();
