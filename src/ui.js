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
  // img/icon.svg から Illustrator の書き出し情報を除いたもの
  launcher:
    '<svg viewBox="0 0 256 256" aria-hidden="true"><rect width="256" height="256" rx="50" fill="#1a1a1a"/><rect y="78" width="256" height="100" fill="#94b95b"/><g fill="#2e3d19">' +
    '<path d="M42.7,146.5q4.8-.9,7.6-3.6t2.8-6.2q0-5.4-4.7-7.5-3.3,8.9-9.2,14.1-5.9,5.2-12,5.2-3.9,0-6.3-2.4-2.3-2.4-2.3-6.5,0-4.9,3.1-8.7,3.1-3.8,8.6-5.8v-6.4h-9.8v-4.1h9.8v-5.7h4.8v5.7h20.9v4.1h-20.9v5.2q2.8-.4,5.8-.4,8,0,12.5,3.6,4.5,3.5,4.5,9.6,0,5.4-3.7,9.1-3.7,3.8-10.2,5.1L42.7,146.5ZM30.3,129.9q-3.2,1.6-5.1,4-1.8,2.4-1.8,5.2,0,2.4,1.1,3.7,1.1,1.3,3.2,1.3,1.2,0,2.6-.4V129.9ZM44,128q-1.3-.2-3.1-.2-3.1,0-5.8.6v12.6Q40.9,136.4,44,128Z"/>' +
    '<path d="M73.3,114.7q-2.2,7.6-2.2,16,0,5.8,2,9.7t3.9,4,3.5-2.9,4.3-8.4l4.6,1.8q-2.4,6.8-6,10.7-3.6,3.8-6.8,3.8-3.9,0-7.2-5.5-3.3-5.4-3.3-13.2,0-9,2.3-16.6L73.3,114.7ZM93.5,115.2l4.6-1.4q3.2,6.2,4.9,14.2,1.7,7.9,1.7,16.4h-5q0-7.8-1.6-15.5Q96.4,121.3,93.5,115.2Z"/>' +
    '<path d="M112.1,125.4q12.7-3.1,21.7-3.1,7.5,0,10.9,2.8t3.5,7.3q0,7.1-6.8,11.7-6.9,4.6-19.6,5.6l-1.2-4.6q11.3-1.1,16.9-4.5,5.6-3.3,5.6-8,0-5.7-9.6-5.7-7.4,0-20.3,2.9L112.1,125.4ZM119.4,110.3q11.5,1.7,21.8,1.7v4.5q-10.1,0-22.3-1.8L119.4,110.3Z"/>' +
    '<path d="M187.5,125.8l-10.7,8.5h0s.3,0,.3,0q1.4,0,2.3,1.2t1.7,4.8,1.7,3.7,3.4.7,5.9-.8l.8,4.3q-3.6,1-7.2,1-4.1,0-6.1-1.4-1.9-1.4-2.8-4.8-.8-2.9-1.5-4-.7-1.1-1.8-1.1-1.2,0-3.2,1.5-2.1,1.4-13.6,10.2l-2.8-3.7,26.8-20.6h0c0-.1-23.6-.1-23.6-.1v-4.3h30.4V125.8ZM161.9,114.4l.6-4.3q11.5,1.6,21.8,1.6v4.5Q174.1,116.2,161.9,114.4Z"/>' +
    '<path d="M201.6,115.1h11.5v-6.2h4.8v6.2h11.3v4.1h-11.3v7.1q1.7-.2,3.6-.2,7.1,0,11.5,3.3t4.3,7.8-3.4,8.8-10.2,3.9l-1-4.3q5-.6,7.3-2.6,2.4-2,2.4-5.6,0-2.7-3-4.7-3-2-7.9-2-2,0-3.6.1v11.2q0,4-1.6,5.6-1.6,1.6-5.6,1.6-4.5,0-7.8-2.9-3.2-2.9-3.2-7,0-4.1,3.5-7.5,3.5-3.4,9.9-4.8v-7.8h-11.5V115.1ZM213.1,131.6q-4.2,1.1-6.4,3.2-2.2,2-2.2,4.5,0,2.2,1.8,4,1.8,1.7,3.9,1.7,1.6,0,2.3-.7.6-.7.6-2.5V131.6ZM231,115.9l3.5-2.7q4.2,5.1,7.6,10.5l-3.7,2.4Q235,120.6,231,115.9Z"/>' +
    "</g></svg>",
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
