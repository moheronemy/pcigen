# pcigen — 旧裏カードジェネレーター

旧裏（初代・★neo・e）ポケモンカード風の画像をブラウザで作るツールです。

> 非公式のファンメイドツールです。株式会社ポケモン・任天堂・クリーチャーズ・ゲームフリークとは関係ありません。

## できること

- シリーズ（初代 / ★neo / e）とカードの種類（たね・1進化・2進化・トレーナー）の切り替え
- カード名・HP・LV・進化元・タイプ、わざ（最大2つ、エネルギー最大4個）
- 弱点・抵抗力・にげる・ずかん・種類/たかさ/おもさ
- イラストレーター・著作権表示・ナンバリング・レアリティ
- イラストと進化前ポケモンの画像（プレビュー上でドラッグして移動、ホイールで拡大縮小）
- PNG で保存（400×560 / 800×1120）
- キラ加工（渦巻き・コスモ・虹色ストライプ。イラストだけ／イラスト以外／カード全体）。プレビューではマウスに合わせてカードが傾き、光り方が動く
- プレビューをダブルクリック（または「うらを見る」ボタン）でカードを裏返す
- 入力内容の自動保存（ブラウザの localStorage）と、JSON の書き出し・読み込み
- ポケモン名の入力補完（第1〜第2世代）

## 開発

Node.js 22 以上が必要です。

```sh
npm install
npm run dev        # 開発サーバー（http://localhost:5173）
npm run build      # dist/ に本番用ファイルを出力
npm run preview    # ビルド結果の確認
```

チェック：

```sh
npm run lint          # ESLint
npm run format        # Prettier で整形（確認だけなら format:check）
npm run typecheck     # TypeScript
npm test              # ユニットテスト（Vitest）
npm run test:e2e      # E2E テスト（Playwright。ビルドしてから実行する）
```

## 構成

```
src/
  model/card.ts        カードのデータ型、初期値、保存データの読み込み（parseCard）
  layout/layout.ts     シリーズ・種類ごとの配置（座標）と使う素材画像
  render/
    renderCard.ts      Canvas への描画（DOM に依存しない関数）
    holo.ts            キラ加工の模様と重ね方
    text.ts            禁則処理つきの折り返し
    assets.ts          素材画像の読み込み
    fonts.ts           Web フォント（Noto Sans JP）の読み込み
    draw.ts            素材を読み込んでから描く・PNG に書き出す
  state/               入力内容の更新（reducer）と保存
  ui/                  画面の部品（React）
  assets/card/         カードの素材画像
assets-src/            素材の元画像（アプリからは使っていない）
e2e/                   Playwright のテスト
```

### 配置を調整するには

文字やアイコンの位置は `src/layout/layout.ts` の数値（400×560px のカード座標）で決まっています。
素材画像から測った値なので、見た目を直したいときはここを変更してください。

### 素材画像

`src/assets/card/` に置いた画像はファイル名（拡張子なし）で参照します。

| ファイル                                           | 用途                                     |
| -------------------------------------------------- | ---------------------------------------- |
| `pcard1〜7.png`                                    | 初代の枠（無・草・炎・水・雷・超・闘）   |
| `pcardneo1〜9.png` / `pcarde1〜9.png`              | ★neo / e の枠（悪・鋼を含む）            |
| `pcardtrainer.png` / `pcardtrainere.png`           | トレーナーの枠（初代・neo 共通 / e）     |
| `stage1/2.png`, `stageneo1/2.png`, `stagee1/2.png` | 進化マーク                               |
| `resistance.png`                                   | 初代の「抵抗力 ダメージ」の文字          |
| `pcardback.jpg`                                    | カードの裏面（プレビューの裏返し用）     |
| `sprite.png`                                       | エネルギーアイコン（28px、タイプ順に縦） |
| `type_sprite.png` / `button_sprite.png`            | 入力画面のタイプアイコン・ボタン         |

> `stagee1.png` は現在 `stagee2.png` と同じ画像です（e の 1進化マークは作り直し予定）。

## 公開

`main` に push すると GitHub Actions で GitHub Pages にデプロイされます。
初回だけ、リポジトリの Settings → Pages → Build and deployment の Source を「GitHub Actions」にしてください。
