# データソースと利用条件

## データ一覧

| データ | 状態 | 実際の更新間隔 | 情報元 |
| --- | --- | --- | --- |
| USD/JPY | 有効 | ECBの営業日ごとの日次参考値からクロス計算 | [ECB](https://www.ecb.europa.eu/stats/policy_and_exchange_rates/euro_reference_exchange_rates/html/index.en.html) / [Frankfurter](https://frankfurter.dev/) |
| EUR/JPY | 有効 | ECBの営業日ごとの日次参考値 | ECB / Frankfurter |
| BTC/JPY、ETH/JPY | 接続待ち | 利用許諾済みフィードは時間足に正規化可能 | 外部フィード |
| 日経平均、TOPIX | 接続待ち | 終値を日次単位で保存可能 | 外部フィード |
| S&P 500、NASDAQ | 接続待ち | 終値を日次単位で保存可能 | 外部フィード |

ECBのデータはFrankfurter API経由で取得しています。EUR/JPYとEUR/USDからUSD/JPYを計算します。**Actionsの毎時実行は、ECBレートの毎時更新を意味しません。**

## 市場データの権利

無料APIで取得できるデータでも、公開Webサイトへの表示やGitHubの公開リポジトリへの長期保存・再配布が許されるとは限りません。価格データの利用許諾はソースコードのMITライセンスとは別です。

データソースの権利が確認できるまでは、暗号資産・株価指数の価格を外部サイトからスクレイピングしたり、公開JSONへコピーしたりしません。

## 利用許諾済みのフィードの接続

必要に応じてGitHubの**Settings → Secrets and variables → Actions**で設定します。

- `AUTHORIZED_PRICE_FEED_URL` — HTTPSのJSONエンドポイント
- `AUTHORIZED_PRICE_FEED_TOKEN` — 任意のBearerトークン

期待する形式：

```json
{
  "prices": [
    {"id": "BTCJPY", "at": "2026-10-30T01:25:00Z", "value": 10000000},
    {"id": "NIKKEI225", "at": "2026-10-29T06:00:00Z", "value": 42000}
  ]
}
```

対象ID：`USDJPY`、`EURJPY`、`BTCJPY`、`ETHJPY`、`NIKKEI225`、`TOPIX`、`SP500`、`NASDAQ`。時系列はUTCで保存し、暗号資産・為替は毎時、株価指数は日付単位に正規化します。

## 参考リンク

- [ECB統計の利用条件](https://www.ecb.europa.eu/stats/ecb_statistics/governance_and_quality_framework/html/usage_policy.en.html)
- [Frankfurter API](https://frankfurter.dev/)
- [日経平均の利用許諾案内](https://indexes.nikkei.co.jp/nkave/license/index.en.html)
- [FRED 日経平均シリーズの著作権注記](https://fred.stlouisfed.org/series/NIKKEI225)
- [Coinbase Market Data Terms](https://www.coinbase.com/legal/market_data)
