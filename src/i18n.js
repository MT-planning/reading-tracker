const MESSAGES = {
  ja: {
    launcher: "読字ガイドの設定を開く",
    panelTitle: "リーディングトラッカー",
    closePanel: "設定を閉じる",
    start: "ガイドを表示",
    stop: "ガイドを終了",
    fitOn: "ガイドを画面いっぱいに広げる",
    fitOff: "ガイドの幅を戻す",
    closeGuide: "✕ ガイドを終了",
    gap: "ガイドの高さ(px)と色",
    gapVertical: "ガイドの幅(px)と色",
    mask: "マスクの色",
    opacity: "不透明度",
    blend: "文字くっきり",
    writing: "組み方向",
    horizontal: "横書き",
    vertical: "縦書き",
    fontSize: "文字サイズ",
    lineHeight: "行間",
    layoutNote: "※サイトによっては崩れる場合があります。",
    font: "フォント",
    fontPlaceholder: "例: BIZ UDPGothic",
    loadFonts: "インストール済みフォントから選ぶ",
    loadingFonts: "フォントを読み込んでいます…（許可を求められたら「許可」を選んでください）",
    fontsFailed: "フォント一覧を取得できませんでした。フォント名を入力してください。",
    fontsEmpty: "取得できたフォントがありません。",
    fontFilter: "フォントを絞り込む",
    fontRecommended: "おすすめ（UD フォント）",
    fontAll: "すべてのフォント",
    fontDefault: "（サイトのフォントのまま）",
    reset: "設定を初期値に戻す",
    shortcuts: "ショートカット",
    shortcutGuide: "ガイドの表示／終了",
    shortcutFit: "ガイドを広げる／戻す",
    shortcutEsc: "ガイドを終了",
    scaleNormal: "1x（標準）",
  },
  en: {
    launcher: "Open reading guide settings",
    panelTitle: "Reading Tracker",
    closePanel: "Close settings",
    start: "Show guide",
    stop: "Hide guide",
    fitOn: "Expand guide to full screen",
    fitOff: "Restore guide size",
    closeGuide: "✕ Hide guide",
    gap: "Guide height (px) and color",
    gapVertical: "Guide width (px) and color",
    mask: "Mask color",
    opacity: "Opacity",
    blend: "Sharper text",
    writing: "Writing mode",
    horizontal: "Horizontal",
    vertical: "Vertical",
    fontSize: "Text size",
    lineHeight: "Line spacing",
    layoutNote: "* Some sites may not display correctly.",
    font: "Font",
    fontPlaceholder: "e.g. Verdana",
    loadFonts: "Choose from installed fonts",
    loadingFonts: "Loading fonts… (allow access if your browser asks)",
    fontsFailed: "Could not load the font list. Please type a font name.",
    fontsEmpty: "No fonts were found.",
    fontFilter: "Filter fonts",
    fontRecommended: "Recommended (UD fonts)",
    fontAll: "All fonts",
    fontDefault: "(Use the site's font)",
    reset: "Reset to defaults",
    shortcuts: "Shortcuts",
    shortcutGuide: "Show / hide guide",
    shortcutFit: "Expand / restore guide",
    shortcutEsc: "Hide guide",
    scaleNormal: "1x (default)",
  },
};

export function resolveLang(lang) {
  let l = lang;
  if (!l || l === "auto") {
    l = (document.documentElement.lang || navigator.language || "en").toLowerCase();
  }
  return String(l).toLowerCase().startsWith("ja") ? "ja" : "en";
}

/** @param {string} lang @param {Record<string, string>} [overrides] */
export function getMessages(lang, overrides) {
  return { ...MESSAGES[resolveLang(lang)], ...(overrides || {}) };
}
