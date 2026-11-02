/** Local Font Access API（Chromium 系デスクトップ・HTTPS のみ） */
export function supportsLocalFonts() {
  return typeof window !== "undefined" && typeof window.queryLocalFonts === "function" && window.isSecureContext;
}

/**
 * インストール済みフォントをファミリー単位で返す。
 * 名前に「UD」を含むもの（読みやすさに配慮した UD フォント）は recommended にする。
 * @returns {Promise<Array<{ name: string, label: string, recommended: boolean }>>}
 */
export async function loadLocalFonts() {
  if (!supportsLocalFonts()) throw new Error("Local Font Access API is not available");
  const raw = Array.from(await window.queryLocalFonts());
  const families = new Set();
  for (const f of raw) {
    const name = String(f.family || f.fullName || f.postscriptName || "").trim();
    if (name) families.add(name);
  }
  return [...families]
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map((name) => ({ name, label: name, recommended: /UD/.test(name) }));
}
