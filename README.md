# 美南のツジ旅クイズ

美南向けに作った、iPad Safari で使えるオフライン対応 PWA クイズアプリです。初回読み込み後は、ホーム画面に追加して機内モードでも動かせます。

## 起動方法

```bash
npm install
npm run import-quiz
npm run dev
npm run test
npm run build
npm run preview
```

## Excel 更新後の再生成

1. `public/excel/ツジ旅クイズデータベース_90問.xlsx` を配置または上書きします。
2. 次を実行します。

```bash
npm run import-quiz
```

変換スクリプトは `scripts/convert-quiz-data.ts` にあり、`クイズDB` シートから `public/data/quizzes.json` を生成します。

## データ列の対応

- `問題ID` -> `id`
- `レベル` -> `level`
- `レベル名` -> `levelName`
- `テーマ` -> `theme`
- `カテゴリ` -> `category`
- `問題文` -> `question`
- `選択肢A-D` -> `choices.A-D`
- `正解` -> `correctAnswer`
- `正解文` -> `correctText`
- `解説` -> `explanation`
- `タグ` -> `tags`
- `出典タイトル` -> `sourceTitle`
- `出典URL` -> `sourceUrl`
- `配点` -> `points`
- `有効` -> `enabled`

## 変換時の検証

- 問題IDの重複
- 選択肢 A-D の欠損
- 正解が A-D か
- 配点が数値か
- 有効問題が各コース30問あるか
- 不正行の行番号と理由を表示

## iPad への導入方法

1. `npm run build` で `dist/` を生成します。
2. GitHub Pages / Cloudflare Pages / Netlify などへ `dist/` を公開します。
3. iPad の Safari で開きます。
4. 共有メニューから「ホーム画面に追加」を選びます。
5. 追加後に一度起動すると、以後はオフラインでも主要画面が動きます。

## オフライン動作の仕組み

- `manifest.webmanifest` でホーム画面追加に対応
- `public/sw.js` でアプリシェルと `data/quizzes.json` をキャッシュ
- 2回目以降は Service Worker のキャッシュから起動
- 更新版が公開されたら、次回オンライン時に更新を検知して通知

## 履歴保存の仕組み

- `localStorage` に保存
- キー:
  - `minami-tsujitabi-quiz-history`
  - `minami-tsujitabi-quiz-stats`
  - `minami-tsujitabi-quiz-settings`
- バージョン付き `{ version, data }` 形式
- 履歴は最新10件のみ保持
- 累計統計、ランク、取得表彰、問題別成績は別保存

## ランク判定

- ランク1: 初期状態
- ランク2: いずれか1コースに挑戦
- ランク3: 3コース挑戦 + いずれか1コース70点以上
- ランク4: 3コースすべて70点以上 + 累計30問回答
- ランク5: 判断力80点以上 + KL予習80点以上 + 累計正解60問以上
- ランク6: 3コースすべて90点以上 + 累計挑戦10回以上 + 累計正解80問以上

## テスト対象

- 各コース30問
- 有効問題のみ利用
- 10問重複なし
- 選択肢並び替え後も正解判定維持
- 得点計算
- 自己ベスト更新
- ランク判定
- 表彰判定

## 無料で公開する方法

おすすめは `GitHub Pages` です。2026年7月22日時点で、GitHub 公式ドキュメントでは `GitHub Free` の公開リポジトリで GitHub Pages が使え、GitHub Actions での公開も案内されています。静的サイト向けなら無料で十分使いやすいです。

参考:

- [What is GitHub Pages?](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [Configuring a publishing source for your GitHub Pages site](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

### GitHub Pages 公開手順

1. このプロジェクトを GitHub の `public repository` として作成します。
2. このフォルダの内容を GitHub に push します。
3. リポジトリの `Settings` → `Pages` を開きます。
4. `Build and deployment` の `Source` を `GitHub Actions` にします。
5. すでに追加してある `.github/workflows/deploy-github-pages.yml` が自動で動きます。
6. Actions が成功すると、GitHub Pages の公開 URL が発行されます。
7. iPad の Safari でその URL を開いて `ホーム画面に追加` を行います。

このプロジェクトには、GitHub Pages 向けのワークフローを同梱しています。

```text
.github/workflows/deploy-github-pages.yml
```

`master` または `main` への push で自動公開されます。

### 補足

- GitHub Pages の無料利用は、`GitHub Free` では公開リポジトリが前提です。
- 非公開リポジトリのまま無料公開したいなら、Cloudflare Pages も候補です。2026年7月22日時点で Cloudflare 公式には静的アセットの無料配信が案内されています。
- 今回は導入の簡単さを優先して GitHub Pages 前提にしています。

## オフライン確認手順

1. 一度オンラインでアプリを開く
2. 数秒待って Service Worker と JSON が取得されるのを待つ
3. Safari を閉じる
4. 機内モードにする
5. ホーム画面のアイコンから起動する
6. トップ、クイズ、履歴、成長、設定が動くことを確認する

## 現時点の注意

- この環境では添付 Excel 実体が見つからなかったため、`public/data/quizzes.json` には同仕様の 90 問サンプルデータを同梱しています。
- Excel を配置後に `npm run import-quiz` を実行すれば本番データへ差し替えできます。
