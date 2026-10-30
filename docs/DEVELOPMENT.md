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

- `src/App.tsx` — グラフ・カード・表示状態
- `src/assets.ts` — 銘柄定義と出典
- `src/types.ts` — 型定義
- `src/styles.css` — レスポンシブなUIスタイル
- `scripts/collect.mjs` — APIからの取得とJSON保存
- `scripts/price-utils.mjs` — 取得データの検証・統合
- `public/data/prices.json` — 公開可能な価格の履歴（正本は`main`）
- `tests/price-utils.test.mjs` — Node.js標準テストランナーによる回帰テスト

## CI

- `.github/workflows/validate-develop.yml` — `develop` pushとPRを検証。失敗したコードはプレビューに配信しません。
- `.github/workflows/deploy-pages.yml` — `main` pushまたは`develop`の成功したpush検証から本番とプレビューを統合デプロイ。毎時の価格取得も担当。
- `workflow_run`からの公開は検証成功した`develop`のコミットSHAを使います。
- 価格履歴は`main`で保存し、プレビュービルドにコピーするため、実価格の古いスナップショットを`develop`へコミットしません。

公開構成の詳細は[DEPLOYMENT.md](DEPLOYMENT.md)を参照してください。
