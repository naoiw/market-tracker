# システム設計

## 全体構成

```text
ECB reference rates      bitbank JPY tickers      Authorized data feed (optional)
        |                        |                            |
   Frankfurter API               |                            |
        |                        |                            |
        +------------------------+----------------------------+
                                 |
                        scripts/collect.mjs
                           source fetching
                                 |
                      scripts/price-utils.mjs
                      validation / merge / trim
                                 |
                    main: public/data/prices.json
                                 |
                     GitHub Pages build & deploy
                         /              \\
                    production       develop preview
                      (main)         (main price JSON)
```

- UIはReact + TypeScript + Rechartsを使う読み取り専用Viteアプリです。
- ブラウザはビルド済み静的JSONのみ読み込みます。任意の認証トークンはActions Secretsからサーバー側の取得処理に渡します。
- 自動取得する価格JSONの正本は`main`にのみ保存します。プレビューは公開直前に`main`の価格データを使用します。
- bitbankのJPY建てティッカーからBTCとETHの最終約定価格を取得します。ドル額はフロントエンドでECBのUSD/JPY参考レートから概算し、ドル建ての観測データとしては保存しません。
- CIは`validate-develop.yml`、価格取得と本番・プレビューの公開は`deploy-pages.yml`を使用します。

## データの保存形式

`public/data/prices.json`の構造例：

```json
{
  "version": 1,
  "updatedAt": "2026-10-30T01:17:00.000Z",
  "series": {
    "USDJPY": [
      {"at": "2026-10-29T00:00:00.000Z", "value": 153.25}
    ]
  }
}
```

`updatedAt`は公開JSONを最後に更新した時刻です。各観測値の`at`とは異なります。初回収集前は`updatedAt: null`と空の`series`を許容します。

- 日次参考レートでは`T00:00:00.000Z`が**発表元の対象日**を示し、取引時刻や約定時刻ではありません。
- 同じ銘柄・同じ日時のデータは重複登録しません。タイムスタンプの昇順に保存します。
- 許可された銘柄ID、正の有限数値、妥当なタイムスタンプのみ受け付けます。
- 現在の履歴保持期間は180日です。新しい観測値がない銘柄を含む全銘柄の履歴を整理します。
- API取得は各提供元につき最大3回試行し、失敗した提供元の名前をログに記録します。全ソースが失敗した場合はJSONを書き換えません。
- 定期収集と実際の市場データの更新間隔は独立しています。新しい日時の観測値がなければ重複して追加しません。古い観測値の削除だけでJSONが更新されることもあります。

## ディレクトリ

- `index.html` — Viteアプリのエントリポイント
- `src/App.tsx` — 画面状態・グラフ
- `src/components/` — 銘柄カード
- `src/pricing.ts` — 表示用価格計算・書式設定
- `src/assets.ts` / `src/types.ts` — 銘柄定義・型
- `src/styles.css` — スタイル
- `scripts/` — API取得と時系列データ処理
- `public/data/` — 公開用JSON
- `tests/` — 価格正規化・履歴更新のテスト
- `.github/workflows/` — CI・データ収集・Pages公開

ブランチ運用は[DEVELOPMENT.md](DEVELOPMENT.md)、CIとPagesの詳細は[DEPLOYMENT.md](DEPLOYMENT.md)、データ使用許諾は[data-sources.md](data-sources.md)を参照してください。
