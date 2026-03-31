"""
Example: Using the Node bridge to get parsed CoinGecko data.

Usage:
    python example_bridge.py                          # run all recipes
    python example_bridge.py token_prices             # run one recipe
    python example_bridge.py categories_market_cap chains_ranking  # run selected
"""

import sys
from selanet import Selanet


def show_token_prices(sela: Selanet):
    print("\n=== Token Prices ===")
    tokens = sela.run("coingecko/token_prices")
    for t in tokens[:10]:
        print(f"  #{t['rank']} {t['name']} ({t['symbol']}): ${t['price']:,.2f}  24h: {t['change_24h']}%")


def show_categories_market_cap(sela: Selanet):
    print("\n=== Categories Market Cap ===")
    categories = sela.run("coingecko/categories_market_cap")
    for c in categories[:10]:
        print(f"  #{c['rank']} {c['category']}: mcap ${c['market_cap']:,.0f}  24h: {c['change_24h']}%")


def show_chains_ranking(sela: Selanet):
    print("\n=== Chains Ranking ===")
    chains = sela.run("coingecko/chains_ranking")
    for c in chains[:10]:
        print(f"  #{c['rank']} {c['chain']}: TVL ${c['tvl']:,.0f}  dominance: {c['dominance']}%")


def show_charts_global(sela: Selanet):
    print("\n=== Global Charts ===")
    g = sela.run("coingecko/charts_global")
    print(f"  Market Cap: {g['market_cap']}  24h: {g['market_cap_change_24h']}%")
    print(f"  BTC Dominance: {g['btc_dominance']}%  Stablecoin Share: {g['stablecoin_share']}%")
    print(f"  Coins: {g['total_coins_tracked']}  Exchanges: {g['total_exchanges_tracked']}")


def show_crypto_gainers_losers(sela: Selanet):
    print("\n=== Crypto Gainers & Losers ===")
    data = sela.run("coingecko/crypto_gainers_losers")
    print("  Top Gainers:")
    for t in data["top_gainers"][:5]:
        print(f"    #{t['rank']} {t['name']} ({t['symbol']}): ${t['price']:,.4f}  24h: {t['change_24h']}%")
    print("  Top Losers:")
    for t in data["top_losers"][:5]:
        print(f"    #{t['rank']} {t['name']} ({t['symbol']}): ${t['price']:,.4f}  24h: {t['change_24h']}%")


def show_exchanges_cex(sela: Selanet):
    print("\n=== CEX Exchanges ===")
    exchanges = sela.run("coingecko/exchanges_cex")
    for e in exchanges[:10]:
        print(f"  #{e['rank']} {e['name']}: vol ${e['volume_24h']:,.0f}  trust: {e['trust_score']}")


def show_exchanges_derivatives(sela: Selanet):
    print("\n=== Derivatives Exchanges ===")
    exchanges = sela.run("coingecko/exchanges_derivatives")
    for e in exchanges[:10]:
        print(f"  #{e['rank']} {e['name']}: OI ${e['open_interest_24h']:,.0f}  vol ${e['volume_24h']:,.0f}")


def show_exchanges_dex(sela: Selanet):
    print("\n=== DEX Exchanges ===")
    exchanges = sela.run("coingecko/exchanges_dex")
    for e in exchanges[:10]:
        print(f"  #{e['rank']} {e['name']}: vol ${e['volume_24h']:,.0f}  share: {e['market_share']}%")


def show_highlights_trending(sela: Selanet):
    print("\n=== Highlights & Trending ===")
    data = sela.run("coingecko/highlights_trending")
    print("  Trending Search:")
    for t in data["trending_search"][:5]:
        print(f"    {t['name']} ({t['symbol']}): {t['change']}%")
    print("  Trending Coins:")
    for t in data["trending_coins"][:5]:
        print(f"    {t['name']}: ${t['price']:,.2f}  24h: {t['change_24h']}%")


def show_new_cryptocurrencies(sela: Selanet):
    print("\n=== New Cryptocurrencies ===")
    coins = sela.run("coingecko/new_cryptocurrencies")
    for c in coins[:10]:
        print(f"  #{c['rank']} {c['name']} ({c['symbol']}): ${c['price']:,.6f}  chain: {c['chain']}  added: {c['last_added']}")


def show_nft_floor_price(sela: Selanet):
    print("\n=== NFT Floor Prices ===")
    nfts = sela.run("coingecko/nft_floor_price")
    for n in nfts[:10]:
        print(f"  #{n['rank']} {n['name']}: {n['floor_price_eth']} ETH (${n['floor_price_usd']:,.0f})  24h: {n['change_24h']}%")


def show_treasuries_holdings(sela: Selanet):
    print("\n=== Treasuries Holdings ===")
    treasuries = sela.run("coingecko/treasuries_holdings")
    for t in treasuries[:10]:
        print(f"  #{t['rank']} {t['entity']} ({t['type']}): value ${t['todays_value_usd']:,.0f}")


RECIPES = {
    "token_prices": show_token_prices,
    "categories_market_cap": show_categories_market_cap,
    "chains_ranking": show_chains_ranking,
    "charts_global": show_charts_global,
    "crypto_gainers_losers": show_crypto_gainers_losers,
    "exchanges_cex": show_exchanges_cex,
    "exchanges_derivatives": show_exchanges_derivatives,
    "exchanges_dex": show_exchanges_dex,
    "highlights_trending": show_highlights_trending,
    "new_cryptocurrencies": show_new_cryptocurrencies,
    "nft_floor_price": show_nft_floor_price,
    "treasuries_holdings": show_treasuries_holdings,
}

if __name__ == "__main__":
    selected = sys.argv[1:] if len(sys.argv) > 1 else list(RECIPES.keys())

    invalid = [s for s in selected if s not in RECIPES]
    if invalid:
        print(f"Unknown recipes: {', '.join(invalid)}")
        print(f"Available: {', '.join(RECIPES.keys())}")
        sys.exit(1)

    with Selanet() as sela:
        for name in selected:
            try:
                RECIPES[name](sela)
            except Exception as e:
                print(f"\n  [ERROR] {name}: {e}")
