/**
 * Shared utilities for DefiLlama recipes
 */

export const BROWSE_OPTS = { check_idle: true, delay_ms: 5000 };

export const BASE_URL = "https://defillama.com";

export const CHAINS = [
  "Ethereum", "Solana", "BSC", "Arbitrum", "Polygon", "Avalanche",
  "Optimism", "Base", "Fantom", "Gnosis", "Celo", "Moonbeam",
  "Sui", "Aptos", "Sei", "Scroll", "zkSync Era", "Linea",
  "Mantle", "Blast", "Mode", "Manta", "Starknet",
] as const;

export type Chain = (typeof CHAINS)[number];

export function buildYieldsUrl(opts?: { chain?: string; project?: string; token?: string }): string {
  const params = new URLSearchParams();
  if (opts?.chain) params.set("chain", opts.chain);
  if (opts?.project) params.set("project", opts.project);
  if (opts?.token) params.set("token", opts.token);
  const qs = params.toString();
  return `${BASE_URL}/yields${qs ? `?${qs}` : ""}`;
}

export function buildProtocolsUrl(chain?: string): string {
  return chain ? `${BASE_URL}/chain/${chain}` : `${BASE_URL}/`;
}

export function buildStablecoinsUrl(): string {
  return `${BASE_URL}/stablecoins`;
}
