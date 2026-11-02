import { DEFAULT_SETTINGS, normalizeSettings } from "./settings.js";

export const HOST_ATTR = "data-reading-tracker";
const PAGE_STYLE_ID = "reading-tracker-page-style";

const OVERLAY_CSS = [
  ":host{all:initial;position:fixed!important;inset:0!important;pointer-events:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;display:block!important}",
  ".rt-mask,.rt-gap{position:fixed;pointer-events:none;display:none}",
  ".rt-mask{background:var(--rt-color)}",
  ".rt-gap{background:var(--rt-gap-color)}",
].join("");

/** 本文になりやすい要素（詳細度を上げ、サイト側の指定より優先させる） */
const TEXT_TAGS =
  "p,li,td,th,dt,dd,blockquote,figcaption,article,section,main,aside,h1,h2,h3,h4,h5,h6,pre,code,label,a,span,div,em,strong,small,caption,summary,details,ul,ol,dl,table";

function buildFontFamilyCssValue(raw) {
  const s = String(raw || "").trim();
  if (!s || /[;{}<>\n\r]/.test(s)) return "";
  const parts = s
    .split(",")
    .map((part) => {
      const trimmed = part.trim().replace(/^["']|["']$/g, "");
      if (!trimmed || /[;{}<>\n\r]/.test(trimmed)) return "";
      return `"${trimmed.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
    })
    .filter(Boolean);
  if (!parts.length) return "";
  return `${parts.join(", ")}, system-ui, -apple-system, "Segoe UI", "Yu Gothic UI", "Hiragino Sans", Meiryo, sans-serif`;
}

/** 文字サイズ・行間・フォントを上書きする CSS（変更なしなら空文字） */
export function buildPageStyleCss(settings, contentSelector = "body") {
  const s = normalizeSettings(settings);
  const parts = [];

  if (s.pageFontSizePercent !== 100) {
    parts.push(`html{font-size:${s.pageFontSizePercent}%!important}`);
    parts.push(`body{font-size:100%!important}`);
  }

  const decl = [];
  if (s.pageLineHeightPercent !== 100) {
    decl.push(`line-height:${s.pageLineHeightPercent / 100}!important`);
  }
  const fontCss = buildFontFamilyCssValue(s.pageFontFamily);
  if (fontCss) decl.push(`font-family:${fontCss}!important`);

  if (decl.length) {
    const scope = `:is(${contentSelector || "body"})`;
    const not = `:not([${HOST_ATTR}])`;
    const selectors = [
      `${scope}`,
      `${scope} *${not}`,
      `${scope} *${not}::before`,
      `${scope} *${not}::after`,
      ...TEXT_TAGS.split(",").map((tag) => `${scope} ${tag}${not}`),
    ];
    parts.push(`${selectors.join(",")}{${decl.join(";")}}`);
  }

  return parts.join("");
}

/**
 * 読字ガイド本体。マスク（上下または左右）と読む帯を Shadow DOM 内に描画し、
 * ポインタやタッチの位置に追従させる。
 */
export class Overlay {
  /**
   * @param {{ contentSelector?: string, zIndex?: number, shouldIgnoreEvent?: (e: Event) => boolean }} opts
   */
  constructor(opts = {}) {
    this.contentSelector = opts.contentSelector || "body";
    this.zIndex = opts.zIndex;
    this.shouldIgnoreEvent = opts.shouldIgnoreEvent || (() => false);
    this.settings = { ...DEFAULT_SETTINGS };
    this.fitScreen = false;
    this.host = null;
    this.els = null;
    this.abort = null;
    this.raf = 0;
    this.x = 0;
    this.y = 0;
  }

  get mounted() {
    return !!this.host;
  }

  mount(settings, fitScreen) {
    this.unmount();
    this.settings = normalizeSettings(settings);
    this.fitScreen = !!fitScreen;
    this.x = window.innerWidth / 2;
    this.y = window.innerHeight / 2;

    const host = document.createElement("div");
    host.setAttribute(HOST_ATTR, "overlay");
    host.style.setProperty("z-index", String(this.zIndex), "important");
    const root = host.attachShadow({ mode: "open" });
    const style = document.createElement("style");
    style.textContent = OVERLAY_CSS;
    root.appendChild(style);

    const make = (cls) => {
      const el = document.createElement("div");
      el.className = cls;
      root.appendChild(el);
      return el;
    };
    this.els = {
      top: make("rt-mask rt-top"),
      bottom: make("rt-mask rt-bottom"),
      left: make("rt-mask rt-left"),
      right: make("rt-mask rt-right"),
      gap: make("rt-gap"),
    };

    (document.documentElement || document.body).appendChild(host);
    this.host = host;

    this.abort = new AbortController();
    const signal = this.abort.signal;
    const onPointer = (e) => {
      if (this.shouldIgnoreEvent(e)) return;
      this.moveTo(e.clientX, e.clientY);
    };
    const onTouch = (e) => {
      if (!e.touches || !e.touches.length || this.shouldIgnoreEvent(e)) return;
      this.moveTo(e.touches[0].clientX, e.touches[0].clientY);
    };
    window.addEventListener("resize", () => this.scheduleLayout(), { signal });
    document.addEventListener("pointermove", onPointer, { capture: true, passive: true, signal });
    document.addEventListener("pointerdown", onPointer, { capture: true, passive: true, signal });
    document.addEventListener("touchmove", onTouch, { capture: true, passive: true, signal });

    this.applyAppearance();
    this.applyPageStyle();
    this.layout();
  }

  unmount() {
    try {
      this.abort?.abort();
    } catch (_) {}
    this.abort = null;
    cancelAnimationFrame(this.raf);
    this.host?.remove();
    this.host = null;
    this.els = null;
    this.removePageStyle();
  }

  update(settings) {
    this.settings = normalizeSettings(settings);
    if (!this.mounted) return;
    this.applyAppearance();
    this.applyPageStyle();
    this.scheduleLayout();
  }

  setFitScreen(on) {
    this.fitScreen = !!on;
    if (this.mounted) this.scheduleLayout();
  }

  moveTo(x, y) {
    this.x = x;
    this.y = y;
    this.scheduleLayout();
  }

  applyAppearance() {
    if (!this.host) return;
    this.host.style.setProperty("--rt-color", this.settings.overlayColor);
    this.host.style.setProperty("--rt-gap-color", this.settings.gapColor);
    // ホスト要素ごと乗算で重ねる（ページと混ざるのはホストの stacking context 単位のため）
    this.host.style.setProperty(
      "mix-blend-mode",
      this.settings.blendMultiply ? "multiply" : "normal",
      "important"
    );
  }

  applyPageStyle() {
    const css = buildPageStyleCss(this.settings, this.contentSelector);
    if (!css) {
      this.removePageStyle();
      return;
    }
    let style = document.getElementById(PAGE_STYLE_ID);
    if (!style) {
      style = document.createElement("style");
      style.id = PAGE_STYLE_ID;
      style.setAttribute(HOST_ATTR, "page-style");
      (document.head || document.documentElement).appendChild(style);
    }
    if (style.textContent !== css) style.textContent = css;
  }

  removePageStyle() {
    document.querySelectorAll(`#${PAGE_STYLE_ID}`).forEach((el) => el.remove());
  }

  scheduleLayout() {
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(() => this.layout());
  }

  layout() {
    if (!this.els) return;
    const { top, bottom, left, right, gap } = this.els;
    // innerWidth/Height はスクロールバーを含み、はみ出して横スクロールが出るため表示領域の寸法を使う
    const docEl = document.documentElement;
    const vw = Math.min(window.innerWidth, docEl.clientWidth || window.innerWidth);
    const vh = Math.min(window.innerHeight, docEl.clientHeight || window.innerHeight);
    const vertical = this.settings.verticalWriting;
    const half = this.settings.gapPx / 2;
    const clamp = (v, max) => Math.max(0, Math.min(max, v));
    // Fit Screen はポインタ位置によらず画面全体を帯にする
    const span = (pos, max) => (this.fitScreen ? [0, max] : [clamp(pos - half, max), clamp(pos + half, max)]);
    const place = (el, l, t, w, h) => {
      el.style.cssText = `display:block;left:${l}px;top:${t}px;width:${Math.max(0, w)}px;height:${Math.max(0, h)}px`;
    };
    const hide = (el) => {
      el.style.display = "none";
    };

    if (vertical) {
      const [start, end] = span(this.x, vw);
      place(left, 0, 0, start, vh);
      place(right, end, 0, vw - end, vh);
      place(gap, start, 0, end - start, vh);
      hide(top);
      hide(bottom);
    } else {
      const [start, end] = span(this.y, vh);
      place(top, 0, 0, vw, start);
      place(bottom, 0, end, vw, vh - end);
      place(gap, 0, start, vw, end - start);
      hide(left);
      hide(right);
    }
  }
}
