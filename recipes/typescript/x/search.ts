/**
 * Recipe: Search from X (Twitter)
 * Scrapes posts matching a search query with optional advanced filters.
 *
 * URL: https://x.com/search?q={query}&src=typed_query&f=live
 *
 * CLI Usage:
 *   npx tsx x/search.ts "ethereum"
 *   npx tsx x/search.ts "ethereum" --from=VitalikButerin --min_faves=100
 *   npx tsx x/search.ts "DeFi" --from=elonmusk --to=elonmusk --since=2026-03-25 --until=2026-03-26
 *   npx tsx x/search.ts "$ETH" --count=20 --lang=en --filter=media
 *
 * Options:
 *   --count=N            Number of posts to fetch (default: 10)
 *   --from=username      Posts from a specific user
 *   --to=username        Replies to a specific user
 *   --mention=username   Posts mentioning a user (@username)
 *   --min_faves=N        Minimum likes
 *   --min_replies=N      Minimum replies
 *   --min_retweets=N     Minimum retweets
 *   --since=YYYY-MM-DD   Posts after date
 *   --until=YYYY-MM-DD   Posts before date
 *   --lang=code          Language filter (en, ja, ko, etc.)
 *   --filter=type        links | images | videos | media
 *   --exclude=type       replies | links
 */

import "dotenv/config";
import { browseX, parseTweets, type Tweet } from "./utils.js";

export { parseTweets };

export interface SearchOptions {
  query: string;
  count?: number;
  from?: string;
  to?: string;
  mention?: string;
  min_faves?: number;
  min_replies?: number;
  min_retweets?: number;
  since?: string;
  until?: string;
  lang?: string;
  filter?: string;
  exclude?: string;
}

export function buildSearchQuery(opts: SearchOptions): string {
  const parts: string[] = [opts.query];

  if (opts.from) parts.push(`from:${opts.from}`);
  if (opts.to) parts.push(`to:${opts.to}`);
  if (opts.mention) parts.push(`@${opts.mention}`);
  if (opts.min_faves) parts.push(`min_faves:${opts.min_faves}`);
  if (opts.min_replies) parts.push(`min_replies:${opts.min_replies}`);
  if (opts.min_retweets) parts.push(`min_retweets:${opts.min_retweets}`);
  if (opts.since) parts.push(`since:${opts.since}`);
  if (opts.until) parts.push(`until:${opts.until}`);
  if (opts.lang) parts.push(`lang:${opts.lang}`);
  if (opts.filter) parts.push(`filter:${opts.filter}`);
  if (opts.exclude) parts.push(`-filter:${opts.exclude}`);

  return parts.join(" ");
}

export function buildSearchUrl(opts: SearchOptions): string {
  const q = buildSearchQuery(opts);
  return `https://x.com/search?q=${encodeURIComponent(q)}&src=typed_query&f=live`;
}

function parseCliArgs(): SearchOptions {
  const args = process.argv.slice(2);
  let query = "";
  const opts: Partial<SearchOptions> = {};

  for (const arg of args) {
    if (arg.startsWith("--")) {
      const [key, val] = arg.slice(2).split("=");
      if (key === "count") opts.count = parseInt(val, 10);
      else if (key === "from") opts.from = val;
      else if (key === "to") opts.to = val;
      else if (key === "mention") opts.mention = val;
      else if (key === "min_faves") opts.min_faves = parseInt(val, 10);
      else if (key === "min_replies") opts.min_replies = parseInt(val, 10);
      else if (key === "min_retweets") opts.min_retweets = parseInt(val, 10);
      else if (key === "since") opts.since = val;
      else if (key === "until") opts.until = val;
      else if (key === "lang") opts.lang = val;
      else if (key === "filter") opts.filter = val;
      else if (key === "exclude") opts.exclude = val;
    } else if (!query) {
      query = arg;
    }
  }

  return { query: query || "ethereum", count: opts.count || 10, ...opts };
}

async function main() {
  const opts = parseCliArgs();
  const url = buildSearchUrl(opts);
  const fullQuery = buildSearchQuery(opts);

  console.log(`Searching X for "${fullQuery}"...\n`);
  const data = await browseX(url, opts.count || 10);
  const posts = parseTweets(data);

  if (posts.length === 0 && data?.page_type === "login_required") {
    console.error("Login required for this search. Try x/profile.ts for public profiles.");
  }

  console.log(JSON.stringify(posts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("search.ts") || process.argv[1]?.endsWith("search.js");
if (isDirectRun) main();
