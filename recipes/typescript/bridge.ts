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

import { parseMarkdownTable as parseEthTopAccounts } from "./etherscan/top_accounts.js";
import { parseMarkdownTable as parseEthTokens } from "./etherscan/tokens.js";
import { parseMarkdownTable as parseEthBlocks } from "./etherscan/blocks.js";
import { parseMarkdownTable as parseEthTransactions } from "./etherscan/transactions.js";
import { parseTxDetail as parseEthTxDetail } from "./etherscan/tx_detail.js";
import { parseBlockDetail as parseEthBlockDetail } from "./etherscan/block_detail.js";

import { parseAddressDetail as parseEthAddressDetail } from "./etherscan/address_detail.js";
import { parseTokenDetail as parseEthTokenDetail } from "./etherscan/token_detail.js";

import { parseMarkdownTable as parseArcAccounts } from "./arcscan/accounts.js";
import { parseMarkdownTable as parseArcBlocks } from "./arcscan/blocks.js";
import { parseMarkdownTable as parseArcTransactions } from "./arcscan/transactions.js";
import { parseAccountDetail as parseArcAccountDetail } from "./arcscan/account_detail.js";
import { parseBlockDetail as parseArcBlockDetail } from "./arcscan/block_detail.js";
import { parseTxDetail as parseArcTxDetail } from "./arcscan/tx_detail.js";
import { parseTokenDetail as parseArcTokenDetail } from "./arcscan/token_detail.js";

import { parseMarkdownTable as parseWorldBlocks } from "./worldscan/blocks.js";
import { parseMarkdownTable as parseWorldTransactions } from "./worldscan/transactions.js";
import { parseAddressDetail as parseWorldAddressDetail } from "./worldscan/address_detail.js";
import { parseBlockDetail as parseWorldBlockDetail } from "./worldscan/block_detail.js";
import { parseTxDetail as parseWorldTxDetail } from "./worldscan/tx_detail.js";
import { parseTokenDetail as parseWorldTokenDetail } from "./worldscan/token_detail.js";

import { parseTweets as parseXTweets } from "./x/profile.js";
import { parsePost as parseXPost } from "./x/post.js";
import { browseX } from "./x/utils.js";

import { parseMarkdownTable as parseL2ScalingSummary } from "./l2beat/scaling_summary.js";
import { parseMarkdownTable as parseL2ScalingRisk } from "./l2beat/scaling_risk.js";

interface Recipe {
  url: string | ((params?: Record<string, string>) => string);
  parse: (data: any) => unknown;
  /** Use browseX (parse_only mode) instead of browse (markdown mode) */
  xMode?: boolean;
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
  "etherscan/top_accounts": {
    url: "https://etherscan.io/accounts",
    parse: parseEthTopAccounts,
  },
  "etherscan/tokens": {
    url: "https://etherscan.io/tokens",
    parse: parseEthTokens,
  },
  "etherscan/blocks": {
    url: "https://etherscan.io/blocks",
    parse: parseEthBlocks,
  },
  "etherscan/transactions": {
    url: "https://etherscan.io/txs",
    parse: parseEthTransactions,
  },
  "etherscan/tx_detail": {
    url: (params) => `https://etherscan.io/tx/${params?.hash ?? ""}`,
    parse: parseEthTxDetail,
  },
  "etherscan/block_detail": {
    url: (params) => `https://etherscan.io/block/${params?.block ?? ""}`,
    parse: parseEthBlockDetail,
  },
  "etherscan/address_detail": {
    url: (params) => `https://etherscan.io/address/${params?.address ?? ""}`,
    parse: parseEthAddressDetail,
  },
  "etherscan/token_detail": {
    url: (params) => `https://etherscan.io/token/${params?.token ?? ""}`,
    parse: parseEthTokenDetail,
  },
  "arcscan/accounts": {
    url: "https://testnet.arcscan.app/accounts",
    parse: parseArcAccounts,
  },
  "arcscan/blocks": {
    url: "https://testnet.arcscan.app/blocks",
    parse: parseArcBlocks,
  },
  "arcscan/transactions": {
    url: "https://testnet.arcscan.app/txs",
    parse: parseArcTransactions,
  },
  "arcscan/account_detail": {
    url: (params) => `https://testnet.arcscan.app/address/${params?.address ?? ""}`,
    parse: parseArcAccountDetail,
  },
  "arcscan/block_detail": {
    url: (params) => `https://testnet.arcscan.app/block/${params?.block ?? ""}`,
    parse: parseArcBlockDetail,
  },
  "arcscan/tx_detail": {
    url: (params) => `https://testnet.arcscan.app/tx/${params?.hash ?? ""}`,
    parse: parseArcTxDetail,
  },
  "arcscan/token_detail": {
    url: (params) => `https://testnet.arcscan.app/token/${params?.token ?? ""}`,
    parse: parseArcTokenDetail,
  },
  "worldscan/blocks": {
    url: "https://worldscan.org/blocks",
    parse: parseWorldBlocks,
  },
  "worldscan/transactions": {
    url: "https://worldscan.org/txs",
    parse: parseWorldTransactions,
  },
  "worldscan/address_detail": {
    url: (params) => `https://worldscan.org/address/${params?.address ?? ""}`,
    parse: parseWorldAddressDetail,
  },
  "worldscan/block_detail": {
    url: (params) => `https://worldscan.org/block/${params?.block ?? ""}`,
    parse: parseWorldBlockDetail,
  },
  "worldscan/tx_detail": {
    url: (params) => `https://worldscan.org/tx/${params?.hash ?? ""}`,
    parse: parseWorldTxDetail,
  },
  "worldscan/token_detail": {
    url: (params) => `https://worldscan.org/token/${params?.token ?? ""}`,
    parse: parseWorldTokenDetail,
  },
  "l2beat/scaling_summary": {
    url: "https://l2beat.com/scaling/summary",
    parse: parseL2ScalingSummary,
  },
  "l2beat/scaling_risk": {
    url: "https://l2beat.com/scaling/risk",
    parse: parseL2ScalingRisk,
  },
  "x/profile": {
    url: (params) => `https://x.com/${params?.username ?? "VitalikButerin"}`,
    parse: parseXTweets,
    xMode: true,
  },
  "x/search": {
    url: (params) => `https://x.com/search?q=${encodeURIComponent(params?.query ?? "ethereum")}&src=typed_query&f=live`,
    parse: parseXTweets,
    xMode: true,
  },
  "x/post": {
    url: (params) => params?.url ?? `https://x.com/${params?.username ?? ""}/${params?.id ? `status/${params.id}` : ""}`,
    parse: parseXPost,
    xMode: true,
  },
};

// -- IPC loop --

const rl = createInterface({ input: process.stdin });

function respond(obj: unknown) {
  process.stdout.write(JSON.stringify(obj) + "\n");
}

rl.on("line", async (line) => {
  let req: { recipe?: string; params?: Record<string, string> };
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
    const url = typeof recipe.url === "function" ? recipe.url(req.params) : recipe.url;
    let result: unknown;
    if (recipe.xMode) {
      const count = parseInt(req.params?.count ?? "10", 10);
      const data = await browseX(url, count);
      result = recipe.parse(data);
    } else {
      const data = await browse(url);
      const markdown = data?.extracted_content ?? "";
      result = recipe.parse(markdown);
    }
    respond({ ok: true, result });
  } catch (err: any) {
    respond({ ok: false, error: err.message ?? String(err) });
  }
});

// Signal ready
respond({ ok: true, ready: true });
