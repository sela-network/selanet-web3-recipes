# Selanet Web3 Recipes

A collection of example code for scraping data from major Web3 sites using the Selanet Browse API.

## Supported Platforms

### CoinGecko
| Recipe | Description |
|--------|-------------|
| `token_prices.ts` | Top tokens by market cap, price changes |
| `categories_market_cap.ts` | Category-level market caps (DeFi, Layer 1, Meme, etc.) |
| `chains_ranking.ts` | Blockchain network rankings by market cap and TVL |
| `charts_global.ts` | Global crypto market charts |
| `crypto_gainers_losers.ts` | Biggest gainers and losers |
| `exchanges_cex.ts` | Centralized exchange trust scores and volume |
| `exchanges_dex.ts` | Decentralized exchange rankings |
| `exchanges_derivatives.ts` | Derivatives exchange rankings |
| `highlights_trending.ts` | Trending tokens, most searched coins |
| `new_cryptocurrencies.ts` | Recently added cryptocurrencies |
| `nft_floor_price.ts` | NFT collection floor prices |
| `treasuries_holdings.ts` | Treasury holdings data |

### Etherscan
| Recipe | Description |
|--------|-------------|
| `top_accounts.ts` | Top Ethereum accounts by ETH balance |
| `tokens.ts` | Top ERC-20 tokens by market cap |
| `blocks.ts` | Recent Ethereum blocks with gas and rewards |
| `transactions.ts` | Recent Ethereum transactions |
| `tx_detail.ts` | Detailed info for a specific transaction |
| `block_detail.ts` | Detailed info for a specific block |

### RootData
| Recipe | Description |
|--------|-------------|
| `exchanges_ranking.ts` | Exchange transparency scores and rankings |
| `fundraising.ts` | Recent crypto fundraising rounds |
| `investors.ts` | Crypto investor/VC rankings |
| `people.ts` | Crypto industry leaders directory |
| `projects.ts` | Project listings with tags and indices |
| `rankings_soaring.ts` | Trending/soaring project rankings |
| `token_unlocks.ts` | Upcoming token unlock schedules |

## Quick Start

### TypeScript

```bash
# 1. Set up API Key
cp .env.example .env
# Enter your SELA_API_KEY in the .env file

# 2. Install dependencies
cd recipes/typescript
npm install

# 3. Run a recipe
export SELA_API_KEY=sk_live_your_key
npx tsx coingecko/token_prices.ts
```

### Python

The Python SDK uses the Node bridge to run all CoinGecko recipes:

```bash
cd recipes/python
export SELA_API_KEY=sk_live_your_key

# Run all recipes
python example_bridge.py

# Run specific recipes
python example_bridge.py token_prices
python example_bridge.py categories_market_cap chains_ranking
```

## Project Structure

```
selanet-web3-recipes/
└── recipes/
    ├── python/
    │   ├── selanet.py           # Node bridge SDK
    │   └── example_bridge.py    # Usage example
    └── typescript/
        ├── coingecko/     # CoinGecko recipes
        ├── etherscan/     # Etherscan recipes
        ├── rootdata/      # RootData recipes
        └── utils.ts       # Shared Selanet API helpers
```

## Selanet API

```bash
curl -X POST https://api.selanet.ai/v1/browse \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_live_YOUR_KEY" \
  -d '{"url":"https://www.coingecko.com","extract_format":"markdown"}'
```

- **Docs**: https://www.selanet.ai/resources/docs
