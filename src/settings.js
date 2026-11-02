export const DEFAULT_SETTINGS = Object.freeze({
  gapPx: 120,
  gapColor: "rgba(143, 184, 154, 0.25)",
  overlayColor: "rgba(15, 23, 42, 0.82)",
  blendMultiply: false,
  verticalWriting: false,
  pageFontSizePercent: 100,
  pageLineHeightPercent: 100,
  pageFontFamily: "",
});

export const GAP_MIN = 24;
export const GAP_MAX = 400;
export const FONT_SCALE_PERCENTS = [100, 150, 200];
export const LINE_SCALE_PERCENTS = [100, 200, 400];

export function clampGap(v, fallback = DEFAULT_SETTINGS.gapPx) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(GAP_MAX, Math.max(GAP_MIN, Math.round(n)));
}

/** 100 / 150 / 200 のいずれかへ丸める */
export function normalizeFontSizePercent(raw) {
  const n = Math.round(Number(raw));
  if (FONT_SCALE_PERCENTS.includes(n)) return n;
  if (!Number.isFinite(n)) return 100;
  if (n <= 112) return 100;
  if (n <= 175) return 150;
  return 200;
}

/** 100 / 200 / 400 のいずれかへ丸める（1.5 や 2 などの倍率指定も受け付ける） */
export function normalizeLineHeightPercent(raw) {
  const fl = Number(raw);
  if (Number.isFinite(fl) && fl > 0 && fl < 10) {
    if (fl <= 1.35) return 100;
    if (fl <= 2.5) return 200;
    return 400;
  }
  const n = Math.round(fl);
  if (LINE_SCALE_PERCENTS.includes(n)) return n;
  if (!Number.isFinite(n)) return 100;
  if (n <= 112) return 100;
  if (n <= 300) return 200;
  return 400;
}

function isCssColor(v) {
  if (typeof v !== "string" || !v.trim()) return false;
  try {
    if (typeof CSS !== "undefined" && typeof CSS.supports === "function") {
      return CSS.supports("color", v);
    }
  } catch (_) {}
  return !/[;{}<>]/.test(v);
}

/** 不正値を既定値へ寄せた完全な設定オブジェクトを返す */
export function normalizeSettings(raw, base = DEFAULT_SETTINGS) {
  const src = raw && typeof raw === "object" ? raw : {};
  const merged = { ...base, ...src };
  return {
    gapPx: clampGap(merged.gapPx, base.gapPx),
    gapColor: isCssColor(merged.gapColor) ? merged.gapColor : base.gapColor,
    overlayColor: isCssColor(merged.overlayColor) ? merged.overlayColor : base.overlayColor,
    blendMultiply: !!merged.blendMultiply,
    verticalWriting: !!merged.verticalWriting,
    pageFontSizePercent: normalizeFontSizePercent(merged.pageFontSizePercent),
    pageLineHeightPercent: normalizeLineHeightPercent(merged.pageLineHeightPercent),
    pageFontFamily: String(merged.pageFontFamily || "").trim(),
  };
}

/** 設定に含まれるキーだけを取り出す（未知のキーを保存しないため） */
export function pickSettings(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const key of Object.keys(DEFAULT_SETTINGS)) {
    if (key in raw) out[key] = raw[key];
  }
  return out;
}

export function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  const full = h.length === 3 ? h.replace(/./g, "$&$&") : h;
  const n = parseInt(full, 16);
  if (!Number.isFinite(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function parseRgbaColor(rgba, fallbackHex, fallbackAlphaPercent) {
  const m = String(rgba || "").match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)/
  );
  if (!m) {
    const hexMatch = String(rgba || "").match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hexMatch) {
      const h = hexMatch[1].length === 3 ? hexMatch[1].replace(/./g, "$&$&") : hexMatch[1];
      return { hex: `#${h.toLowerCase()}`, alphaPercent: 100 };
    }
    return { hex: fallbackHex, alphaPercent: fallbackAlphaPercent };
  }
  const a = m[4] !== undefined ? Number(m[4]) : 1;
  const hex = "#" + [m[1], m[2], m[3]].map((x) => Number(x).toString(16).padStart(2, "0")).join("");
  return { hex, alphaPercent: Math.round(a * 100) };
}

export function buildRgba(hex, alphaPercent) {
  const { r, g, b } = hexToRgb(hex);
  const a = Math.min(1, Math.max(0, Number(alphaPercent) / 100));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * localStorage（設定）と sessionStorage（表示中かどうか・Fit Screen）のラッパー。
 * ストレージが使えない環境（プライベートモード等）では何もしない。
 */
export function createStore(key, { persist = true, resume = true } = {}) {
  const sessionKey = `${key}:session`;

  function safe(fn, fallback) {
    try {
      return fn();
    } catch (_) {
      return fallback;
    }
  }

  return {
    readSettings() {
      if (!persist) return null;
      return safe(() => {
        const raw = window.localStorage.getItem(key);
        return raw ? JSON.parse(raw) : null;
      }, null);
    },
    writeSettings(settings) {
      if (!persist) return;
      safe(() => window.localStorage.setItem(key, JSON.stringify(settings)));
    },
    clearSettings() {
      safe(() => window.localStorage.removeItem(key));
    },
    readSession() {
      if (!resume) return {};
      return safe(() => {
        const raw = window.sessionStorage.getItem(sessionKey);
        return raw ? JSON.parse(raw) || {} : {};
      }, {});
    },
    writeSession(patch) {
      if (!resume) return;
      safe(() => {
        const next = { ...this.readSession(), ...patch };
        window.sessionStorage.setItem(sessionKey, JSON.stringify(next));
      });
    },
  };
}
