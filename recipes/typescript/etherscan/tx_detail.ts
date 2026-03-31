/**
 * Recipe: Transaction Detail from Etherscan
 * Scrapes detailed information for a specific Ethereum transaction.
 *
 * URL: https://etherscan.io/tx/{hash}
 * Usage:
 *   export SELA_API_KEY=sk_live_xxx
 *   npx tsx etherscan/tx_detail.ts 0xab04bf5750485049f94f93057dd4adc8f3c901cb0218a78b901739be04a76776
 */

import "dotenv/config";
import { browse } from "../utils.js";

interface TxDetail {
  tx_hash: string;
  status: string;
  block: string;
  block_url: string;
  timestamp: string;
  from: string;
  from_url: string;
  to: string;
  to_url: string;
  value: string;
  transaction_fee: string;
  gas_price: string;
  gas_limit_usage: string;
  gas_fees: string;
  burnt_savings: string;
  nonce: string;
  txn_type: string;
  input_data: string;
}

function extractField(lines: string[], label: string): string {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      // Value is on the next non-empty line
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const val = lines[j].trim();
        if (val && val !== "|" && !val.startsWith("*")) return val;
      }
    }
  }
  return "";
}

function extractLink(lines: string[], label: string): { text: string; url: string } {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith(label)) {
      for (let j = i + 1; j < Math.min(lines.length, i + 4); j++) {
        const m = lines[j].match(/\[([^\]]+)\]\((https:\/\/etherscan\.io\/[^)]+)\)/);
        if (m) return { text: m[1], url: m[2] };
      }
    }
  }
  return { text: "", url: "" };
}

export function parseTxDetail(markdown: string): TxDetail {
  const lines = markdown.split("\n");

  const txHashField = extractField(lines, "Transaction Hash:");
  const txHash = txHashField.replace(/\s*\[.*$/, "").trim();

  const status = extractField(lines, "Status:");
  const block = extractLink(lines, "Block:");
  const timestamp = extractField(lines, "Timestamp:");

  const from = extractLink(lines, "From:");
  const to = extractLink(lines, "Interacted With (To):");
  const toAlt = to.text ? to : extractLink(lines, "To:");

  const value = extractField(lines, "Value:");
  const txnFee = extractField(lines, "Transaction Fee:");
  const gasPrice = extractField(lines, "Gas Price:");
  const gasLimitUsage = extractField(lines, "Gas Limit & Usage by Txn:");
  const gasFees = extractField(lines, "Gas Fees:");
  const burntSavings = extractField(lines, "Burnt & Txn Savings Fees:");

  // Other attributes: Txn Type / Nonce / Position
  const otherAttr = extractField(lines, "Other Attributes:");
  const nonceMatch = otherAttr.match(/Nonce:\s*(\d+)/);
  const txnTypeMatch = otherAttr.match(/Txn Type:\s*(\d+\s*\([^)]+\))/);

  const inputData = extractField(lines, "Input Data:");

  return {
    tx_hash: txHash,
    status,
    block: block.text,
    block_url: block.url,
    timestamp,
    from: from.text,
    from_url: from.url,
    to: toAlt.text,
    to_url: toAlt.url,
    value,
    transaction_fee: txnFee,
    gas_price: gasPrice,
    gas_limit_usage: gasLimitUsage,
    gas_fees: gasFees,
    burnt_savings: burntSavings,
    nonce: nonceMatch ? nonceMatch[1] : "",
    txn_type: txnTypeMatch ? txnTypeMatch[1] : "",
    input_data: inputData.substring(0, 200),
  };
}

async function main() {
  const txHash =
    process.argv[2] ||
    "0xab04bf5750485049f94f93057dd4adc8f3c901cb0218a78b901739be04a76776";
  const url = txHash.startsWith("http")
    ? txHash
    : `https://etherscan.io/tx/${txHash}`;

  console.log(`Fetching tx detail from Etherscan: ${txHash.substring(0, 20)}...\n`);
  const data = await browse(url);
  const markdown = data?.extracted_content ?? "";
  const detail = parseTxDetail(markdown);
  console.log(JSON.stringify(detail, null, 2));
}

const isDirectRun = process.argv[1]?.endsWith("tx_detail.ts") || process.argv[1]?.endsWith("tx_detail.js");
if (isDirectRun) main();
