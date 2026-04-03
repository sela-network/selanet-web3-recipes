/**
 * Shared utilities for Uniswap recipes
 */

export const BROWSE_OPTS = { check_idle: true, delay_ms: 5000 };

export const CHAINS: Record<string, string> = {
  ethereum: "ethereum",
  polygon: "polygon",
  arbitrum: "arbitrum",
  optimism: "optimism",
  base: "base",
  bnb: "bnb",
  celo: "celo",
  avalanche: "avalanche_c_chain",
};

export function resolveChain(arg?: string): { name: string; slug: string } {
  const name = arg?.toLowerCase() ?? "ethereum";
  return { name, slug: CHAINS[name] ?? name };
}

export function buildUrl(tab: string, chainSlug: string): string {
  return `https://app.uniswap.org/explore/${tab}/${chainSlug}?lng=en`;
}

// ---------- Stats ----------

export interface Stats {
  volume_1d: string;
  volume_1d_change: string;
  tvl_total: string;
  tvl_total_change: string;
  tvl_v2: string;
  tvl_v2_change: string;
  tvl_v3: string;
  tvl_v3_change: string;
  tvl_v4: string;
  tvl_v4_change: string;
}

export function parseStats(markdown: string): Stats {
  const statsStart = markdown.search(/\nConnect\n|\n연결\n|\nConnecter\n|\nПодключить\n/i);
  const statsEnd = markdown.indexOf("\n###");
  if (statsStart < 0 || statsEnd < 0) return emptyStats();

  const statsBlock = markdown.slice(statsStart, statsEnd);
  const lines = statsBlock.split("\n").map((l) => l.trim()).filter(Boolean);

  const pairs: [string, string][] = [];
  for (let i = 0; i < lines.length; i++) {
    const changeLine = lines[i + 1] || "";
    const changeMatch = changeLine.match(/([\d,.]+\s*%)/);
    if (changeMatch) {
      const raw = lines[i];
      const valMatch = raw.match(/((?:US)?\$[\d,.\s]+[^\d,.\s]*|[\d,.\s]+[^\d,.\s]*\s*\$(?:US)?)$/);
      const value = valMatch ? valMatch[1].trim() : raw;
      pairs.push([value, changeMatch[1]]);
      i++;
    }
  }

  return {
    volume_1d: pairs[0]?.[0] ?? "",
    volume_1d_change: pairs[0]?.[1] ?? "",
    tvl_total: pairs[1]?.[0] ?? "",
    tvl_total_change: pairs[1]?.[1] ?? "",
    tvl_v2: pairs[2]?.[0] ?? "",
    tvl_v2_change: pairs[2]?.[1] ?? "",
    tvl_v3: pairs[3]?.[0] ?? "",
    tvl_v3_change: pairs[3]?.[1] ?? "",
    tvl_v4: pairs[4]?.[0] ?? "",
    tvl_v4_change: pairs[4]?.[1] ?? "",
  };
}

function emptyStats(): Stats {
  return {
    volume_1d: "", volume_1d_change: "",
    tvl_total: "", tvl_total_change: "",
    tvl_v2: "", tvl_v2_change: "",
    tvl_v3: "", tvl_v3_change: "",
    tvl_v4: "", tvl_v4_change: "",
  };
}

// ---------- Generic link-block parser ----------

/**
 * Parse multiline link blocks: `[rank\n...content...](url)`
 * Returns content lines (excluding images and `[rank`) for each matched URL pattern.
 */
export function parseLinkBlocks(
  markdown: string,
  urlPattern: RegExp
): { rank: number; lines: string[]; url: string }[] {
  const results: { rank: number; lines: string[]; url: string }[] = [];

  // Collect all `[digit\n` openers
  const openers: { pos: number; rank: number }[] = [];
  const openRe = /\[(\d{1,3})\s*\n/g;
  let om;
  while ((om = openRe.exec(markdown)) !== null) {
    openers.push({ pos: om.index, rank: parseInt(om[1], 10) });
  }

  // Wrap urlPattern in `](...)` closing
  const src = urlPattern.source;
  const closingRe = new RegExp(`\\]\\((${src})\\)`, "g");
  let cm;

  while ((cm = closingRe.exec(markdown)) !== null) {
    const url = cm[1];
    const closePos = cm.index;

    let opener: { pos: number; rank: number } | undefined;
    for (let i = openers.length - 1; i >= 0; i--) {
      if (openers[i].pos < closePos) {
        opener = openers[i];
        break;
      }
    }
    if (!opener) continue;

    const content = markdown.slice(opener.pos, closePos);
    const lines = content
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("![") && !l.match(/^\[\d+$/));

    results.push({ rank: opener.rank, lines, url });
  }

  return results;
}
