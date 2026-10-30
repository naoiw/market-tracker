# システム設計

## 全体構成

```text
ECB（日次参考レート）           利用許諾済みの外部データAPI（任意）
       |                                    |
   Frankfurter                              |
       +-----------------+------------------+
                         |
              scripts/collect.mjs
                         |
              scripts/price-utils.mjs
                （正規化・検証）
                         |
         main: public/data/prices.json
                         |
        +----------------+-----------------+
        |                                  |
   main のビルド                    develop のビルド
        |                      （mainのJSONをプレビューへコピー）
        +----------------+-----------------+
                         |
                GitHub Pages
          /market-tracker/  /develop/
```

- UIはReact + TypeScript + Rechartsを使う読み取り専用Viteアプリです。
- ブラウザはビルド済み静的JSONのみ読み込みます。任意の認証トークンはActions Secretsからサーバー側の取得処理に渡します。
- 自動取得する価格JSONの正本は`main`にのみ保存します。プレビューは公開直前に`main`の価格データを使用します。
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
- 現在の履歴保持期間は180日です。
- API取得エラーは再試行し、全ソースの失敗時にはJSONを書き換えません。
- 定期収集と実際の市場データの更新間隔は独立しています。収集ワークフローが成功しても、前回と同じ価格であれば更新しません。

## ディレクトリ

- `index.html` — Viteアプリのエントリポイント
- `src/` — コンポーネント、グラフ、CSS
- `scripts/` — API取得と時系列データ処理
- `public/data/` — 公開用JSON
- `tests/` — 価格正規化・履歴更新のテスト
- `.github/workflows/` — CI・データ収集・Pages公開

ブランチ運用は[DEVELOPMENT.md](DEVELOPMENT.md)、CIとPagesの詳細は[DEPLOYMENT.md](DEPLOYMENT.md)、データ使用許諾は[data-sources.md](data-sources.md)を参照してください。
