export interface ReadingTrackerSettings {
  /** 読む帯の高さ（縦書き時は幅）px。24〜400 */
  gapPx: number;
  /** 読む帯の色（CSS の色。rgba 推奨） */
  gapColor: string;
  /** マスクの色（CSS の色。rgba 推奨） */
  overlayColor: string;
  /** 「文字くっきり」：ガイドを乗算（mix-blend-mode: multiply）で重ねる */
  blendMultiply: boolean;
  /** 縦書きモード（帯が左右方向に追従） */
  verticalWriting: boolean;
  /** ページの文字サイズ。100 / 150 / 200 */
  pageFontSizePercent: 100 | 150 | 200;
  /** ページの行間。100 / 200 / 400 */
  pageLineHeightPercent: 100 | 200 | 400;
  /** ページに適用するフォント名（カンマ区切り可）。空ならサイトのまま */
  pageFontFamily: string;
}

export type LauncherPosition = "bottom-right" | "bottom-left" | "top-right" | "top-left";

export interface ReadingTrackerOptions {
  /** 画面の隅に設定パネルを開くボタンを出す。既定 true */
  launcher?: boolean;
  /** ランチャーとパネルの位置。既定 "bottom-right" */
  position?: LauncherPosition;
  /** ガイド表示中、画面上部に「ガイドを終了」ボタンを出す。既定 true */
  closeButton?: boolean;
  /** Alt+Shift+G / Alt+Shift+F のショートカットを有効にする。既定 true */
  shortcuts?: boolean;
  /** 利用者の設定を localStorage に保存する。既定 true */
  persist?: boolean;
  /** 同じタブ内で別ページへ移動してもガイドを引き継ぐ（sessionStorage）。既定 true */
  resume?: boolean;
  /** 対応ブラウザでインストール済みフォントの一覧を出す。既定 true */
  fontPicker?: boolean;
  /** 保存に使うキー。既定 "reading-tracker" */
  storageKey?: string;
  /** 行間・フォントを適用する範囲（CSS セレクタ）。既定 "body" */
  contentSelector?: string;
  /** UI の言語。"auto" は <html lang> から判定。既定 "auto" */
  lang?: "auto" | "ja" | "en";
  /** UI 文言の上書き */
  messages?: Record<string, string>;
  /** サイトとしての初期設定（利用者が保存した設定が優先される） */
  settings?: Partial<ReadingTrackerSettings>;
  /** オーバーレイの z-index。既定 2147483646 */
  zIndex?: number;
}

export interface ReadingTrackerEvents {
  start: void;
  stop: void;
  change: ReadingTrackerSettings;
  fitscreenchange: boolean;
  panelopen: void;
  panelclose: void;
}

export interface ReadingTracker {
  readonly version: string;
  readonly DEFAULT_SETTINGS: Readonly<ReadingTrackerSettings>;
  init(options?: ReadingTrackerOptions): ReadingTracker;
  start(): ReadingTracker;
  stop(): ReadingTracker;
  toggle(): ReadingTracker;
  isActive(): boolean;
  setFitScreen(on: boolean): ReadingTracker;
  toggleFitScreen(): ReadingTracker;
  isFitScreen(): boolean;
  update(patch: Partial<ReadingTrackerSettings>): ReadingTracker;
  getSettings(): ReadingTrackerSettings;
  reset(): ReadingTracker;
  openPanel(): ReadingTracker;
  closePanel(): ReadingTracker;
  togglePanel(): ReadingTracker;
  destroy(): ReadingTracker;
  on<K extends keyof ReadingTrackerEvents>(type: K, listener: (detail: ReadingTrackerEvents[K]) => void): () => void;
  off<K extends keyof ReadingTrackerEvents>(type: K, listener: (detail: ReadingTrackerEvents[K]) => void): ReadingTracker;
}

export const DEFAULT_SETTINGS: Readonly<ReadingTrackerSettings>;
export const VERSION: string;

declare const tracker: ReadingTracker;
export default tracker;

declare global {
  interface Window {
    ReadingTracker: ReadingTracker;
  }
}
