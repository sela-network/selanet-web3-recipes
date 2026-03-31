"""
Example: Using the Node bridge to get parsed token prices.

Usage:
    python example_bridge.py
"""

from selanet import Selanet

with Selanet() as sela:
    tokens = sela.run("coingecko/token_prices")
    for t in tokens[:10]:
        print(f"#{t['rank']} {t['name']} ({t['symbol']}): ${t['price']:,.2f}  24h: {t['change_24h']}%")
