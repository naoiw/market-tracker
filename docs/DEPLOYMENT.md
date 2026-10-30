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
3. `main`へのpushでは価格取得を1回試みたうえで公開ワークフローを実行します。取得元がすべて失敗した場合もpushによるサイトの再公開は継続します。`workflow_dispatch`による手動実行は`main`から行います。
4. 公開時は`main`と`develop`を再検証してビルドし、ルートと`develop/`に配置した**1つのPagesアーティファクト**を配信します。
5. 開発プレビューは`vite build --base=/market-tracker/develop/`でビルドし、アセットと価格JSONの参照先を正しく解決します。
6. データ取得は`main`へのpush・定期実行・取得を有効にした手動実行時のみ、`main`側で行います。`develop`の検証成功に伴うプレビュー更新は取得しません。定期実行で新しい価格がないときはデプロイをスキップします。

## 定期データ更新

- `17 * * * *`（UTC）で毎時17分に起動を試みます。日本時間（JST）でも毎時17分です。UTCとJSTの時差は時間単位なので、毎時実行の分指定は同じです。
- GitHub Actionsの`scheduled`トリガーは遅延・欠落し得るため、厳密に1時間ごとの起動は保証されません。
- `main`へのpushでも取得を試みるため、本番反映直後の初回取得を定期実行まで待つ必要はありません。
- ECBの為替レートは日次参考値なので、1時間ごとの実行でも値が変わらないことがあります。
- BTC/JPY・ETH/JPYは同じ定期実行でbitbank公式の公開APIを呼び出します（キー不要）。取得時点の最終約定値を1時間単位に丸めて保存します。
- 価格が更新された場合だけ`github-actions[bot]`が`main`の`public/data/prices.json`へコミットします。
- botのコミットでは別のpushワークフローは起動しないため、収集ジョブ内でPagesのビルド・公開まで行います。
- ビルド時に`main`から現在の価格JSONを`develop`側にコピーし、どちらの画面でも同じ公開価格を表示します。

## 取得の確認・手動実行

- **Actions → Deploy to GitHub Pages**で実行履歴を開き、イベントが`schedule`か`push`かを確認します。
- 実行詳細の`Collect current prices`ステップが取得処理、`Report collection attempt`ステップとジョブサマリーが結果の確認箇所です。`workflow_run`（開発プレビュー更新）では収集ステップを実行しません。
- 本番価格履歴は`main`の`public/data/prices.json`に保存されます。`updatedAt`は**最後にファイルが更新された時刻**であり、最後の取得試行時刻ではありません。
- すぐに取得を試す場合は、**Actions → Deploy to GitHub Pages → Run workflow**で`main`を選び、`collect: true`で実行します。実行成功後は価格JSONに対象銘柄が追加されたか確認してください。
- `schedule`イベント自体が表示されない場合は、取得プログラムのエラーより前段階（GitHubのスケジューラー・ワークフロー登録）の問題です。

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
