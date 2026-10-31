# Market Tracker

GitHub Actions で価格データを定期取得し、React と TypeScript で可視化する非商用のマーケットダッシュボードです。

## 主な機能

- 株価指数・為替・暗号資産の一覧と価格推移グラフ
- 期間切替（24時間・7日・30日・90日・全期間）とカテゴリー別表示
- USD/JPY・EUR/JPYの日次参考レートを自動取得（ECB / Frankfurter）
- BTC/JPY・ETH/JPYの直近約定価格をbitbank公開APIから1時間ごとに取得
- BTC・ETHに概算USD価格を併記（ECBのUSD/JPY日次参考レートで換算）
- GitHub Actionsによる定期収集、価格履歴の重複排除・検証・保存
- スマートフォン対応、最終更新日時・出典・未取得状態の表示
- 利用許諾済みの市場データAPIを追加するための拡張口

株価指数はデータソース未接続です。為替は日次参考レートであり、1時間足の実勢相場ではありません。BTC・ETHのUSD表記も実際のドル建て取引価格ではなく、参考換算値です。

## 公開先

| 環境 | ブランチ | URL |
| --- | --- | --- |
| 本番 | `main` | https://naoiw.github.io/market-tracker/ |
| 開発プレビュー | `develop` | https://naoiw.github.io/market-tracker/develop/ |

本番とプレビューは、1つのGitHub Pagesサイト（`github-pages`環境）内の別々のパスで公開します。プレビューも、公開済みの本番価格データを使います。

## データ取得

現在、USD/JPY・EUR/JPYのECB日次参考レートと、BTC/JPY・ETH/JPYのbitbank最新約定価格を、GitHub Actionsで**毎時42分（日本時間）に取得確認**します。暗号資産は取得時の時刻をUTCの時間単位に丸めて保存します。日経平均・TOPIX・S&P 500・NASDAQ Compositeはフィード未接続です。

銘柄ごとの取得試行間隔・公開データの更新頻度・接続状態は[データソースと利用条件](docs/data-sources.md#銘柄別の取得頻度)を参照してください。

価格取得は定期実行に加え、`main`へのpush時にも1回試みます。**画面の最終更新日時は価格JSONが更新された時刻であり、最終取得試行時刻ではありません。** 取得結果の確認・手動実行は[デプロイ構成](docs/DEPLOYMENT.md#取得の確認手動実行)を参照してください。

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
- `src/App.tsx` — 画面全体・表示状態・チャート
- `src/components/` — 価格カードなどのUIコンポーネント
- `src/pricing.ts` — 日付・価格の書式設定、期間抽出、参考USD換算
- `src/assets.ts` / `src/types.ts` — 銘柄定義と型
- `src/styles.css` — レスポンシブUIのスタイル
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

[MIT License](LICENSE)。本アプリは非商用の個人制作物です。**ソースコードのMITライセンスは第三者の価格データに適用されません。** APIの公開利用条件と、取得データを公開JSONで保存・再配布する権利は別途確認が必要です（[データソースと利用条件](docs/data-sources.md)）。
