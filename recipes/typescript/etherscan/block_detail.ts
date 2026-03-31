/**
 * Recipe: Block Detail from Etherscan
 * Scrapes detailed information for a specific Ethereum block.
 *
 * URL: https://etherscan.io/block/{number}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/block_detail.ts 24777393
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface BlockDetail {
  block_height: string;
  status: string;
  timestamp: string;
  proposed_on: string;
  transactions: string;
  withdrawals: string;
  fee_recipient: string;
  fee_recipient_url: string;
  block_reward: string;
  total_difficulty: string;
  size: string;
  gas_used: string;
  gas_limit: string;
  base_fee_per_gas: string;
  burnt_fees: string;
  extra_data: string;
  hash: string;
  parent_hash: string;
  state_root: string;
  nonce: string;
  slot: string;
  epoch: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && val !== "|" && !val.startsWith("*") && !val.startsWith("Local") && !val.startsWith("[](")) return val;
      }
    }
  }
  return "";
}

function extractLink(lines: string[], label: string): { text: string; url: string } {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const m = lines[j].match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
        if (m) return { text: m[1], url: m[2] };
      }
    }
  }
  return { text: "", url: "" };
}

export function parseBlockDetail(markdown: string): BlockDetail {
  const lines = markdown.split("\n");

  const feeRecipient = extractLink(lines, "Fee Recipient:");

  return {
    block_height: extractField(lines, "Block Height:"),
    status: extractField(lines, "Status:"),
    timestamp: extractField(lines, "Timestamp:"),
    proposed_on: extractField(lines, "Proposed On:"),
    transactions: extractField(lines, "Transactions:"),
    withdrawals: extractField(lines, "Withdrawals:"),
    fee_recipient: feeRecipient.text,
    fee_recipient_url: feeRecipient.url,
    block_reward: extractField(lines, "Block Reward:"),
    total_difficulty: extractField(lines, "Total Difficulty:"),
    size: extractField(lines, "Size:"),
    gas_used: extractField(lines, "Gas Used:"),
    gas_limit: extractField(lines, "Gas Limit:"),
    base_fee_per_gas: extractField(lines, "Base Fee Per Gas:"),
    burnt_fees: extractField(lines, "Burnt Fees:"),
    extra_data: extractField(lines, "Extra Data:"),
    hash: extractField(lines, "Hash:"),
    parent_hash: extractLink(lines, "Parent Hash:").text || extractField(lines, "Parent Hash:"),
    state_root: extractField(lines, "StateRoot:"),
    nonce: extractField(lines, "Nonce:"),
    slot: extractLink(lines, "Slot:").text || extractField(lines, "Slot:"),
    epoch: extractLink(lines, "Epoch:").text || extractField(lines, "Epoch:"),
  };
}

async function main() {
  const blockNum = process.argv[2] || "24777393";
  const url = blockNum.startsWith("http")
    ? blockNum
    : `https://etherscan.io/block/${blockNum}`;

  console.log(`Fetching block detail from Etherscan: ${blockNum}\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseBlockDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("block_detail.ts") || process.argv[1]?.endsWith("block_detail.js");
if (isDirectRun) main();
