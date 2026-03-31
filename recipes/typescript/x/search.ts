/**
 * Recipe: Search from X (Twitter)
 * Scrapes posts matching a search query with advanced search options.
 *
 * URL: https://x.com/search?q={query}&src=typed_query&f=live
 *
 * Advanced search operators (combine in query string):
 *   from:username     - Posts from a specific user
 *   to:username       - Replies to a specific user
 *   @username         - Mentioning a user
 *   "exact phrase"    - Exact phrase match
 *   word1 OR word2    - Either word
 *   word1 -word2      - Exclude word
 *   #hashtag          - Hashtag search
 *   $TICKER           - Cashtag search (e.g., $ETH, $BTC)
 *   min_replies:N     - Minimum replies
 *   min_faves:N       - Minimum likes
 *   min_retweets:N    - Minimum retweets
 *   since:YYYY-MM-DD  - Posts after date
 *   until:YYYY-MM-DD  - Posts before date
 *   lang:en           - Language filter
 *   filter:links      - Only posts with links
 *   filter:images     - Only posts with images
 *   filter:videos     - Only posts with videos
 *   filter:media      - Only posts with any media
 *   -filter:replies   - Exclude replies
 *
 * Examples:
 *   npx tsx x/search.ts "ethereum"
 *   npx tsx x/search.ts "from:VitalikButerin ethereum"
 *   npx tsx x/search.ts "$ETH min_faves:100 since:2026-03-01"
 *   npx tsx x/search.ts "#DeFi -filter:replies lang:en" 20
 *
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx x/search.ts "query" [count]
 */

import "dotenv/config";
import { browseX, parseTweets, type Tweet } from "./utils.js";

export { parseTweets };

async function main() {
  const query = process.argv[2] || "ethereum";
  const count = parseInt(process.argv[3] || "10", 10);
  const url = `https://x.com/search?q=${encodeURIComponent(query)}&src=typed_query&f=live`;

  console.log(`Searching X for "${query}"...\n`);
  const data = await browseX(url, count);

  if (data?.page_type === "login_required") {
    console.error("Login required. Search needs an authenticated session.");
    console.error("Profile pages (x.com/{username}) work without login.");
    return;
  }

  const posts = parseTweets(data);
  console.log(JSON.stringify(posts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("search.ts") || process.argv[1]?.endsWith("search.js");
if (isDirectRun) main();
