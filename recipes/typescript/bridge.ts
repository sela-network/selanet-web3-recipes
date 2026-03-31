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
import { parseMarkdownTable as parseCategoriesMarketCap } from "./coingecko/categories_market_cap.js";
import { parseMarkdownTable as parseChainsRanking } from "./coingecko/chains_ranking.js";
import { parseGlobalCharts } from "./coingecko/charts_global.js";
import { parseMarkdown as parseCryptoGainersLosers } from "./coingecko/crypto_gainers_losers.js";
import { parseMarkdownTable as parseExchangesCex } from "./coingecko/exchanges_cex.js";
import { parseMarkdownTable as parseExchangesDerivatives } from "./coingecko/exchanges_derivatives.js";
import { parseMarkdownTable as parseExchangesDex } from "./coingecko/exchanges_dex.js";
import { parseHighlights } from "./coingecko/highlights_trending.js";
import { parseMarkdownTable as parseNewCryptocurrencies } from "./coingecko/new_cryptocurrencies.js";
import { parseMarkdownTable as parseNftFloorPrice } from "./coingecko/nft_floor_price.js";
import { parseMarkdownTable as parseTreasuriesHoldings } from "./coingecko/treasuries_holdings.js";

import { parseMarkdownTable as parseRdExchangesRanking } from "./rootdata/exchanges_ranking.js";
import { parseMarkdownTable as parseRdFundraising } from "./rootdata/fundraising.js";
import { parseMarkdownTable as parseRdInvestors } from "./rootdata/investors.js";
import { parseMarkdownTable as parseRdPeople } from "./rootdata/people.js";
import { parseMarkdownTable as parseRdProjects } from "./rootdata/projects.js";
import { parseMarkdownTable as parseRdRankingsSoaring } from "./rootdata/rankings_soaring.js";
import { parseMarkdownTable as parseRdTokenUnlocks } from "./rootdata/token_unlocks.js";

interface Recipe {
  url: string;
  parse: (markdown: string) => unknown;
}

const recipes: Record<string, Recipe> = {
  "coingecko/token_prices": {
    url: "https://www.coingecko.com",
    parse: parseTokenPrices,
  },
  "coingecko/categories_market_cap": {
    url: "https://www.coingecko.com/en/categories",
    parse: parseCategoriesMarketCap,
  },
  "coingecko/chains_ranking": {
    url: "https://www.coingecko.com/en/chains",
    parse: parseChainsRanking,
  },
  "coingecko/charts_global": {
    url: "https://www.coingecko.com/en/charts",
    parse: parseGlobalCharts,
  },
  "coingecko/crypto_gainers_losers": {
    url: "https://www.coingecko.com/en/crypto-gainers-losers",
    parse: parseCryptoGainersLosers,
  },
  "coingecko/exchanges_cex": {
    url: "https://www.coingecko.com/en/exchanges",
    parse: parseExchangesCex,
  },
  "coingecko/exchanges_derivatives": {
    url: "https://www.coingecko.com/en/exchanges/derivatives",
    parse: parseExchangesDerivatives,
  },
  "coingecko/exchanges_dex": {
    url: "https://www.coingecko.com/en/exchanges/decentralized",
    parse: parseExchangesDex,
  },
  "coingecko/highlights_trending": {
    url: "https://www.coingecko.com/en/highlights",
    parse: parseHighlights,
  },
  "coingecko/new_cryptocurrencies": {
    url: "https://www.coingecko.com/en/new-cryptocurrencies",
    parse: parseNewCryptocurrencies,
  },
  "coingecko/nft_floor_price": {
    url: "https://www.coingecko.com/en/nft",
    parse: parseNftFloorPrice,
  },
  "coingecko/treasuries_holdings": {
    url: "https://www.coingecko.com/en/treasuries",
    parse: parseTreasuriesHoldings,
  },
  "rootdata/exchanges_ranking": {
    url: "https://www.rootdata.com/exchanges/ranking",
    parse: parseRdExchangesRanking,
  },
  "rootdata/fundraising": {
    url: "https://www.rootdata.com/Fundraising",
    parse: parseRdFundraising,
  },
  "rootdata/investors": {
    url: "https://www.rootdata.com/Investors",
    parse: parseRdInvestors,
  },
  "rootdata/people": {
    url: "https://www.rootdata.com/people",
    parse: parseRdPeople,
  },
  "rootdata/projects": {
    url: "https://www.rootdata.com/Projects",
    parse: parseRdProjects,
  },
  "rootdata/rankings_soaring": {
    url: "https://www.rootdata.com/rankings/soaring",
    parse: parseRdRankingsSoaring,
  },
  "rootdata/token_unlocks": {
    url: "https://www.rootdata.com/token-unlocks",
    parse: parseRdTokenUnlocks,
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
