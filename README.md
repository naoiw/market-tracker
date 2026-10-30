# market-tracker

GitHub Actions で価格を収集し、React + TypeScript で可視化する静的マーケットダッシュボード。

- **Site (after Pages is enabled):** https://naoiw.github.io/market-tracker/
- **Stack:** React / TypeScript / Vite / Recharts / Node.js / GitHub Actions
- **Branch strategy:** `develop` で開発し、`main` へは PR でマージする
- **Hosting:** GitHub Pages (Vercel-compatible relative URLs)

## Quick start

Node.js 22 以上が必要です。

```bash
npm install
npm run dev
npm test
npm run build
```

`npm run collect` はインターネットにアクセスして `public/data/prices.json` を更新します。
価格未取得の状態ではダッシュボードに「データ未接続」と表示されます。架空の価格は使用しません。

## What works without any API keys

- 為替：USD/JPY、EUR/JPY の**日次参考レート**（Frankfurter 経由、ECB 公表データ）。初回は過去約90日分を取得
- 取得履歴の重複排除、日時順ソート、価格検証、180日より古い観測点の除外
- スマホ対応のカード、期間切替グラフ、出典・更新日時・欠損状態の表示
- 毎時17分（JST）に GitHub Actions が収集。データが変わった場合のみ保存・Pages 再デプロイ
- 手動ワークフロー実行、PRでのビルド・テスト

**出典：ECB statistics（Frankfurter 経由）。EUR/JPY と EUR/USD を基に USD/JPY をクロス計算しています。**

**注意：Frankfurter の参考為替レートは日次更新です。Actions を毎時実行してもレートが1時間ごとに変わるわけではありません。**

## Additional assets: BTC/ETH, Nikkei, TOPIX, S&P 500, NASDAQ

データソースは表示権・保存権・再配布権を確認してから有効にしてください。各社の無料 API を勝手に公開 JSON にコピーする実装はありません。

利用許諾済みデータを返す HTTPS endpoint を用意した場合、以下の Actions repository secrets を設定します。

- `AUTHORIZED_PRICE_FEED_URL`: JSON を返す HTTPS URL
- `AUTHORIZED_PRICE_FEED_TOKEN`: 任意の Bearer token

返却値の形式：

```json
{
  "prices": [
    { "id": "BTCJPY", "at": "2026-10-30T01:25:00Z", "value": 10000000 },
    { "id": "NIKKEI225", "at": "2026-10-29T06:00:00Z", "value": 42000 }
  ]
}
```

サポート銘柄ID: `USDJPY`, `EURJPY`, `BTCJPY`, `ETHJPY`, `NIKKEI225`, `TOPIX`, `SP500`, `NASDAQ`。
為替・暗号資産はUTCの毎時に、指数はUTCの日付単位に正規化します。公開可能なデータの権利がある場合のみ利用してください。

詳しい仕様は [docs/architecture.md](docs/architecture.md) と [docs/data-sources.md](docs/data-sources.md) を参照してください。

## Deployment setup (one-time)

1. `develop` の PR を `main` にマージ
2. GitHub の **Settings → Pages → Build and deployment → Source** で **GitHub Actions** を選択
3. **Actions** タブから **Collect prices and publish** を手動実行（Collect を有効）。以降は毎時定期実行
4. 必要なら Settings → Actions → General → Workflow permissions で書き込み権限を許可（通常は workflow の `permissions` 指定で十分）
5. 対応する権利を取得した場合のみ、上記の任意 Secrets を設定する

Vercel でホストする場合は Vite アプリとしてデプロイできます。ただし現在の公開ワークフローは GitHub Pages 向けです。

## Licensing

ソースコードは MIT License（ルートの `LICENSE`）。外部の市場データには**別のライセンス**が適用されます。MIT は価格データの再配布権を付与しません。
