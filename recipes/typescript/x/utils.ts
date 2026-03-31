/**
 * X (Twitter) API Helper
 * Uses Selanet Browse API with parse_only mode for X/Twitter data.
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../../.env") });

const SELA_API_KEY = process.env.SELA_API_KEY;
const SELA_BASE_URL = "https://api.selanet.ai/v1";

async function fetchX(url: string, count: number): Promise<any> {
  if (!SELA_API_KEY) {
    throw new Error("SELA_API_KEY environment variable is required.");
  }
  const resp = await fetch(`${SELA_BASE_URL}/browse`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SELA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url, count, parse_only: true }),
  });
  if (!resp.ok) throw new Error(`Selanet API error: ${resp.status}`);
  return resp.json();
}

/**
 * Browse X with automatic retry on login_required or empty content.
 * Retries once after a short delay.
 */
export async function browseX(
  url: string,
  count: number = 10
): Promise<any> {
  const data = await fetchX(url, count);

  const needsRetry =
    data?.page_type === "login_required" ||
    data?.action_result?.status === "failed" ||
    (Array.isArray(data?.content) && data.content.length === 0);

  if (needsRetry) {
    await new Promise((r) => setTimeout(r, 2000));
    return fetchX(url, count);
  }

  return data;
}

export interface Tweet {
  author_name: string;
  author_username: string;
  author_profile_image: string;
  text: string;
  created_at: string;
  link: string;
  like_count: number;
  reply_count: number;
  retweet_count: number;
  impression_count: number;
  verified: boolean;
  social_context: string;
}

export function mapTweet(f: any): Tweet {
  return {
    author_name: f.author_name || "",
    author_username: f.author_username || "",
    author_profile_image: f.author_profile_image_url || "",
    text: f.text || "",
    created_at: f.created_at || "",
    link: f.link ? `https://x.com${f.link}` : "",
    like_count: f.like_count || 0,
    reply_count: f.reply_count || 0,
    retweet_count: f.retweet_count || 0,
    impression_count: f.impression_count || 0,
    verified: f.verified || false,
    social_context: f.social_context || "",
  };
}

export function parseTweets(data: any): Tweet[] {
  const content = data?.content;
  if (!Array.isArray(content)) return [];

  return content
    .filter((item: any) => item.content_type === "tweet" && item.fields)
    .map((item: any) => mapTweet(item.fields));
}
