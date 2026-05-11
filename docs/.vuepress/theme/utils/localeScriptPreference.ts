export type LocaleScriptPreference = "simplified" | "traditional";

const STORAGE_KEY = "site-zh-script";
const COOKIE_KEY = "site-zh-script";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

const parseScriptPreference = (
  value: string | null | undefined,
): LocaleScriptPreference | null => {
  if (value === "simplified" || value === "traditional") {
    return value;
  }
  return null;
};

export const applyScriptPreferenceToDocument = (
  preference: LocaleScriptPreference,
) => {
  if (!isBrowser()) return;

  if (preference === "traditional") {
    document.documentElement.classList.add("zh-traditional");
    return;
  }

  document.documentElement.classList.remove("zh-traditional");
};

export const readScriptPreferenceFromCookie =
  (): LocaleScriptPreference | null => {
    if (!isBrowser()) return null;

    const escapedKey = COOKIE_KEY.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`(?:^|; )${escapedKey}=([^;]*)`);
    const matched = document.cookie.match(pattern);
    if (!matched) return null;

    return parseScriptPreference(decodeURIComponent(matched[1]));
  };

export const writeScriptPreferenceCookie = (
  preference: LocaleScriptPreference,
) => {
  if (!isBrowser()) return;

  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(preference)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

export const clearScriptPreferenceCookie = () => {
  if (!isBrowser()) return;

  document.cookie = `${COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
};

export const readStoredScriptPreference = (): LocaleScriptPreference | null => {
  if (!isBrowser()) return null;

  let localPreference: LocaleScriptPreference | null = null;
  try {
    localPreference = parseScriptPreference(localStorage.getItem(STORAGE_KEY));
  } catch {
    localPreference = null;
  }

  if (localPreference) return localPreference;

  const cookiePreference = readScriptPreferenceFromCookie();
  if (cookiePreference) {
    try {
      localStorage.setItem(STORAGE_KEY, cookiePreference);
    } catch {}
  }

  return cookiePreference;
};

export const persistScriptPreference = (preference: LocaleScriptPreference) => {
  if (!isBrowser()) return;

  try {
    localStorage.setItem(STORAGE_KEY, preference);
  } catch {}

  writeScriptPreferenceCookie(preference);
};

export const clearStoredScriptPreference = () => {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}

  clearScriptPreferenceCookie();
};

export const applyAndPersistScriptPreference = (
  preference: LocaleScriptPreference,
) => {
  applyScriptPreferenceToDocument(preference);
  persistScriptPreference(preference);
};

export const clearAndResetScriptPreference = () => {
  clearStoredScriptPreference();
  applyScriptPreferenceToDocument("simplified");
};

export const parseLocaleQueryAction = (
  value: string | null,
): LocaleScriptPreference | "reset" | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "zh-hans") return "simplified";
  if (normalized === "zh-hant") return "traditional";
  if (normalized === "clear") return "reset";

  return null;
};
