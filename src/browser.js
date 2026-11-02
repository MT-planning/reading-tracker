/**
 * `<script>` で読み込む版のエントリ。`window.ReadingTracker` を公開し、
 * script タグに `data-auto-init` があればその data 属性で初期化する。
 *
 *   <script src="reading-tracker.min.js" data-auto-init data-position="bottom-left"></script>
 */
import tracker from "./index.js";

const BOOLEAN_OPTIONS = ["launcher", "closeButton", "shortcuts", "persist", "resume", "fontPicker"];
const STRING_OPTIONS = ["position", "storageKey", "contentSelector", "lang"];

function parseBool(v) {
  return !(v === "false" || v === "0" || v === "no" || v === "off");
}

/** data-* 属性からオプションを組み立てる（data-settings は JSON） */
export function readScriptOptions(script) {
  const d = script.dataset;
  const opts = {};
  for (const key of BOOLEAN_OPTIONS) if (key in d) opts[key] = parseBool(d[key]);
  for (const key of STRING_OPTIONS) if (d[key]) opts[key] = d[key];
  if (d.zIndex && Number.isFinite(Number(d.zIndex))) opts.zIndex = Number(d.zIndex);
  if (d.settings) {
    try {
      opts.settings = JSON.parse(d.settings);
    } catch (err) {
      console.warn("[ReadingTracker] data-settings is not valid JSON", err);
    }
  }
  return opts;
}

window.ReadingTracker = tracker;

const script = document.currentScript;
if (script && script.hasAttribute("data-auto-init")) {
  tracker.init(readScriptOptions(script));
}
