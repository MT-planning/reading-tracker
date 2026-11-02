import PANEL_CSS from "./panel.css";
import { HOST_ATTR } from "./overlay.js";
import {
  GAP_MAX,
  GAP_MIN,
  FONT_SCALE_PERCENTS,
  LINE_SCALE_PERCENTS,
  buildRgba,
  parseRgbaColor,
} from "./settings.js";
import { loadLocalFonts, supportsLocalFonts } from "./fonts.js";

const POSITIONS = ["bottom-right", "bottom-left", "top-right", "top-left"];

const ICONS = {
  launcher:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="8.5" width="19" height="7" rx="2" fill="currentColor" opacity=".35"/><path d="M5 5h14M5 12h14M5 19h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  play: '<svg class="rt-icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>',
  stop: '<svg class="rt-icon-stop" viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/></svg>',
  fit: '<svg class="rt-icon-fit" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  fitExit:
    '<svg class="rt-icon-fit-exit" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M20 15h-5v5M4 15h5v5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

const FONT_GLYPH_PX = { 100: 14, 150: 20, 200: 26 };
const LINE_GAP_PX = { 100: 3, 200: 6, 400: 8 };

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

function debounce(fn, ms) {
  let id = 0;
  const wrapped = (...args) => {
    clearTimeout(id);
    id = setTimeout(() => fn(...args), ms);
  };
  wrapped.cancel = () => clearTimeout(id);
  return wrapped;
}

/**
 * ランチャーボタン・設定パネル・ガイド終了ボタン。
 * 操作はすべて controller（index.js）経由で反映する。
 */
export class Ui {
  /**
   * @param {object} controller
   * @param {{ messages: Record<string,string>, position: string, launcher: boolean, closeButton: boolean,
   *   shortcuts: boolean, fontPicker: boolean, zIndex: number }} opts
   */
  constructor(controller, opts) {
    this.c = controller;
    this.opts = opts;
    this.t = opts.messages;
    this.host = null;
    this.root = null;
    this.fonts = null;
    this.open = false;
  }

  mount() {
    const t = this.t;
    const pos = POSITIONS.includes(this.opts.position) ? this.opts.position : "bottom-right";
    const host = document.createElement("div");
    host.setAttribute(HOST_ATTR, "ui");
    host.style.setProperty("z-index", String(this.opts.zIndex + 1), "important");
    const root = host.attachShadow({ mode: "open" });

    const fontScaleButtons = FONT_SCALE_PERCENTS.map(
      (p) =>
        `<button type="button" data-font-scale="${p}" aria-label="${p === 100 ? t.scaleNormal : `${p / 100}x`}" aria-pressed="false"><span class="rt-glyph-a" style="font-size:${FONT_GLYPH_PX[p]}px">A</span></button>`
    ).join("");
    const lineScaleButtons = LINE_SCALE_PERCENTS.map(
      (p) =>
        `<button type="button" data-line-scale="${p}" aria-label="${p === 100 ? t.scaleNormal : `${p / 100}x`}" aria-pressed="false"><span class="rt-lines" style="gap:${LINE_GAP_PX[p]}px"><span></span><span></span><span></span></span></button>`
    ).join("");
    const showFontPicker = this.opts.fontPicker && supportsLocalFonts();

    root.innerHTML = `
<style>${PANEL_CSS}</style>
<div class="rt-ui pos-${pos}${this.opts.launcher ? "" : " no-launcher"}">
  ${this.opts.launcher ? `<button type="button" class="rt-launcher" data-el="launcher" aria-label="${t.launcher}" aria-expanded="false" aria-controls="rt-panel">${ICONS.launcher}</button>` : ""}
  ${this.opts.closeButton ? `<button type="button" class="rt-close-guide" data-el="closeGuide" hidden>${t.closeGuide}</button>` : ""}
  <section class="rt-panel" id="rt-panel" data-el="panel" role="dialog" aria-label="${t.panelTitle}" hidden>
    <header class="rt-head">
      <div class="rt-head-row">
        <h2 class="rt-title">${t.panelTitle}</h2>
        <button type="button" class="rt-icon-btn" data-el="closePanel" aria-label="${t.closePanel}">${ICONS.close}</button>
      </div>
      <div class="rt-run" role="group">
        <button type="button" class="rt-run-main" data-el="run">${ICONS.play}${ICONS.stop}<span data-el="runLabel">${t.start}</span></button>
        <button type="button" class="rt-run-fit" data-el="fit" aria-pressed="false" aria-label="${t.fitOn}" title="${t.fitOn}">${ICONS.fit}${ICONS.fitExit}</button>
      </div>
    </header>
    <div class="rt-body">
      <div class="rt-card">
        <div class="rt-section">
          <span class="rt-label" data-el="gapLabel">${t.gap}</span>
          <div class="rt-row">
            <input type="range" class="rt-slider" data-el="gapPx" min="${GAP_MIN}" max="${GAP_MAX}" step="2" aria-label="${t.gap}">
            <output class="rt-chip" data-el="gapPxOut"></output>
          </div>
          <div class="rt-row">
            <input type="color" class="rt-color" data-el="gapHex" aria-label="${t.gap}">
            <div class="rt-alpha">
              <span class="rt-label">${t.opacity}</span>
              <div class="rt-row">
                <input type="range" class="rt-slider" data-el="gapAlpha" min="0" max="100" aria-label="${t.opacity}">
                <output class="rt-chip" data-el="gapAlphaOut"></output>
              </div>
            </div>
          </div>
        </div>
        <div class="rt-section">
          <span class="rt-label">${t.mask}</span>
          <div class="rt-row">
            <input type="color" class="rt-color" data-el="maskHex" aria-label="${t.mask}">
            <div class="rt-alpha">
              <span class="rt-label">${t.opacity}</span>
              <div class="rt-row">
                <input type="range" class="rt-slider" data-el="maskAlpha" min="0" max="100" aria-label="${t.opacity}">
                <output class="rt-chip" data-el="maskAlphaOut"></output>
              </div>
            </div>
          </div>
        </div>
        <div class="rt-section">
          <div class="rt-row rt-between">
            <span class="rt-label" style="margin:0">${t.blend}</span>
            <label class="rt-switch"><input type="checkbox" data-el="blend" aria-label="${t.blend}"><span class="rt-track"><span class="rt-thumb"></span></span></label>
          </div>
        </div>
        <div class="rt-section">
          <span class="rt-label">${t.writing}</span>
          <div class="rt-row">
            <span class="rt-toggle-label" data-el="labelH">${t.horizontal}</span>
            <label class="rt-switch"><input type="checkbox" data-el="vertical" aria-label="${t.writing}: ${t.vertical}"><span class="rt-track"><span class="rt-thumb"></span></span></label>
            <span class="rt-toggle-label rt-toggle-label--end" data-el="labelV">${t.vertical}</span>
          </div>
        </div>
      </div>
      <div class="rt-card">
        <div class="rt-section">
          <span class="rt-label">${t.fontSize}</span>
          <div class="rt-scale" role="group" aria-label="${t.fontSize}">${fontScaleButtons}</div>
        </div>
        <div class="rt-section">
          <span class="rt-label">${t.lineHeight}</span>
          <div class="rt-scale" role="group" aria-label="${t.lineHeight}">${lineScaleButtons}</div>
          <p class="rt-note">${t.layoutNote}</p>
        </div>
        <div class="rt-section">
          <span class="rt-label">${t.font}</span>
          <input type="text" class="rt-field" data-el="font" placeholder="${t.fontPlaceholder}" spellcheck="false" autocomplete="off" aria-label="${t.font}">
          ${showFontPicker ? `<button type="button" class="rt-text-btn" data-el="loadFonts">${t.loadFonts}</button><div class="rt-fonts" data-el="fonts" hidden></div>` : ""}
        </div>
      </div>
    </div>
    <footer class="rt-foot">
      ${this.opts.shortcuts ? `<p>${t.shortcuts}:</p><p><span class="rt-kbd">Alt + Shift + G</span> ${t.shortcutGuide}</p><p><span class="rt-kbd">Alt + Shift + F</span> ${t.shortcutFit}</p><p><span class="rt-kbd">Esc</span> ${t.shortcutEsc}</p>` : ""}
      <button type="button" class="rt-link-btn" data-el="reset">${t.reset}</button>
    </footer>
  </section>
</div>`;

    this.host = host;
    this.root = root;
    this.el = {};
    root.querySelectorAll("[data-el]").forEach((node) => {
      this.el[node.getAttribute("data-el")] = node;
    });
    this.wrapper = root.querySelector(".rt-ui");

    (document.documentElement || document.body).appendChild(host);
    this.wire();
    this.render();
  }

  unmount() {
    this.fontInputDebounced?.cancel();
    this.fontListEl = null;
    this.host?.remove();
    this.host = null;
    this.root = null;
    this.el = {};
    this.open = false;
  }

  /** このイベントが UI（パネル等）の上で発生したか */
  contains(e) {
    if (!this.host) return false;
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    return path.includes(this.host);
  }

  setOpen(open) {
    if (!this.el.panel) return;
    this.open = !!open;
    this.el.panel.hidden = !this.open;
    this.wrapper.classList.toggle("is-panel-open", this.open);
    this.el.launcher?.setAttribute("aria-expanded", this.open ? "true" : "false");
    if (this.open) {
      this.render();
      this.el.run.focus({ preventScroll: true });
    } else if (this.el.launcher && this.root.activeElement) {
      this.el.launcher.focus({ preventScroll: true });
    }
  }

  wire() {
    const { el, c } = this;
    const change = (patch) => c.update(patch);

    el.launcher?.addEventListener("click", () => c.togglePanel());
    el.closePanel.addEventListener("click", () => c.closePanel());
    el.closeGuide?.addEventListener("click", () => c.stop());
    el.run.addEventListener("click", () => c.toggle());
    el.fit.addEventListener("click", () => c.toggleFitScreen());
    el.reset.addEventListener("click", () => c.reset());

    el.gapPx.addEventListener("input", () => {
      el.gapPxOut.textContent = el.gapPx.value;
      if (c.isFitScreen()) c.setFitScreen(false);
      change({ gapPx: Number(el.gapPx.value) });
    });
    const color = (hexEl, alphaEl, outEl, key) => {
      const apply = () => {
        outEl.textContent = `${alphaEl.value}%`;
        change({ [key]: buildRgba(hexEl.value, Number(alphaEl.value)) });
      };
      hexEl.addEventListener("input", apply);
      alphaEl.addEventListener("input", apply);
    };
    color(el.gapHex, el.gapAlpha, el.gapAlphaOut, "gapColor");
    color(el.maskHex, el.maskAlpha, el.maskAlphaOut, "overlayColor");

    el.blend.addEventListener("change", () => change({ blendMultiply: el.blend.checked }));
    el.vertical.addEventListener("change", () => change({ verticalWriting: el.vertical.checked }));

    this.root.querySelectorAll("[data-font-scale]").forEach((btn) => {
      btn.addEventListener("click", () =>
        change({ pageFontSizePercent: Number(btn.getAttribute("data-font-scale")) })
      );
    });
    this.root.querySelectorAll("[data-line-scale]").forEach((btn) => {
      btn.addEventListener("click", () =>
        change({ pageLineHeightPercent: Number(btn.getAttribute("data-line-scale")) })
      );
    });

    this.fontInputDebounced = debounce(() => change({ pageFontFamily: el.font.value.trim() }), 250);
    el.font.addEventListener("input", this.fontInputDebounced);

    el.loadFonts?.addEventListener("click", () => this.showFontList());

    // パネル内のキー入力をページ側のショートカットに渡さない（Esc を除く）
    el.panel.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") e.stopPropagation();
    });
  }

  /** 現在の設定と状態を UI に反映する */
  render() {
    if (!this.root) return;
    const { el, t } = this;
    const s = this.c.getSettings();
    const active = this.c.isActive();
    const fit = this.c.isFitScreen();

    this.wrapper.classList.toggle("is-active", active);
    el.runLabel.textContent = active ? t.stop : t.start;
    if (el.closeGuide) el.closeGuide.hidden = !active;
    el.fit.setAttribute("aria-pressed", fit ? "true" : "false");
    el.fit.setAttribute("aria-label", fit ? t.fitOff : t.fitOn);
    el.fit.title = fit ? t.fitOff : t.fitOn;

    el.gapLabel.textContent = s.verticalWriting ? t.gapVertical : t.gap;
    el.gapPx.value = String(s.gapPx);
    el.gapPxOut.textContent = String(s.gapPx);

    const gap = parseRgbaColor(s.gapColor, "#8fb89a", 25);
    el.gapHex.value = gap.hex;
    el.gapAlpha.value = String(gap.alphaPercent);
    el.gapAlphaOut.textContent = `${gap.alphaPercent}%`;
    const mask = parseRgbaColor(s.overlayColor, "#0f172a", 82);
    el.maskHex.value = mask.hex;
    el.maskAlpha.value = String(mask.alphaPercent);
    el.maskAlphaOut.textContent = `${mask.alphaPercent}%`;

    el.blend.checked = s.blendMultiply;
    el.vertical.checked = s.verticalWriting;
    el.labelH.classList.toggle("is-on", !s.verticalWriting);
    el.labelV.classList.toggle("is-on", s.verticalWriting);

    this.root.querySelectorAll("[data-font-scale]").forEach((btn) => {
      const on = Number(btn.getAttribute("data-font-scale")) === s.pageFontSizePercent;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    this.root.querySelectorAll("[data-line-scale]").forEach((btn) => {
      const on = Number(btn.getAttribute("data-line-scale")) === s.pageLineHeightPercent;
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });

    if (this.root.activeElement !== el.font && el.font.value.trim() !== s.pageFontFamily) {
      el.font.value = s.pageFontFamily;
    }
    this.markSelectedFont(s.pageFontFamily);
  }

  async showFontList() {
    const { el, t } = this;
    if (!el.fonts) return;
    el.fonts.hidden = false;

    if (!this.fonts) {
      el.loadFonts.disabled = true;
      el.fonts.innerHTML = `<p class="rt-status">${t.loadingFonts}</p>`;
      try {
        this.fonts = await loadLocalFonts();
      } catch (_) {
        this.fonts = null;
        el.fonts.innerHTML = `<p class="rt-status is-error">${t.fontsFailed}</p>`;
        el.loadFonts.disabled = false;
        return;
      }
      el.loadFonts.disabled = false;
      if (!this.root) return;
      if (!this.fonts.length) {
        el.fonts.innerHTML = `<p class="rt-status is-error">${t.fontsEmpty}</p>`;
        this.fonts = null;
        return;
      }
    }

    el.loadFonts.hidden = true;
    el.fonts.innerHTML = `<input type="search" class="rt-field" data-role="filter" placeholder="${t.fontFilter}" aria-label="${t.fontFilter}" autocomplete="off"><ul class="rt-font-list" role="listbox" aria-label="${t.font}" tabindex="0"></ul>`;
    const filter = el.fonts.querySelector("[data-role=filter]");
    const list = el.fonts.querySelector("ul");
    this.fontListEl = list;

    const draw = () => {
      const q = filter.value.trim().toLowerCase();
      const match = (f) => !q || f.name.toLowerCase().includes(q) || f.label.toLowerCase().includes(q);
      const rec = this.fonts.filter((f) => f.recommended && match(f));
      const all = this.fonts.filter(match);
      const item = (f) =>
        `<li class="rt-font-item" role="option" aria-selected="false" data-font="${escapeHtml(f.name)}" style="font-family:&quot;${escapeHtml(f.name.replace(/"/g, ""))}&quot;,sans-serif">${escapeHtml(f.label)}</li>`;
      list.innerHTML = [
        !q ? `<li class="rt-font-item" role="option" aria-selected="false" data-font="">${t.fontDefault}</li>` : "",
        rec.length ? `<li class="rt-font-group" role="presentation">${t.fontRecommended}</li>${rec.map(item).join("")}` : "",
        all.length ? `<li class="rt-font-group" role="presentation">${t.fontAll}</li>${all.map(item).join("")}` : "",
      ].join("");
      this.markSelectedFont(this.c.getSettings().pageFontFamily);
    };
    filter.addEventListener("input", draw);
    list.addEventListener("click", (e) => {
      const li = e.target.closest?.("[data-font]");
      if (!li) return;
      const name = li.getAttribute("data-font");
      el.font.value = name;
      this.c.update({ pageFontFamily: name });
    });
    draw();
    filter.focus({ preventScroll: true });
  }

  markSelectedFont(name) {
    if (!this.fontListEl) return;
    this.fontListEl.querySelectorAll("[data-font]").forEach((li) => {
      li.setAttribute("aria-selected", li.getAttribute("data-font") === name ? "true" : "false");
    });
  }
}
