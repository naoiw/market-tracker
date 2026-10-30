# Market Tracker

GitHub Actions で価格データを定期取得し、React と TypeScript で可視化するマーケットダッシュボードです。

## 主な機能

- 株価指数・為替・暗号資産の一覧と価格推移グラフ
- 期間切替（24時間・7日・30日・90日・全期間）とカテゴリー別表示
- USD/JPY・EUR/JPYの日次参考レートを自動取得（ECB / Frankfurter）
- GitHub Actionsによる定期収集、価格履歴の重複排除・検証・保存
- スマートフォン対応、最終更新日時・出典・未取得状態の表示
- 利用許諾済みの市場データAPIを追加するための拡張口

暗号資産と株価指数は、公開利用を許諾されたデータソースを接続するまでは価格を表示しません。為替は日次参考レートであり、1時間足の実勢相場ではありません。

## 公開先

| 環境 | ブランチ | URL |
| --- | --- | --- |
| 本番 | `main` | https://naoiw.github.io/market-tracker/ |
| 開発プレビュー | `develop` | https://naoiw.github.io/market-tracker/develop/ |

本番とプレビューは、1つのGitHub Pagesサイト（`github-pages`環境）内の別々のパスで公開します。プレビューも、公開済みの本番価格データを使います。

## 技術スタック

- **TypeScript / React 19 / Recharts** — UI・価格グラフ
- **CSS / Vite** — スタイル・開発サーバー・ビルド
- **Node.js 22 / pnpm 9** — 価格取得・開発・ビルド
- **GitHub Actions / GitHub Pages** — テスト・定期取得・デプロイ

## ローカル開発

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev      # 開発サーバーを起動
pnpm test     # 自動テスト
pnpm build    # dist/ を生成
pnpm collect  # 外部APIから価格を取得し、価格JSONを更新
```

`pnpm dev`はViteの開発サーバーを起動します。`pnpm collect`はネットワークへアクセスして`public/data/prices.json`を書き換えます。生成物`dist/`はGit管理対象外です。

## ブランチ運用

1. 通常の実装・修正は **`develop`** で行い、`main`は本番用として維持します。
2. Pull Requestではテストとビルドを実行し、デプロイは行いません。
3. `develop`へのpushが検証に成功すると、`main`上のワークフローから開発プレビューを更新します。
4. 本番反映は **`develop` → `main`のPull Request** で行います。マージ後も`develop`は削除せず、`main`を同期して使い続けます。

価格履歴は定期実行で`main`へ保存するため、開発前には`main`の最新変更を取り込んでください。

## ディレクトリ構成

- `index.html` — 画面のエントリポイント
- `src/` — Reactコンポーネント・画面状態・CSS
- `scripts/` — API取得・データ検証・履歴の保存
- `public/data/` — 公開する価格データ（JSON）
- `tests/` — 自動テスト
- `.github/workflows/` — 検証・価格収集・GitHub Pagesデプロイ
- `docs/` — 仕様書・設計・開発手順・運用手順

## ドキュメント

- [仕様書](docs/SPEC.md)
- [開発手順](docs/DEVELOPMENT.md)
- [デプロイ構成](docs/DEPLOYMENT.md)
- [システム設計](docs/architecture.md)
- [データソースと利用条件](docs/data-sources.md)

## ライセンス

[MIT License](LICENSE)。外部から取得する価格データの利用条件は各提供元に従います。
