/**
 * Shared utilities for Flare Explorer recipes
 * Flare uses a Blockscout-based explorer.
 */

export const BROWSE_OPTS = { check_idle: true, delay_ms: 5000 };

export const BASE_URL = "https://flare-explorer.flare.network";

export function buildUrl(page: string): string {
  return `${BASE_URL}/${page}`;
}

/**
 * Extract a field value from markdown lines by label matching.
 */
export function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label) || lines[i].trim() === label) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("*") && !val.startsWith("#") && !val.startsWith("---") && !val.startsWith("[![")) {
          // Strip link markdown to get just the text/number
          return val.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/!\[[^\]]*\]\([^)]*\)/g, "").trim();
        }
      }
    }
  }
  return "";
}
