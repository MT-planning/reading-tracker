import { DEFAULT_SETTINGS, createStore, normalizeSettings, pickSettings } from "./settings.js";
import { Overlay } from "./overlay.js";
import { Ui } from "./ui.js";
import { getMessages } from "./i18n.js";

export { DEFAULT_SETTINGS } from "./settings.js";

export const VERSION = __VERSION__;

const DEFAULT_OPTIONS = Object.freeze({
  launcher: true,
  position: "bottom-right",
  closeButton: true,
  shortcuts: true,
  persist: true,
  resume: true,
  fontPicker: true,
  storageKey: "reading-tracker",
  contentSelector: "body",
  lang: "auto",
  messages: null,
  settings: null,
  zIndex: 2147483646,
});

let options = null;
let store = null;
let overlay = null;
let ui = null;
let baseSettings = DEFAULT_SETTINGS;
let settings = { ...DEFAULT_SETTINGS };
let active = false;
let fitScreen = false;
let keyAbort = null;
let readyQueue = [];
const listeners = new Map();

function emit(type, detail) {
  (listeners.get(type) || []).forEach((fn) => {
    try {
      fn(detail);
    } catch (err) {
      console.error("[ReadingTracker]", err);
    }
  });
}

function flushReadyQueue() {
  const queue = readyQueue;
  readyQueue = [];
  queue.forEach((fn) => fn());
}

/** DOM 構築後に実行する（`<head>` 内で読み込まれた場合に備える） */
function whenReady(fn) {
  if (document.readyState !== "loading") {
    fn();
    return;
  }
  readyQueue.push(fn);
  if (readyQueue.length === 1) {
    document.addEventListener("DOMContentLoaded", flushReadyQueue, { once: true });
  }
}

function ensureInit() {
  if (!options) tracker.init();
}

function onKeyDown(e) {
  if (e.key === "Escape") {
    if (ui?.open) {
      e.preventDefault();
      tracker.closePanel();
    } else if (active) {
      e.preventDefault();
      tracker.stop();
    }
    return;
  }
  if (!options.shortcuts || !e.altKey || !e.shiftKey || e.ctrlKey || e.metaKey) return;
  // e.code で判定（macOS の Option キーで e.key が別の文字になるため）
  if (e.code === "KeyG") {
    e.preventDefault();
    tracker.toggle();
  } else if (e.code === "KeyF" && active) {
    e.preventDefault();
    tracker.toggleFitScreen();
  }
}

const tracker = {
  version: VERSION,
  DEFAULT_SETTINGS,

  /**
   * 初期化する。再度呼ぶと、いったん破棄してから新しいオプションで作り直す。
   * @param {import("../types/index").ReadingTrackerOptions} [opts]
   */
  init(opts = {}) {
    if (typeof window === "undefined" || typeof document === "undefined") return tracker;
    if (options) tracker.destroy();

    options = { ...DEFAULT_OPTIONS, ...opts };
    store = createStore(options.storageKey, options);
    baseSettings = normalizeSettings(options.settings, DEFAULT_SETTINGS);
    settings = normalizeSettings(store.readSettings(), baseSettings);
    const session = store.readSession();
    fitScreen = !!session.fitScreen;
    active = false;

    overlay = new Overlay({
      contentSelector: options.contentSelector,
      zIndex: options.zIndex,
      shouldIgnoreEvent: (e) => !!ui?.contains(e),
    });

    keyAbort = new AbortController();
    window.addEventListener("keydown", onKeyDown, { capture: true, signal: keyAbort.signal });

    whenReady(() => {
      ui = new Ui(tracker, {
        messages: getMessages(options.lang, options.messages),
        position: options.position,
        launcher: options.launcher,
        closeButton: options.closeButton,
        shortcuts: options.shortcuts,
        fontPicker: options.fontPicker,
        zIndex: options.zIndex,
      });
      ui.mount();
      if (session.active) tracker.start();
    });
    return tracker;
  },

  /** ガイドを表示する */
  start() {
    ensureInit();
    if (active) return tracker;
    if (!document.body) {
      whenReady(() => tracker.start());
      return tracker;
    }
    active = true;
    overlay.mount(settings, fitScreen);
    store.writeSession({ active: true });
    ui?.render();
    emit("start");
    return tracker;
  },

  /** ガイドを終了する（ページの文字サイズ・行間・フォントも元に戻る） */
  stop() {
    if (!options || !active) return tracker;
    active = false;
    overlay.unmount();
    store.writeSession({ active: false });
    ui?.render();
    emit("stop");
    return tracker;
  },

  toggle() {
    return active ? tracker.stop() : tracker.start();
  },

  isActive() {
    return active;
  },

  /** 読む帯を画面いっぱいに広げる（タブを閉じるまで保持） */
  setFitScreen(on) {
    ensureInit();
    const next = !!on;
    if (next === fitScreen) return tracker;
    fitScreen = next;
    overlay.setFitScreen(fitScreen);
    store.writeSession({ fitScreen });
    ui?.render();
    emit("fitscreenchange", fitScreen);
    return tracker;
  },

  toggleFitScreen() {
    return tracker.setFitScreen(!fitScreen);
  },

  isFitScreen() {
    return fitScreen;
  },

  /** 設定を変更する（表示中ならその場で反映し、保存する） */
  update(patch) {
    ensureInit();
    settings = normalizeSettings({ ...settings, ...pickSettings(patch) }, baseSettings);
    overlay.update(settings);
    store.writeSettings(settings);
    ui?.render();
    emit("change", { ...settings });
    return tracker;
  },

  getSettings() {
    return { ...settings };
  },

  /** 利用者が保存した設定を消し、サイトの初期値に戻す */
  reset() {
    ensureInit();
    store.clearSettings();
    settings = { ...baseSettings };
    overlay.update(settings);
    ui?.render();
    emit("change", { ...settings });
    return tracker;
  },

  openPanel() {
    ensureInit();
    if (!ui) {
      whenReady(() => tracker.openPanel());
      return tracker;
    }
    if (!ui.open) {
      ui.setOpen(true);
      emit("panelopen");
    }
    return tracker;
  },

  closePanel() {
    if (ui?.open) {
      ui.setOpen(false);
      emit("panelclose");
    }
    return tracker;
  },

  togglePanel() {
    return ui?.open ? tracker.closePanel() : tracker.openPanel();
  },

  /** すべての DOM とイベントを取り除く（保存済みの設定は残る） */
  destroy() {
    if (!options) return tracker;
    readyQueue = [];
    if (active) {
      overlay.unmount();
      active = false;
    }
    ui?.unmount();
    ui = null;
    overlay = null;
    keyAbort?.abort();
    keyAbort = null;
    options = null;
    store = null;
    return tracker;
  },

  /**
   * イベントを購読する。戻り値の関数を呼ぶと解除。
   * @param {"start"|"stop"|"change"|"fitscreenchange"|"panelopen"|"panelclose"} type
   */
  on(type, fn) {
    if (!listeners.has(type)) listeners.set(type, []);
    listeners.get(type).push(fn);
    return () => tracker.off(type, fn);
  },

  off(type, fn) {
    const arr = listeners.get(type);
    if (arr) listeners.set(type, arr.filter((f) => f !== fn));
    return tracker;
  },
};

export default tracker;
