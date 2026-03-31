/**
 * Recipe: People from RootData
 * Scrapes crypto industry people/leaders directory.
 *
 * URL: https://www.rootdata.com/people
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/people.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface Person {
  name: string;
  slug: string;
  url: string;
  image: string;
  company: string;
  company_url: string;
  position: string;
}

export function parseMarkdownTable(markdown: string): Person[] {
  const lines = markdown.split("\n");
  const results: Person[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, name, company, position, empty]

    const nameCell = cells[1] || "";
    const match = nameCell.match(
      /\[!\[([^\]]*)\]\(([^)]+)\)\]\([^)]+\)\s+\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/member\/([^?]+)\?[^)]*)\)/
    );
    if (!match) continue;

    const companyCell = cells[2] || "";
    const compMatch = companyCell.match(
      /\[([^\]]+)\]\((https:\/\/www\.rootdata\.com\/[^)]+)\)/
    );

    results.push({
      name: match[3],
      slug: decodeURIComponent(match[5]),
      url: match[4],
      image: match[2],
      company: compMatch ? compMatch[1] : companyCell,
      company_url: compMatch ? compMatch[2] : "",
      position: cells[3]?.trim() || "",
    });
  }

  return results;
}

async function main() {
  console.log("Fetching people from RootData...\n");
  const data = await browse("https://www.rootdata.com/people");
  const markdown = data?.extracted_content ?? "";
  const people = parseMarkdownTable(markdown);
  console.log(JSON.stringify(people, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("people.ts") || process.argv[1]?.endsWith("people.js");
if (isDirectRun) main();
