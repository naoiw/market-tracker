# GitHub Pages デプロイ

## 公開先

1つの`github-pages`環境から本番とプレビューを同時公開します。

| ソース | URL |
| --- | --- |
| `main` | https://naoiw.github.io/market-tracker/ |
| `develop` | https://naoiw.github.io/market-tracker/develop/ |

## ワークフロー（2ファイル）

1. `.github/workflows/validate-develop.yml` は`develop`へのpushおよびmain/develop宛PRでテストとビルドを実行します。PRの成功だけでは公開しません。
2. `develop`のpush検証が成功すると、`main`に配置した`.github/workflows/deploy-pages.yml`が`workflow_run`で起動します。失敗・キャンセル・PRの検証では公開しません。
3. `main`へのpushでは公開ワークフローを直接起動します。`workflow_dispatch`による手動実行は`main`から行います。
4. 公開時は`main`と`develop`を再検証してビルドし、ルートと`develop/`に配置した**1つのPagesアーティファクト**を配信します。
5. 開発プレビューは`vite build --base=/market-tracker/develop/`でビルドし、アセットと価格JSONの参照先を正しく解決します。
6. 定期収集は`main`側でのみ行い、新しい価格がないときはデプロイをスキップします。

## 定期データ更新

- `17 * * * *`（`Asia/Tokyo`）で毎時17分に起動を試みます。実行遅延・スキップはあり得ます。
- ECBの為替レートは日次参考値なので、1時間ごとの実行でも値が変わらないことがあります。
- 価格が更新された場合だけ`github-actions[bot]`が`main`の`public/data/prices.json`へコミットします。
- botのコミットでは別のpushワークフローは起動しないため、収集ジョブ内でPagesのビルド・公開まで行います。
- ビルド時に`main`から現在の価格JSONを`develop`側にコピーし、どちらの画面でも同じ公開価格を表示します。

## 必要なGitHub設定

1. `develop`で用意したデプロイワークフローをPRで`main`にマージします。初回だけ必須です。
2. **Settings → Pages → Build and deployment → Source → GitHub Actions**を選択します。
3. Pagesが公開された後、本番と`/develop/`の両方を確認します。必要なら**Actions → Deploy to GitHub Pages → Run workflow**から再実行します。
4. `github-pages`環境は1つだけ使用します。公開ジョブは`main`上のワークフローで実行します。

基本権限は`contents: read`。価格収集のビルドジョブに`contents: write`、デプロイジョブに`pages: write`と`id-token: write`のみ許可します。

## 注意点

- `workflow_run`はデフォルトブランチにワークフローが存在する場合にのみ有効です。PRをマージする前は、開発プレビューへの自動配信は始まりません。
- プレビューは公開URLなので、秘密情報や非公開データを含めないでください。
- `main`が価格履歴を更新しても、`develop`の履歴ファイルは変更しません。次回の統合公開時に両方の価格スナップショットを更新します。
