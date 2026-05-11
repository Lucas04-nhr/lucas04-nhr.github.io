export type ThemeAppearancePreference = "light" | "dark" | "auto";

const STORAGE_KEY = "vuepress-theme-appearance";

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const readSystemPrefersDark = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const applyDarkModeToDom = (isDark: boolean) => {
  if (!isBrowser()) return;

  const doc = document.documentElement;
  doc.dataset.theme = isDark ? "dark" : "light";
  doc.classList.toggle("dark", isDark);
};

const getAppearanceToggleButton = (): HTMLButtonElement | null => {
  if (!isBrowser()) return null;

  return document.querySelector(
    "button.vp-switch.vp-switch-appearance[role='switch']",
  ) as HTMLButtonElement | null;
};

const isAppearanceButtonDark = (button: HTMLButtonElement): boolean =>
  button.getAttribute("aria-checked") === "true";

const switchThemeByButton = (isDark: boolean): boolean => {
  const button = getAppearanceToggleButton();
  if (!button) return false;

  const currentIsDark = isAppearanceButtonDark(button);
  if (currentIsDark !== isDark) {
    button.click();
  }

  return true;
};

const syncThemeByButtonEventually = (isDark: boolean) => {
  if (!isBrowser()) return;

  const maxAttempts = 20;
  let attempts = 0;

  const trySync = () => {
    const button = getAppearanceToggleButton();
    if (button) {
      const currentIsDark = isAppearanceButtonDark(button);
      if (currentIsDark !== isDark) {
        button.click();
      }
      return;
    }

    if (attempts >= maxAttempts) return;
    attempts += 1;
    window.requestAnimationFrame(trySync);
  };

  window.requestAnimationFrame(trySync);
};

export const persistThemeAppearancePreference = (
  preference: ThemeAppearancePreference,
) => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {}
};

export const applyAndPersistThemeAppearancePreference = (
  preference: ThemeAppearancePreference,
) => {
  if (!isBrowser()) return;

  if (preference === "auto") {
    const systemDark = readSystemPrefersDark();
    persistThemeAppearancePreference("auto");
    applyDarkModeToDom(systemDark);
    syncThemeByButtonEventually(systemDark);
    return;
  }

  const isDark = preference === "dark";
  persistThemeAppearancePreference(preference);
  applyDarkModeToDom(isDark);
  syncThemeByButtonEventually(isDark);
};

export const parseThemeQueryAction = (
  value: string | null,
): ThemeAppearancePreference | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "light") return "light";
  if (normalized === "dark") return "dark";
  if (normalized === "auto") return "auto";

  return null;
};
