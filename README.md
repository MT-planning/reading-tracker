# リーディングトラッカー Reading Tracker

ウェブページに**読字ガイド**を重ねて表示する JavaScript ライブラリです。読んでいる行のまわりだけを帯状に残し、それ以外をマスクで覆います。帯はマウスや指の位置に合わせて動きます。

Chrome 拡張機能「[リーディングトラッカー](https://reading-tracker.app/)」と同じ機能を、**サイト運営者が自分のサイトに組み込めるようにしたもの**です。訪問者は拡張機能を入れなくても使えます。

> **English:** A drop-in reading guide for websites. It dims the page except for a band around the line being read, and the band follows the pointer or finger. Add one `<script>` tag to get a floating settings button. The UI is available in Japanese and English. MIT licensed.

## 特長

- `<script>` タグを1行追加するだけで、画面の隅に設定ボタンが表示されます
- 読む帯の高さ・色、マスクの色・濃さ、「文字くっきり」（乗算で重ねる）を調整できます
- 縦書きに対応しています（帯が左右方向に動きます）
- 帯を画面いっぱいに広げ、色付きの下敷きのように使えます
- ガイド表示中は、ページの**文字サイズ・行間・フォント**を変更できます（終了すると元に戻ります）
- 対応ブラウザでは、**インストール済みフォントの一覧**から選べます（UD フォントをおすすめとして先頭に表示）
- 設定はブラウザ内（localStorage）に保存されます。同じタブで別のページへ移動しても、ガイドは表示されたままです
- UI は Shadow DOM の中に描画するので、サイトの CSS と干渉しません
- 外部ライブラリには依存していません。ファイルサイズは約 40KB（gzip 圧縮時は約 13KB）です

## 使い方

### 1. script タグで読み込む（いちばん簡単）

`</body>` の直前に次の1行を追加します。

```html
<script src="https://cdn.jsdelivr.net/npm/@mt-planning/reading-tracker@0.1.1/dist/reading-tracker.min.js" data-auto-init></script>
```

オプションは `data-*` 属性で指定できます。

```html
<script
  src="https://cdn.jsdelivr.net/npm/@mt-planning/reading-tracker@0.1.1/dist/reading-tracker.min.js"
  data-auto-init
  data-position="bottom-left"
  data-content-selector="article"
  data-settings='{"gapPx": 96, "gapColor": "rgba(255, 230, 120, 0.3)"}'
></script>
```

JavaScript から初期化する場合は、`data-auto-init` を付けずに次のように書きます。

```html
<script src=".../reading-tracker.min.js"></script>
<script>
  ReadingTracker.init({ position: "bottom-left" });
</script>
```

### 2. npm からインストールする

```sh
npm install @mt-planning/reading-tracker
```

```js
import ReadingTracker from "@mt-planning/reading-tracker";

ReadingTracker.init({ lang: "ja" });
```

SSR 環境でも、読み込みの時点ではエラーになりません。`init()` はブラウザ上で呼んでください。

## オプション

| オプション | data 属性 | 既定値 | 説明 |
|---|---|---|---|
| `launcher` | `data-launcher` | `true` | 画面の隅に設定ボタンを表示します。`false` にした場合は、API（`openPanel()` など）から操作します |
| `position` | `data-position` | `"bottom-right"` | 設定ボタンの位置。`bottom-right` / `bottom-left` / `top-right` / `top-left` |
| `closeButton` | `data-close-button` | `true` | ガイド表示中、画面上部に「ガイドを終了」ボタンを表示します |
| `shortcuts` | `data-shortcuts` | `true` | キーボードショートカットを有効にします |
| `persist` | `data-persist` | `true` | 訪問者の設定を localStorage に保存します |
| `resume` | `data-resume` | `true` | 同じタブで別のページへ移動しても、ガイドを表示したままにします（sessionStorage） |
| `fontPicker` | `data-font-picker` | `true` | 対応ブラウザで、インストール済みフォントの一覧を表示します |
| `storageKey` | `data-storage-key` | `"reading-tracker"` | 保存に使うキーです |
| `contentSelector` | `data-content-selector` | `"body"` | 行間・フォントを適用する範囲です。本文だけに限定すると、レイアウトが崩れにくくなります（例：`"article, .entry-content"`） |
| `lang` | `data-lang` | `"auto"` | UI の言語。`"auto"` のときは `<html lang>` から判定します。`ja` / `en` |
| `settings` | `data-settings`（JSON） | — | サイトとしての初期設定です。訪問者が保存した設定のほうが優先されます |
| `messages` | — | — | UI の文言を上書きします（[src/i18n.js](src/i18n.js) のキーを指定）。文言はプレーンテキストとして扱われ、HTML は使えません |
| `zIndex` | `data-z-index` | `2147483646` | オーバーレイの z-index です |

### 設定項目（`settings` / `update()`）

| キー | 既定値 | 説明 |
|---|---|---|
| `gapPx` | `120` | 読む帯の高さ（縦書きのときは幅）。単位は px で、24〜400 の範囲です |
| `gapColor` | `"rgba(143, 184, 154, 0.25)"` | 読む帯の色 |
| `overlayColor` | `"rgba(15, 23, 42, 0.82)"` | マスクの色 |
| `blendMultiply` | `false` | 文字くっきり（ガイドを乗算で重ねます） |
| `verticalWriting` | `false` | 縦書きモード |
| `pageFontSizePercent` | `100` | 文字サイズ。`100` / `150` / `200` のいずれか |
| `pageLineHeightPercent` | `100` | 行間。`100` / `200` / `400` のいずれか |
| `pageFontFamily` | `""` | フォント名。空欄のときはサイトのフォントのままです |

## API

```js
ReadingTracker.init(options)      // 初期化（もう一度呼ぶと、新しいオプションで作り直します）
ReadingTracker.start()            // ガイドを表示
ReadingTracker.stop()             // ガイドを終了
ReadingTracker.toggle()
ReadingTracker.isActive()
ReadingTracker.setFitScreen(true) // 帯を画面いっぱいに広げる
ReadingTracker.toggleFitScreen()
ReadingTracker.update({ gapPx: 80, verticalWriting: true })  // 設定を変更（その場で反映し、保存）
ReadingTracker.getSettings()
ReadingTracker.reset()            // 訪問者が保存した設定を消し、初期値に戻す
ReadingTracker.openPanel() / closePanel() / togglePanel()
ReadingTracker.destroy()          // DOM とイベントをすべて取り除く

const off = ReadingTracker.on("start", () => { /* ... */ });
// イベント: start / stop / change / fitscreenchange / panelopen / panelclose
```

サイト独自のボタンからガイドを開く例：

```html
<button type="button" onclick="ReadingTracker.start()">読字ガイドを使う</button>
```

## ショートカット

| キー | 動作 |
|---|---|
| `Alt + Shift + G` | ガイドの表示／終了 |
| `Alt + Shift + F` | ガイドを画面いっぱいに広げる／戻す（ガイド表示中のみ） |
| `Esc` | 設定パネルを閉じる。パネルが閉じているときはガイドを終了 |

## 対応ブラウザ

Chrome / Edge / Firefox / Safari の最新版（PC・スマホ）を対象としています。現時点で動作を確認しているのは Chrome・Edge・Firefox です。Safari はまだ確認していません。

- インストール済みフォントの一覧は、Chromium 系ブラウザのデスクトップ版で、かつ HTTPS のページでのみ使えます。それ以外の環境では、フォント名を直接入力します
- 別ドメインの iframe（動画の埋め込みなど）の中の文字には、文字サイズ・行間・フォントの変更は適用されません

## ご注意

- 文字サイズ・行間・フォントの変更は、サイトのレイアウトによっては表示が崩れることがあります。`contentSelector` で本文だけに範囲を限定すると、崩れにくくなります
- 文字サイズは `<html>` の `font-size` を変更する方式です。`rem` や `em` で指定されている文字が大きくなります（`px` で固定されている文字は変わりません）

## プライバシー

このライブラリは、閲覧内容や個人情報を収集したり、外部に送信したりしません。設定は訪問者のブラウザ内（localStorage / sessionStorage）にだけ保存されます。Cookie は使用しません。

## 開発

```sh
npm install
npm run build   # dist/ を生成
npm run dev     # 変更を監視して再ビルド
```

`demo/index.html` は、ローカルサーバー経由で開いて確認してください（例：`npx http-server .` を実行し、`/demo/` を開く）。

| パス | 役割 |
|---|---|
| `src/index.js` | 公開 API と全体の制御 |
| `src/overlay.js` | マスク・読む帯の描画と、ページの文字スタイルの上書き |
| `src/ui.js` / `src/panel.css` | 設定パネル・設定ボタン・ガイド終了ボタン |
| `src/settings.js` | 設定値の既定値・正規化・保存 |
| `src/fonts.js` | インストール済みフォントの取得（Local Font Access API） |
| `src/i18n.js` | UI の文言（日本語 / 英語） |
| `src/browser.js` | `<script>` 版のエントリ（`window.ReadingTracker` の公開と `data-auto-init` の処理） |
| `types/index.d.ts` | TypeScript の型定義 |

## ライセンス

[MIT](LICENSE) © MT-planning, Ltd.
