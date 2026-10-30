# 開発手順

## 起動

Node.js 22 / pnpm 9.15.0 を使用します（`.nvmrc`と`package.json`で指定）。

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm build
```

`pnpm collect`では外部価格APIを実行し、`public/data/prices.json`を更新します。外部データの公開権限を確認せず、公開リポジトリに記録しないでください。

## ブランチ運用

- **通常の開発は`develop`**。本番用`main`へ直接実装をpushしません。
- 本番へ反映するときは**base: `main` / compare: `develop`**のPRを作ります。
- PRのテスト・ビルドが成功してからマージします。PR作成だけでは公開しません。
- **マージ後も`develop`を削除しません。** `main`のマージコミットと価格履歴更新を取り込みます。
- `develop`へpushすれば検証成功後に開発プレビューが自動更新されます。

普段の作業例：

```bash
git switch develop
git fetch origin
git merge origin/main
pnpm install --frozen-lockfile
pnpm test
pnpm build
# 編集・動作確認
git add .
git commit -m "feat: describe changes"
git push origin develop
# ブラウザで /develop/ を確認し、必要になったら main 向けPRを作成
```

## 実装ファイル

- `src/App.tsx` — 画面全体、カテゴリ・期間選択、グラフとデータ読込
- `src/components/PriceCard.tsx` — 銘柄カード。選択状態・最新値・概算USDを表示
- `src/pricing.ts` — 日付・価格の書式設定、期間抽出、変化率、概算USDの計算
- `src/assets.ts` — 銘柄定義と出典
- `src/types.ts` — 型定義
- `src/styles.css` — レスポンシブなUIスタイル（ルール単位で整形）
- `scripts/collect.mjs` — APIからの取得とJSON保存
- `scripts/price-utils.mjs` — 取得データの検証・履歴統合・全銘柄の古い観測値の削除
- `public/data/prices.json` — 公開可能な価格の履歴（正本は`main`）
- `tests/price-utils.test.mjs` — Node.js標準テストランナーによる回帰テスト（取得データ・重複・日付境界・180日保持）

## 実装上の注意

- 価格データの検証・正規化は`price-utils.mjs`、表示用の計算は`pricing.ts`に置き、Reactコンポーネントに取得元ごとの処理を書かない。
- 取得元の障害は個別にログへ記録し、成功した他の取得元のデータは保存する。全取得元が失敗した場合のみ収集処理を失敗とする。
- 180日を超えた履歴の整理は、新しい観測値が届かなかった銘柄も含めて行う。既存データは破壊的に変更しない。
- 実データを追加する場合は、取得APIの利用条件だけでなく、公開JSONの再配布条件も確認する。

## UI文言の方針

- 画面内のテキストは機能名・数値・状態・操作方法を簡潔に記述する。
- キャッチコピー、宣伝調の見出し、抽象的・装飾的な表現は原則使用しない。
- 説明文が不要な場合は追加しない。

## CI

- `.github/workflows/validate-develop.yml` — `develop` pushとPRを検証。失敗したコードはプレビューに配信しません。
- `.github/workflows/deploy-pages.yml` — `main` pushまたは`develop`の成功したpush検証から本番とプレビューを統合デプロイ。毎時の価格取得も担当。
- `workflow_run`からの公開は検証成功した`develop`のコミットSHAを使います。
- 価格履歴は`main`で保存し、プレビュービルドにコピーするため、実価格の古いスナップショットを`develop`へコミットしません。

公開構成の詳細は[DEPLOYMENT.md](DEPLOYMENT.md)を参照してください。
