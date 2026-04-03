/**
 * Shared utilities for ENS recipes
 */

export const BROWSE_OPTS = { check_idle: true, delay_ms: 5000 };

export const BASE_URL = "https://app.ens.domains";

export function buildNameUrl(name: string): string {
  const ensName = name.endsWith(".eth") ? name : `${name}.eth`;
  return `${BASE_URL}/${ensName}`;
}

export function buildSearchUrl(query: string): string {
  return `${BASE_URL}/?search=${encodeURIComponent(query)}`;
}

/** Korean month names ordered longest-first to avoid partial matches (e.g. "12월" before "2월") */
const KO_MONTHS: [string, string][] = [
  ["12월", "Dec"], ["11월", "Nov"], ["10월", "Oct"],
  ["1월", "Jan"], ["2월", "Feb"], ["3월", "Mar"], ["4월", "Apr"],
  ["5월", "May"], ["6월", "Jun"], ["7월", "Jul"], ["8월", "Aug"], ["9월", "Sep"],
];

/**
 * Normalize a date string that may be in Korean locale (e.g. "12월 28, 2047")
 * to English format (e.g. "Dec 28, 2047").
 */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return dateStr;
  for (const [ko, en] of KO_MONTHS) {
    if (dateStr.includes(ko)) return dateStr.replace(ko, en);
  }
  return dateStr;
}

/**
 * Extract a field value from markdown lines by label matching.
 * Looks for a line containing the label, then returns the next non-empty line.
 */
export function extractField(lines: string[], label: string | RegExp): string {
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const match =
      typeof label === "string"
        ? line.toLowerCase().includes(label.toLowerCase())
        : label.test(line);
    if (match) {
      // Value might be on the same line after the label
      const sameLine =
        typeof label === "string"
          ? line.slice(line.toLowerCase().indexOf(label.toLowerCase()) + label.length).trim()
          : line.replace(label, "").trim();
      if (sameLine && sameLine.length > 1) return sameLine;

      // Otherwise check next lines
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && !val.startsWith("#") && !val.startsWith("---")) return val;
      }
    }
  }
  return "";
}

/**
 * Extract all text records from the ENS profile markdown.
 * Text records typically appear as key-value pairs in the profile.
 */
export function extractRecords(
  lines: string[]
): Record<string, string> {
  const records: Record<string, string> = {};
  const recordKeys = [
    "avatar",
    "description",
    "display",
    "email",
    "url",
    "com.twitter",
    "com.github",
    "com.discord",
    "org.telegram",
    "notice",
    "keywords",
    "location",
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim().toLowerCase();
    for (const key of recordKeys) {
      if (line === key || line.startsWith(key + ":") || line.startsWith(key + " ")) {
        const val = line.startsWith(key + ":")
          ? line.slice(key.length + 1).trim()
          : lines[i + 1]?.trim() || "";
        if (val) records[key] = val;
      }
    }
  }

  return records;
}
