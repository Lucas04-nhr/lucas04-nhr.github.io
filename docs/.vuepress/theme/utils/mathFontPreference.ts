// Optional math fonts for KaTeX. The stylesheet in styles/fonts_math.css keys
// off <html data-math-font="...">; without the attribute KaTeX keeps its own
// fonts.
export const mathFontFamilies = ["termes", "pagella", "bonum", "schola"] as const;

export type MathFontFamily = (typeof mathFontFamilies)[number];
export type MathFontPreference = MathFontFamily | "default";

const STORAGE_KEY = "mathFont";

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

export const parseMathFontPreference = (
  value: string | null | undefined,
): MathFontPreference | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "default" || normalized === "katex") return "default";
  return (mathFontFamilies as readonly string[]).includes(normalized)
    ? (normalized as MathFontFamily)
    : null;
};

const readStoredMathFontPreference = (): MathFontPreference | null => {
  if (!isBrowser()) return null;

  try {
    return parseMathFontPreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
};

const applyMathFontPreference = (preference: MathFontPreference) => {
  if (!isBrowser()) return;

  if (preference === "default") {
    delete document.documentElement.dataset.mathFont;
  } else {
    document.documentElement.dataset.mathFont = preference;
  }
};

export const applyAndPersistMathFontPreference = (
  preference: MathFontPreference,
) => {
  if (!isBrowser()) return;

  try {
    if (preference === "default") localStorage.removeItem(STORAGE_KEY);
    else localStorage.setItem(STORAGE_KEY, preference);
  } catch {}

  applyMathFontPreference(preference);
};

export const initializeMathFontPreference = () => {
  applyMathFontPreference(readStoredMathFontPreference() ?? "default");
};
