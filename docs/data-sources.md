# Market data sources and permissions

| Instrument | Enabled by default? | Frequency | Source |
|---|---|---|---|
| USD/JPY | Yes | Official reference, daily, calculated cross rate | [ECB](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) via [Frankfurter](https://frankfurter.dev/) |
| EUR/JPY | Yes | Official reference, daily | ECB via Frankfurter |
| BTC/JPY, ETH/JPY | No | Hourly collector ready | User-authorized feed |
| Nikkei 225, TOPIX | No | Daily collector ready | User-authorized feed |
| S&P 500, NASDAQ | No | Daily collector ready | User-authorized feed |

Frankfurter offers a public API without a key. This app pins the ECB source; USD/JPY is calculated from ECB EUR/JPY and EUR/USD reference rates. Source attribution: ECB statistics. These rates are **not live FX quotes**, even though they are polled hourly.

## Why market indices and cryptocurrency are opt-in

Publishing price history to both a public GitHub repo and GitHub Pages constitutes making it available to others. Many free finance APIs only allow personal/internal use, prohibit data redistribution, or require express authorization for public websites. The Nikkei index in particular has explicit display and redistribution conditions, even when obtained through FRED. We therefore do not scrape Yahoo, FRED's copyrighted Nikkei series, or Coinbase and commit that market data to this public repository by default.

Review provider terms, display requirements, retention limits and redistribution rights, and only then connect a licensed feed. A free API key alone does **not** grant rights to mirror the API's response into publicly downloadable JSON.

### Useful reference links

- [Nikkei official license](https://indexes.nikkei.co.jp/nkave/license/index.en.html)
- [FRED Nikkei series copyright notes](https://fred.stlouisfed.org/series/NIKKEI225)
- [Frankfurter API](https://frankfurter.dev/)
- [ECB free-reuse conditions (attribution required)](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html)
- [Coinbase market data terms](https://www.coinbase.com/legal/market_data)

The dashboard includes source labels and deliberately does not show fictitious figures for unconfigured assets.
