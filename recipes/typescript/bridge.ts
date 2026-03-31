/**
 * Node Bridge for Python IPC
 *
 * Stays alive as a long-running process.
 * Receives JSON requests via stdin, responds via stdout.
 *
 * Protocol (JSON Lines, one object per line):
 *   Request:  {"recipe": "coingecko/token_prices"}
 *   Response: {"ok": true, "result": [...]}
 *   Error:    {"ok": false, "error": "message"}
 */

import "dotenv/config";
import { createInterface } from "readline";
import { browse } from "./utils.js";

// Registry: recipe id → { url, parse function }
// Add new recipes here as they get export-enabled.
import { parseMarkdownTable as parseTokenPrices } from "./coingecko/token_prices.js";

interface Recipe {
  url: string;
  parse: (markdown: string) => unknown;
}

const recipes: Record<string, Recipe> = {
  "coingecko/token_prices": {
    url: "https://www.coingecko.com",
    parse: parseTokenPrices,
  },
};

// -- IPC loop --

const rl = createInterface({ input: process.stdin });

function respond(obj: unknown) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

rl.on("line", async (line) => {
  let req: { recipe?: string };
  try {
    req = JSON.parse(line);
  } catch {
    respond({ ok: false, error: "Invalid JSON" });
    return;
  }

  const id = req.recipe;
  if (!id || !recipes[id]) {
    respond({
      ok: false,
      error: `Unknown recipe: ${id}. Available: ${Object.keys(recipes).join(", ")}`,
    });
    return;
  }

  try {
    const recipe = recipes[id];
    const data = await browse(recipe.url);
    const markdown = data?.extracted_content ?? "";
    const result = recipe.parse(markdown);
    respond({ ok: true, result });
  } catch (err: any) {
    respond({ ok: false, error: err.message ?? String(err) });
  }
});

// Signal ready
respond({ ok: true, ready: true });
