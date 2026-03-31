/**
 * Recipe: Profile from X (Twitter)
 * Scrapes recent posts from a user's profile.
 *
 * URL: https://x.com/{username}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx x/profile.ts VitalikButerin
 *   npx tsx x/profile.ts ethereum 20
 */

import "dotenv/config";
import { browseX, parseTweets, type Tweet } from "./utils.js";

export { parseTweets };

async function main() {
  const username = process.argv[2] || "VitalikButerin";
  const count = parseInt(process.argv[3] || "10", 10);
  const url = `https://x.com/${username}`;

  console.log(`Fetching posts from @${username}...\n`);
  const data = await browseX(url, count);
  const posts = parseTweets(data);
  console.log(JSON.stringify(posts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("profile.ts") || process.argv[1]?.endsWith("profile.js");
if (isDirectRun) main();
