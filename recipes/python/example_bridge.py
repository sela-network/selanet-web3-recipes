"""
Example: Using the Node bridge to get parsed Web3 data.

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


def show_rd_exchanges_ranking(sela: Selanet):
    print("\n=== RootData: Exchange Rankings ===")
    exchanges = sela.run("rootdata/exchanges_ranking")
    for e in exchanges[:10]:
        print(f"  #{e['rank']} {e['name']}: transparency {e['transparency_score']}  overall {e['overall_score']}")


def show_rd_fundraising(sela: Selanet):
    print("\n=== RootData: Fundraising ===")
    rounds = sela.run("rootdata/fundraising")
    for r in rounds[:10]:
        investors = ", ".join(i["name"] for i in r["investors"][:3])
        print(f"  {r['project']}: {r['round']} {r['amount']}  {r['date']}  [{investors}]")


def show_rd_investors(sela: Selanet):
    print("\n=== RootData: Investors ===")
    investors = sela.run("rootdata/investors")
    for i in investors[:10]:
        print(f"  {i['name']}: portfolio {i['portfolio']}  rounds/yr {i['rounds_1yr']}  raised {i['total_raised']}")


def show_rd_people(sela: Selanet):
    print("\n=== RootData: People ===")
    people = sela.run("rootdata/people")
    for p in people[:10]:
        print(f"  {p['name']}: {p['position']} @ {p['company']}")


def show_rd_projects(sela: Selanet):
    print("\n=== RootData: Projects ===")
    projects = sela.run("rootdata/projects")
    for p in projects[:10]:
        tags = ", ".join(p["tags"][:3])
        print(f"  {p['name']} ({p['symbol']}): [{tags}]  growth {p['growth_index']}  popularity {p['popularity_index']}")


def show_rd_rankings_soaring(sela: Selanet):
    print("\n=== RootData: Soaring Rankings ===")
    projects = sela.run("rootdata/rankings_soaring")
    for p in projects[:10]:
        tags = ", ".join(p["tags"][:3])
        print(f"  #{p['rank']} {p['name']}: [{tags}]  trend {p['popularity_trend_24h']}  rating {p['user_rating']}")


def show_rd_token_unlocks(sela: Selanet):
    print("\n=== RootData: Token Unlocks ===")
    unlocks = sela.run("rootdata/token_unlocks")
    for u in unlocks[:10]:
        print(f"  #{u['rank']} {u['symbol']}: price {u['price']}  next unlock {u['next_unlock_value']}  in {u['unlock_countdown']}")


def show_eth_top_accounts(sela: Selanet):
    print("\n=== Etherscan: Top Accounts ===")
    accounts = sela.run("etherscan/top_accounts")
    for a in accounts[:10]:
        print(f"  #{a['rank']} {a['address'][:16]}...  {a['name_tag']}  bal: {a['balance']}  txns: {a['txn_count']}")


def show_eth_tokens(sela: Selanet):
    print("\n=== Etherscan: ERC-20 Tokens ===")
    tokens = sela.run("etherscan/tokens")
    for t in tokens[:10]:
        print(f"  #{t['rank']} {t['name']} ({t['symbol']}): {t['price']}  24h: {t['change_24h']}  holders: {t['holders']}")


def show_eth_blocks(sela: Selanet):
    print("\n=== Etherscan: Recent Blocks ===")
    blocks = sela.run("etherscan/blocks")
    for b in blocks[:10]:
        print(f"  Block {b['block']}: {b['txn']} txns  gas {b['gas_used']}  reward {b['reward']}  {b['age']}")


def show_eth_transactions(sela: Selanet):
    print("\n=== Etherscan: Recent Transactions ===")
    txs = sela.run("etherscan/transactions")
    for t in txs[:10]:
        print(f"  {t['tx_hash'][:16]}... {t['method']}  {t['amount']}  fee: {t['txn_fee']}  {t['age']}")


def show_eth_tx_detail(sela: Selanet):
    print("\n=== Etherscan: Transaction Detail ===")
    tx = sela.run("etherscan/tx_detail", params={"hash": "0xab04bf5750485049f94f93057dd4adc8f3c901cb0218a78b901739be04a76776"})
    print(f"  Hash: {tx['tx_hash']}")
    print(f"  Status: {tx['status']}  Block: {tx['block']}")
    print(f"  From: {tx['from']}  To: {tx['to']}")
    print(f"  Value: {tx['value']}  Fee: {tx['transaction_fee']}")


def show_eth_block_detail(sela: Selanet):
    print("\n=== Etherscan: Block Detail ===")
    b = sela.run("etherscan/block_detail", params={"block": "24777393"})
    print(f"  Block: {b['block_height']}  Status: {b['status']}")
    print(f"  Txns: {b['transactions']}  Gas: {b['gas_used']}/{b['gas_limit']}")
    print(f"  Reward: {b['block_reward']}  Burnt: {b['burnt_fees']}")


def show_eth_address_detail(sela: Selanet):
    print("\n=== Etherscan: Address Detail ===")
    a = sela.run("etherscan/address_detail", params={"address": "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"})
    print(f"  Address: {a['address']}  Name: {a['name']}")
    print(f"  Balance: {a['eth_balance']}  Value: {a['eth_value']}")


def show_eth_token_detail(sela: Selanet):
    print("\n=== Etherscan: Token Detail ===")
    t = sela.run("etherscan/token_detail", params={"token": "0xdac17f958d2ee523a2206206994597c13d831ec7"})
    print(f"  Name: {t['name']}  Decimals: {t['decimals']}")
    print(f"  Supply: {t['max_total_supply']}  Holders: {t['holders']}")
    print(f"  Price: {t['price']}  MCap: {t['onchain_market_cap']}")


def show_arc_accounts(sela: Selanet):
    print("\n=== Arcscan: Top Accounts ===")
    accounts = sela.run("arcscan/accounts")
    for a in accounts[:10]:
        print(f"  #{a['rank']} {a['address'][:16]}...  bal: {a['balance']}  txns: {a['txn_count']}")


def show_arc_blocks(sela: Selanet):
    print("\n=== Arcscan: Recent Blocks ===")
    blocks = sela.run("arcscan/blocks")
    for b in blocks[:10]:
        print(f"  Block {b['block']}: {b['txn']} txns  gas {b['gas_used']}  {b['age']}")


def show_arc_transactions(sela: Selanet):
    print("\n=== Arcscan: Recent Transactions ===")
    txs = sela.run("arcscan/transactions")
    for t in txs[:10]:
        print(f"  {t['tx_hash'][:16]}... {t['type']}  {t['value']}  fee: {t['fee']}")


def show_arc_account_detail(sela: Selanet):
    print("\n=== Arcscan: Account Detail ===")
    a = sela.run("arcscan/account_detail", params={"address": "0x4f7A67464B5976d7547c860109e4432d50AfB38e"})
    print(f"  Address: {a['address']}  Balance: {a['balance']}  Txns: {a['transactions']}")


def show_arc_block_detail(sela: Selanet):
    print("\n=== Arcscan: Block Detail ===")
    b = sela.run("arcscan/block_detail", params={"block": "34746818"})
    print(f"  Block: {b['block_height']}  Txns: {b['transactions']}  Gas: {b['gas_used']}/{b['gas_limit']}")


def show_arc_tx_detail(sela: Selanet):
    print("\n=== Arcscan: Transaction Detail ===")
    t = sela.run("arcscan/tx_detail", params={"hash": "0x3f9699f86445110f99abfb7435a02a4153d1c42b637c7e4f6481eb4c0c6bdc5f"})
    print(f"  Hash: {t['tx_hash'][:20]}...  Status: {t['status']}  Block: {t['block']}")
    print(f"  From: {t['from']}  Value: {t['value']}  Fee: {t['transaction_fee']}")


def show_arc_token_detail(sela: Selanet):
    print("\n=== Arcscan: Token Detail ===")
    t = sela.run("arcscan/token_detail", params={"token": "0x2B51Ae4412F79c3c1cB12AA40Ea4ECEb4e80511a"})
    print(f"  Name: {t['name']}  Supply: {t['total_supply']}  Holders: {t['holders']}")


def show_world_blocks(sela: Selanet):
    print("\n=== Worldscan: Recent Blocks ===")
    blocks = sela.run("worldscan/blocks")
    for b in blocks[:10]:
        print(f"  Block {b['block']}: {b['txn']} txns  gas {b['gas_used']}  {b['age']}")


def show_world_transactions(sela: Selanet):
    print("\n=== Worldscan: Recent Transactions ===")
    txs = sela.run("worldscan/transactions")
    for t in txs[:10]:
        print(f"  {t['tx_hash'][:16]}... {t['action']}  {t['amount']}  fee: {t['txn_fee']}")


def show_world_address_detail(sela: Selanet):
    print("\n=== Worldscan: Address Detail ===")
    a = sela.run("worldscan/address_detail", params={"address": "0xf8ac0baf3b528368334a3c8deddfa7f135f9e1ec"})
    print(f"  Address: {a['address']}  Balance: {a['balance']}")
    for h in a.get("token_holdings", [])[:5]:
        print(f"    {h['token']}: {h['amount']} ({h['value']})")


def show_world_block_detail(sela: Selanet):
    print("\n=== Worldscan: Block Detail ===")
    b = sela.run("worldscan/block_detail", params={"block": "27812998"})
    print(f"  Block: {b['block_height']}  Txns: {b['transactions']}  Gas: {b['gas_used']}/{b['gas_limit']}")


def show_world_tx_detail(sela: Selanet):
    print("\n=== Worldscan: Transaction Detail ===")
    t = sela.run("worldscan/tx_detail", params={"hash": "0x58064d272b6634bac928e733dc92f35f10b34cbd204e595281b2bcba480dfcc9"})
    print(f"  Hash: {t['tx_hash'][:20]}...  Status: {t['status']}  Block: {t['block']}")


def show_world_token_detail(sela: Selanet):
    print("\n=== Worldscan: Token Detail ===")
    t = sela.run("worldscan/token_detail", params={"token": "0x4200000000000000000000000000000000000006"})
    print(f"  Name: {t['name']}  Supply: {t['max_total_supply']}  Holders: {t['holders']}")


def show_x_profile(sela: Selanet):
    print("\n=== X: Profile ===")
    posts = sela.run("x/profile", params={"username": "VitalikButerin", "count": "5"})
    for t in posts[:5]:
        print(f"  @{t['author_username']}  {t['text'][:80]}...")
        print(f"    likes {t['like_count']}  retweets {t['retweet_count']}  replies {t['reply_count']}")


def show_x_search(sela: Selanet):
    print("\n=== X: Search ===")
    posts = sela.run("x/search", params={"query": "$ETH min_faves:100", "count": "5"})
    if not posts:
        print("  (Login required for search, or no results)")
        return
    for t in posts[:5]:
        print(f"  @{t['author_username']}  {t['text'][:80]}...")
        print(f"    likes {t['like_count']}  retweets {t['retweet_count']}  replies {t['reply_count']}")


def show_x_post(sela: Selanet):
    print("\n=== X: Post Detail ===")
    result = sela.run("x/post", params={"url": "https://x.com/corcoranwill/status/2036225236798959737"})
    post = result.get("post")
    if post:
        print(f"  @{post['author_username']}  {post['text'][:100]}...")
        print(f"    likes {post['like_count']}  retweets {post['retweet_count']}  replies {post['reply_count']}")
    replies = result.get("replies", [])
    if replies:
        print(f"  Replies ({len(replies)}):")
        for r in replies[:3]:
            print(f"    @{r['author_username']}: {r['text'][:60]}...")


def show_l2_scaling_summary(sela: Selanet):
    print("\n=== L2Beat: Scaling Summary ===")
    l2s = sela.run("l2beat/scaling_summary")
    for l in l2s[:10]:
        print(f"  #{l['rank']} {l['name']}: {l['stage']}  TVS {l['total_value_secured']}  proof: {l['proof_system']}")


def show_l2_scaling_risk(sela: Selanet):
    print("\n=== L2Beat: Scaling Risk ===")
    risks = sela.run("l2beat/scaling_risk")
    for r in risks[:10]:
        print(f"  #{r['rank']} {r['name']}: DA {r['data_availability']}  exit {r['exit_window']}  seq {r['sequencer_failure']}")


RECIPES = {
    # CoinGecko
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
    # RootData
    "rd_exchanges_ranking": show_rd_exchanges_ranking,
    "rd_fundraising": show_rd_fundraising,
    "rd_investors": show_rd_investors,
    "rd_people": show_rd_people,
    "rd_projects": show_rd_projects,
    "rd_rankings_soaring": show_rd_rankings_soaring,
    "rd_token_unlocks": show_rd_token_unlocks,
    # Etherscan
    "eth_top_accounts": show_eth_top_accounts,
    "eth_tokens": show_eth_tokens,
    "eth_blocks": show_eth_blocks,
    "eth_transactions": show_eth_transactions,
    "eth_tx_detail": show_eth_tx_detail,
    "eth_block_detail": show_eth_block_detail,
    "eth_address_detail": show_eth_address_detail,
    "eth_token_detail": show_eth_token_detail,
    # Arcscan
    "arc_accounts": show_arc_accounts,
    "arc_blocks": show_arc_blocks,
    "arc_transactions": show_arc_transactions,
    "arc_account_detail": show_arc_account_detail,
    "arc_block_detail": show_arc_block_detail,
    "arc_tx_detail": show_arc_tx_detail,
    "arc_token_detail": show_arc_token_detail,
    # Worldscan
    "world_blocks": show_world_blocks,
    "world_transactions": show_world_transactions,
    "world_address_detail": show_world_address_detail,
    "world_block_detail": show_world_block_detail,
    "world_tx_detail": show_world_tx_detail,
    "world_token_detail": show_world_token_detail,
    # X (Twitter)
    "x_profile": show_x_profile,
    "x_search": show_x_search,
    "x_post": show_x_post,
    # L2Beat
    "l2_scaling_summary": show_l2_scaling_summary,
    "l2_scaling_risk": show_l2_scaling_risk,
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
