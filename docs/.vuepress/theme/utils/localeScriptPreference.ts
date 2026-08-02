export type LocaleScriptPreference = "simplified" | "traditional";

const STORAGE_KEY = "zhLocaleSpec";
const COOKIE_KEY = "zhLocaleSpec";
const LEGACY_STORAGE_KEY = "zh-locale-spec";
const LEGACY_COOKIE_KEY = "zh-locale-spec";
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

const readScriptPreferenceCookieByKey = (
  key: string,
): LocaleScriptPreference | null => {
  if (!isBrowser()) return null;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(?:^|; )${escapedKey}=([^;]*)`);
  const matched = document.cookie.match(pattern);
  if (!matched) return null;

  return parseScriptPreference(decodeURIComponent(matched[1]));
};

export const readScriptPreferenceFromCookie =
  (): LocaleScriptPreference | null =>
    readScriptPreferenceCookieByKey(COOKIE_KEY) ??
    readScriptPreferenceCookieByKey(LEGACY_COOKIE_KEY);

export const writeScriptPreferenceCookie = (
  preference: LocaleScriptPreference,
) => {
  if (!isBrowser()) return;

  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(preference)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const clearLegacyScriptPreferenceCookie = () => {
  if (!isBrowser()) return;

  document.cookie = `${LEGACY_COOKIE_KEY}=; path=/; max-age=0; SameSite=Lax`;
};

export const readStoredScriptPreference = (): LocaleScriptPreference | null => {
  if (!isBrowser()) return null;

  let localPreference: LocaleScriptPreference | null = null;
  try {
    localPreference =
      parseScriptPreference(localStorage.getItem(STORAGE_KEY)) ??
      parseScriptPreference(localStorage.getItem(LEGACY_STORAGE_KEY));
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
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}

  writeScriptPreferenceCookie(preference);
  clearLegacyScriptPreferenceCookie();
};

export const applyAndPersistScriptPreference = (
  preference: LocaleScriptPreference,
) => {
  applyScriptPreferenceToDocument(preference);
  persistScriptPreference(preference);
};

const prefersTraditionalChinese = () => {
  if (!isBrowser()) return false;

  const locales = [navigator.language, ...(navigator.languages ?? [])]
    .filter(Boolean)
    .map((locale) => locale.toLowerCase());

  return locales.some((locale) =>
    /^(zh-(hk|mo|tw)|zh-hant|zh-tw|zh-hk|zh-mo)\b/.test(locale),
  );
};

export const initializeScriptPreference = (): LocaleScriptPreference => {
  const preference =
    readStoredScriptPreference() ??
    (prefersTraditionalChinese() ? "traditional" : "simplified");

  applyAndPersistScriptPreference(preference);
  return preference;
};

export const parseLocaleQueryAction = (
  value: string | null,
): LocaleScriptPreference | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "zh-hans") return "simplified";
  if (normalized === "zh-hant") return "traditional";

  return null;
};
