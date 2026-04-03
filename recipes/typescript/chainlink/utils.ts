/**
 * Shared utilities for Chainlink recipes
 */

export const BROWSE_OPTS = { check_idle: true, delay_ms: 5000 };

export const BASE_URL = "https://data.chain.link";

export const NETWORKS: Record<string, string> = {
  ethereum: "ethereum-mainnet",
  arbitrum: "arbitrum-mainnet",
  avalanche: "avalanche-mainnet",
  base: "base-mainnet",
  bnb: "bsc-mainnet",
  optimism: "optimism-mainnet",
  polygon: "polygon-mainnet",
  gnosis: "gnosis-mainnet",
  scroll: "scroll-mainnet",
  linea: "linea-mainnet",
  zksync: "zksync-mainnet",
  metis: "metis-mainnet",
  celo: "celo-mainnet",
  hedera: "hedera-mainnet",
  sonic: "sonic-mainnet",
};

export const CATEGORIES = [
  "crypto",
  "fiat",
  "commodity",
  "equity",
  "etf",
  "index",
  "stablecoin",
  "proof-of-reserve",
  "tokenized-asset",
] as const;

export type Category = (typeof CATEGORIES)[number];

export function resolveNetwork(arg?: string): { name: string; slug: string } {
  const name = arg?.toLowerCase() ?? "ethereum";
  return { name, slug: NETWORKS[name] ?? name };
}

export function buildFeedsUrl(network?: string, category?: string): string {
  const params = new URLSearchParams();
  if (network) params.set("network", network);
  if (category) params.set("categories", category);
  const qs = params.toString();
  return `${BASE_URL}/feeds${qs ? `?${qs}` : ""}`;
}
