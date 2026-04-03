/**
 * Recipe: RootData Project Detail
 * Scrapes detailed information for a specific crypto project.
 *
 * URL: https://www.rootdata.com/Projects/detail/{slug}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx rootdata/project_detail.ts Uniswap
 *   npx tsx rootdata/project_detail.ts Aave --debug
 */

import "dotenv/config";
import { browse, printMarkdown } from "../utils.js";

export interface ProjectDetail {
  name: string;
  description: string;
  tags: string[];
  social_links: { label: string; url: string }[];
  team_members: { name: string; role: string }[];
  investors: string[];
  fundraising_rounds: { round: string; amount: string; date: string }[];
  raw_sections: Record<string, string>;
}

export function parseProjectDetail(markdown: string): ProjectDetail {
  const result: ProjectDetail = {
    name: "", description: "", tags: [], social_links: [],
    team_members: [], investors: [], fundraising_rounds: [],
    raw_sections: {},
  };

  const lines = markdown.split("\n");

  // Name from heading
  for (const line of lines) {
    const m = line.match(/^#{1,2}\s+(.+)/);
    if (m) {
      const name = m[1].replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
      if (name && name.length < 60 && !name.toLowerCase().includes("rootdata")) {
        result.name = name;
        break;
      }
    }
  }

  // Description: first long paragraph
  for (const line of lines) {
    const t = line.trim();
    if (t.length > 80 && !t.startsWith("[") && !t.startsWith("|") && !t.startsWith("#") && !t.startsWith("!")) {
      result.description = t.substring(0, 500);
      break;
    }
  }

  // Tags from inline tag patterns
  const tagRe = /\[([A-Za-z0-9 &]+)\]\(https:\/\/www\.rootdata\.com\/[^)]*\)/g;
  let tm;
  const tagSet = new Set<string>();
  for (const line of lines) {
    while ((tm = tagRe.exec(line)) !== null) {
      const tag = tm[1].trim();
      if (tag.length < 30 && !tag.includes("http")) tagSet.add(tag);
    }
  }
  result.tags = Array.from(tagSet);

  // Social links
  const socialDomains = ["twitter.com", "x.com", "github.com", "discord", "t.me", "medium.com", "linkedin.com"];
  for (const line of lines) {
    const linkRe = /\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
    let lm;
    while ((lm = linkRe.exec(line)) !== null) {
      const url = lm[2];
      if (socialDomains.some(d => url.includes(d))) {
        result.social_links.push({ label: lm[1].trim() || url, url });
      }
    }
  }

  // Team members: look for patterns like "Name — Role" or "Name, Role"
  let inTeam = false;
  for (const line of lines) {
    if (line.toLowerCase().includes("team") && line.startsWith("#")) inTeam = true;
    if (inTeam && line.startsWith("#") && !line.toLowerCase().includes("team")) inTeam = false;
    if (inTeam) {
      const tmMatch = line.match(/\[([^\]]+)\].*?(?:—|–|-|,)\s*(.+)/);
      if (tmMatch) {
        result.team_members.push({
          name: tmMatch[1].trim(),
          role: tmMatch[2].replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim(),
        });
      }
    }
  }

  // Investors
  let inInvestors = false;
  for (const line of lines) {
    if (line.toLowerCase().includes("investor") && line.startsWith("#")) inInvestors = true;
    if (inInvestors && line.startsWith("#") && !line.toLowerCase().includes("investor")) inInvestors = false;
    if (inInvestors) {
      const invRe = /\[([^\]]+)\]\(https:\/\/www\.rootdata\.com\/Investors/g;
      let im;
      while ((im = invRe.exec(line)) !== null) {
        result.investors.push(im[1].trim());
      }
    }
  }

  // Fundraising rounds from table
  for (const line of lines) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").map(c => c.trim());
    if (cells.length < 3) continue;
    const roundCell = cells[1] || "";
    if (roundCell.startsWith("---") || roundCell.toLowerCase().includes("round")) continue;
    const amountMatch = (cells[2] || "").match(/\$[\d,.]+[KMBT]?/);
    if (amountMatch || roundCell.match(/seed|series|pre-|private|public|ico|ido/i)) {
      result.fundraising_rounds.push({
        round: roundCell.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").trim(),
        amount: amountMatch ? amountMatch[0] : cells[2] || "",
        date: cells[3] || "",
      });
    }
  }

  // Raw sections
  let currentSection = "";
  for (const line of lines) {
    const sm = line.match(/^#{2,3}\s+(.+)/);
    if (sm) {
      currentSection = sm[1].trim();
      result.raw_sections[currentSection] = "";
    } else if (currentSection && line.trim()) {
      result.raw_sections[currentSection] += line.trim() + "\n";
    }
  }

  return result;
}

async function main() {
  const slug = process.argv[2];
  if (!slug || slug === "--debug") {
    console.error("Usage: npx tsx rootdata/project_detail.ts <project_slug>");
    console.error("Example: npx tsx rootdata/project_detail.ts Uniswap");
    process.exit(1);
  }
  const debug = process.argv.includes("--debug");
  // RootData uses unique k= params per project; use search page as fallback
  const url = `https://www.rootdata.com/Projects/detail/${encodeURIComponent(slug)}`;
  console.log(`Fetching project detail from RootData: ${slug}\n`);

  const data = await browse(url);
  const md = data?.extracted_content ?? "";

  if (debug) { printMarkdown(data); console.log("\n--- Parsed ---\n"); }

  const detail = parseProjectDetail(md);
  console.log(JSON.stringify({ slug, ...detail }, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("project_detail.ts") || process.argv[1]?.endsWith("project_detail.js");
if (isDirectRun) main();
