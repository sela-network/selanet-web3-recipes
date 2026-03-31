/**
 * Recipe: Post Detail from X (Twitter)
 * Scrapes a specific post and its replies.
 *
 * URL: https://x.com/{username}/status/{id}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx x/post.ts https://x.com/VitalikButerin/status/2036225236798959737
 *   npx tsx x/post.ts VitalikButerin/status/2036225236798959737
 */

import "dotenv/config";
import { browseX, mapTweet, type Tweet } from "./utils.js";

interface PostDetail {
  post: Tweet | null;
  replies: Tweet[];
}

export function parsePost(data: any): PostDetail {
  const content = data?.content;
  if (!Array.isArray(content)) return { post: null, replies: [] };

  let post: Tweet | null = null;
  const replies: Tweet[] = [];

  for (const item of content) {
    if (!item.fields) continue;

    if (item.content_type === "tweet" && item.role === "article" && !post) {
      post = mapTweet(item.fields);
    } else if (item.content_type === "reply" || item.role === "comment") {
      replies.push(mapTweet(item.fields));
    }
  }

  // Fallback: first tweet if no article-role found
  if (!post) {
    const first = content.find((i: any) => i.content_type === "tweet" && i.fields);
    if (first) post = mapTweet(first.fields);
  }

  return { post, replies };
}

async function main() {
  let input = process.argv[2] || "https://x.com/VitalikButerin/status/2036225236798959737";
  const count = parseInt(process.argv[3] || "20", 10);

  if (!input.startsWith("http")) {
    input = `https://x.com/${input}`;
  }

  console.log(`Fetching post from X: ${input}\n`);
  const data = await browseX(input, count);
  const result = parsePost(data);
  console.log(JSON.stringify(result, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("post.ts") || process.argv[1]?.endsWith("post.js");
if (isDirectRun) main();
