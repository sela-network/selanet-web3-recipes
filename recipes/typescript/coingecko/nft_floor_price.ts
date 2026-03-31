/**
 * Recipe: NFT Floor Price from CoinGecko
 * Scrapes NFT collection floor prices and volume rankings.
 *
 * URL: https://www.coingecko.com/en/nft
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx coingecko/nft_floor_price.ts
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface NftFloorPrice {
  rank: number;
  name: string;
  slug: string;
  url: string;
  image: string;
  chain: string;
  floor_price_eth: number;
  floor_price_usd: number;
  change_24h: number;
  change_7d: number;
  change_30d: number;
  sparkline: string;
  market_cap_usd: number;
  volume_24h_eth: number;
  volume_24h_usd: number;
  sales_24h: string;
}

export function parseMarkdownTable(markdown: string): NftFloorPrice[] {
  const lines = markdown.split("\n");
  const results: NftFloorPrice[] = [];

  for (const line of lines) {
    if (!line.startsWith("|")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells: [empty, empty, rank, nft_img, nft_name_link, buy, floor_price, 24h, 7d, 30d, sparkline, market_cap, volume, sales, empty]

    const rank = parseInt(cells[2], 10);
    if (isNaN(rank)) continue;

    // NFT name & chain from link cell
    const nameCell = cells[4] || "";
    const nameMatch = nameCell.match(
      /\[([^\]]+?)\s+!\[\]\([^)]+\)\s+([^\]]+)\]\((https:\/\/www\.coingecko\.com\/en\/nft\/([^)]+))\)/
    );
    const name = nameMatch ? nameMatch[1].trim() : "";
    const chain = nameMatch ? nameMatch[2].trim() : "";
    const url = nameMatch ? nameMatch[3] : "";
    const slug = nameMatch ? nameMatch[4] : "";

    // Image from img cell
    const imgCell = cells[3] || "";
    const imgMatch = imgCell.match(/!\[[^\]]*\]\(([^)]+)\)/);
    const image = imgMatch ? imgMatch[1] : "";

    // Floor price: "28.98 ETH  $58,752"
    const floorCell = cells[6] || "";
    const ethMatch = floorCell.match(/([\d,.]+)\s*ETH/);
    const usdMatch = floorCell.match(/\$([\d,.]+)/);
    const floorEth = ethMatch ? parseFloat(ethMatch[1].replace(/,/g, "")) : 0;
    const floorUsd = usdMatch ? parseFloat(usdMatch[1].replace(/,/g, "")) : 0;

    const parsePercent = (s: string): number => {
      const n = parseFloat(s?.replace(/%/g, "").trim());
      return isNaN(n) ? 0 : n;
    };

    // Sparkline
    const sparkCell = cells[10] || "";
    const sparkMatch = sparkCell.match(/\(https:\/\/www\.coingecko\.com\/nft\/[^)]+\/sparkline\.svg[^)]*\)/);
    const sparkline = sparkMatch ? sparkMatch[0].slice(1, -1) : "";

    // Market cap: "$587,167,508  289,626 ETH"
    const mcapCell = cells[11] || "";
    const mcapUsdMatch = mcapCell.match(/\$([\d,.]+)/);
    const mcapUsd = mcapUsdMatch ? parseFloat(mcapUsdMatch[1].replace(/,/g, "")) : 0;

    // Volume: "91.50 ETH  $185,501"
    const volCell = cells[12] || "";
    const volEthMatch = volCell.match(/([\d,.]+)\s*ETH/);
    const volUsdMatch = volCell.match(/\$([\d,.]+)/);
    const volEth = volEthMatch ? parseFloat(volEthMatch[1].replace(/,/g, "")) : 0;
    const volUsd = volUsdMatch ? parseFloat(volUsdMatch[1].replace(/,/g, "")) : 0;

    const sales = cells[13]?.trim() || "";

    results.push({
      rank,
      name,
      slug,
      url,
      image,
      chain,
      floor_price_eth: floorEth,
      floor_price_usd: floorUsd,
      change_24h: parsePercent(cells[7]),
      change_7d: parsePercent(cells[8]),
      change_30d: parsePercent(cells[9]),
      sparkline,
      market_cap_usd: mcapUsd,
      volume_24h_eth: volEth,
      volume_24h_usd: volUsd,
      sales_24h: sales,
    });
  }

  return results;
}

async function main() {
  console.log("Fetching NFT floor prices from CoinGecko...\n");
  const data = await browse("https://www.coingecko.com/en/nft");
  const markdown = data?.extracted_content ?? "";
  const nfts = parseMarkdownTable(markdown);
  console.log(JSON.stringify(nfts, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("nft_floor_price.ts") || process.argv[1]?.endsWith("nft_floor_price.js");
if (isDirectRun) main();
