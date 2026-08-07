export const DEBUG_ALLOWED_COOKIE = "debugAllowed";
export const defaultDebugAllowed = false;

const DEBUGGER_DETECTED_CLASS = "debugger-detected";
const DEBUG_CHECK_INTERVAL_MS = 800;
const DEBUG_PAUSE_THRESHOLD_MS = 120;
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

let debugAllowed = defaultDebugAllowed;
let debugCheckTimer: number | null = null;
let keyboardGuardInstalled = false;

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

export const parseDebugAllowedPreference = (
  value: string | null | undefined,
): boolean | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return null;
};

const readCookie = (): string | null => {
  if (!isBrowser()) return null;

  const matched = document.cookie.match(
    new RegExp(`(?:^|; )${DEBUG_ALLOWED_COOKIE}=([^;]*)`),
  );
  return matched ? decodeURIComponent(matched[1]) : null;
};

const writeCookie = (value: boolean) => {
  if (!isBrowser()) return;

  document.cookie = `${DEBUG_ALLOWED_COOKIE}=${String(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

const readUrlPreference = (): boolean | null => {
  if (!isBrowser()) return null;

  return parseDebugAllowedPreference(
    new URL(window.location.href).searchParams.get(DEBUG_ALLOWED_COOKIE),
  );
};

const clearDetectedState = () => {
  if (!isBrowser()) return;
  document.documentElement.classList.remove(DEBUGGER_DETECTED_CLASS);
};

const runDebugCheck = () => {
  if (!isBrowser() || debugAllowed) return;

  try {
    console.clear();
  } catch {
    // Keep the debugger probe active if console methods were replaced.
  }

  const startedAt = performance.now();
  try {
    Function("debugger")();
  } catch {
    // A strict CSP may block Function construction.
  }

  document.documentElement.classList.toggle(
    DEBUGGER_DETECTED_CLASS,
    performance.now() - startedAt > DEBUG_PAUSE_THRESHOLD_MS,
  );
};

const stopDebugChecks = () => {
  if (!isBrowser()) return;

  if (debugCheckTimer !== null) {
    window.clearInterval(debugCheckTimer);
    debugCheckTimer = null;
  }
  clearDetectedState();
};

const startDebugChecks = () => {
  if (!isBrowser() || debugCheckTimer !== null) return;

  runDebugCheck();
  debugCheckTimer = window.setInterval(runDebugCheck, DEBUG_CHECK_INTERVAL_MS);
};

const isDeveloperToolsShortcut = (event: KeyboardEvent): boolean => {
  if (event.key === "F12") return true;

  const key = event.key.toLowerCase();
  const developerToolsKey = ["c", "i", "j"].includes(key);
  return (
    developerToolsKey &&
    ((event.ctrlKey && event.shiftKey) || (event.metaKey && event.altKey))
  );
};

const installKeyboardGuard = () => {
  if (!isBrowser() || keyboardGuardInstalled) return;

  keyboardGuardInstalled = true;
  window.addEventListener(
    "keydown",
    (event) => {
      if (!debugAllowed && isDeveloperToolsShortcut(event)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true,
  );
};

const applyDebugAllowedPreference = (allowed: boolean) => {
  debugAllowed = allowed;
  if (allowed) stopDebugChecks();
  else startDebugChecks();
};

export const applyAndPersistDebugAllowedPreference = (allowed: boolean) => {
  if (!isBrowser()) return;

  writeCookie(allowed);
  applyDebugAllowedPreference(allowed);
};

export const initializeDebugPreference = (): boolean => {
  const preference =
    readUrlPreference() ??
    parseDebugAllowedPreference(readCookie()) ??
    defaultDebugAllowed;

  installKeyboardGuard();
  applyAndPersistDebugAllowedPreference(preference);
  return preference;
};
