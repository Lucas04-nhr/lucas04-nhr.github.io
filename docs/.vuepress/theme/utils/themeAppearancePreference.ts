export type ThemeAppearancePreference = "light" | "dark" | "auto";

const STORAGE_KEY = "themeAppearance";
const COOKIE_KEY = "themeAppearance";
const LEGACY_STORAGE_KEY = "vuepress-theme-appearance";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const APPEARANCE_TOGGLE_SELECTOR =
  "button.vp-switch.vp-switch-appearance[role='switch']";

let isProgrammaticThemeSwitch = false;
let themePersistenceInstalled = false;

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const readSystemPrefersDark = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const parseThemeAppearancePreference = (
  value: string | null | undefined,
): ThemeAppearancePreference | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "light") return "light";
  if (normalized === "dark") return "dark";
  if (normalized === "auto") return "auto";
  return null;
};

const readThemeAppearanceCookie = (): ThemeAppearancePreference | null => {
  if (!isBrowser()) return null;

  const matched = document.cookie.match(
    new RegExp(`(?:^|; )${COOKIE_KEY}=([^;]*)`),
  );
  return matched
    ? parseThemeAppearancePreference(decodeURIComponent(matched[1]))
    : null;
};

const writeThemeAppearanceCookie = (
  preference: ThemeAppearancePreference,
) => {
  if (!isBrowser()) return;

  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(preference)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

export const readStoredThemeAppearancePreference =
  (): ThemeAppearancePreference | null => {
    if (!isBrowser()) return null;

    try {
      const stored =
        parseThemeAppearancePreference(localStorage.getItem(STORAGE_KEY)) ??
        parseThemeAppearancePreference(localStorage.getItem(LEGACY_STORAGE_KEY));
      if (stored) return stored;
    } catch {}

    return readThemeAppearanceCookie();
  };

const applyDarkModeToDom = (isDark: boolean) => {
  if (!isBrowser()) return;

  const doc = document.documentElement;
  doc.dataset.theme = isDark ? "dark" : "light";
  doc.classList.toggle("dark", isDark);
};

const removeLegacyThemeStorage = () => {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
};

const getAppearanceToggleButton = (): HTMLButtonElement | null => {
  if (!isBrowser()) return null;

  return document.querySelector<HTMLButtonElement>(APPEARANCE_TOGGLE_SELECTOR);
};

const isAppearanceButtonDark = (button: HTMLButtonElement): boolean =>
  button.getAttribute("aria-checked") === "true";

const syncThemeByButtonEventually = (isDark: boolean) => {
  if (!isBrowser()) return;

  const maxAttempts = 20;
  let attempts = 0;

  const trySync = () => {
    const button = getAppearanceToggleButton();
    if (button) {
      const currentIsDark = isAppearanceButtonDark(button);
      if (currentIsDark !== isDark) {
        isProgrammaticThemeSwitch = true;
        try {
          button.click();
        } finally {
          isProgrammaticThemeSwitch = false;
        }
      }
      window.requestAnimationFrame(removeLegacyThemeStorage);
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

  removeLegacyThemeStorage();
  writeThemeAppearanceCookie(preference);
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

const installThemeAppearancePersistence = () => {
  if (!isBrowser() || themePersistenceInstalled) return;

  themePersistenceInstalled = true;
  document.addEventListener("click", (event) => {
    if (isProgrammaticThemeSwitch) return;

    const target = event.target;
    if (!(target instanceof Element)) return;

    const button = target.closest<HTMLButtonElement>(APPEARANCE_TOGGLE_SELECTOR);
    if (!button) return;

    window.requestAnimationFrame(() => {
      persistThemeAppearancePreference(
        isAppearanceButtonDark(button) ? "dark" : "light",
      );
    });
  });
};

export const initializeThemeAppearancePreference = () => {
  const preference = readStoredThemeAppearancePreference() ?? "auto";
  installThemeAppearancePersistence();
  applyAndPersistThemeAppearancePreference(preference);
};

export const parseThemeQueryAction = (
  value: string | null,
): ThemeAppearancePreference | null => {
  if (!value) return null;

  return parseThemeAppearancePreference(value);
};
