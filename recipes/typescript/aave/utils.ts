/**
 * Shared utilities for Aave recipes
 */

export const BROWSE_OPTS = { check_idle: true, delay_ms: 5000 };

export const BASE_URL = "https://app.aave.com";

export const NETWORKS: Record<string, string> = {
  ethereum: "proto_aave_v3",
  polygon: "proto_polygon_v3",
  avalanche: "proto_avalanche_v3",
  arbitrum: "proto_arbitrum_v3",
  optimism: "proto_optimism_v3",
  base: "proto_base_v3",
  metis: "proto_metis_v3",
  gnosis: "proto_gnosis_v3",
  bnb: "proto_bnb_v3",
  scroll: "proto_scroll_v3",
  zksync: "proto_zksync_v3",
};

export function resolveNetwork(arg?: string): { name: string; slug: string } {
  const name = arg?.toLowerCase() ?? "ethereum";
  return { name, slug: NETWORKS[name] ?? name };
}

export function buildMarketsUrl(networkSlug?: string): string {
  const params = new URLSearchParams();
  if (networkSlug) params.set("marketName", networkSlug);
  const qs = params.toString();
  return `${BASE_URL}/markets/${qs ? `?${qs}` : ""}`;
}
