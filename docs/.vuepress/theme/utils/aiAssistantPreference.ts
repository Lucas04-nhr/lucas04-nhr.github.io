import { ref } from "vue";
import { parseBooleanPreference } from "./contentInteractionPreference";

export const AI_ASSISTANT_ALLOWED_COOKIE = "aiAssistantAllowed";
export const defaultAiAssistantAllowed = false;

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

// Whether the floating AI assistant in the bottom-right corner is shown.
// Ask AI in the search modal is always available.
export const aiAssistantAllowed = ref(defaultAiAssistantAllowed);

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

export const parseAiAssistantAllowedPreference = parseBooleanPreference;

const readCookie = (): string | null => {
  if (!isBrowser()) return null;

  const matched = document.cookie.match(
    new RegExp(`(?:^|; )${AI_ASSISTANT_ALLOWED_COOKIE}=([^;]*)`),
  );
  return matched ? decodeURIComponent(matched[1]) : null;
};

const writeCookie = (value: boolean) => {
  if (!isBrowser()) return;

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${AI_ASSISTANT_ALLOWED_COOKIE}=${String(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
};

export const applyAndPersistAiAssistantAllowedPreference = (allowed: boolean) => {
  if (!isBrowser()) return;

  writeCookie(allowed);
  aiAssistantAllowed.value = allowed;
};

// The URL parameter itself is applied later by the URL query handlers.
export const initializeAiAssistantPreference = (): boolean => {
  const preference =
    parseAiAssistantAllowedPreference(readCookie()) ?? defaultAiAssistantAllowed;

  aiAssistantAllowed.value = preference;
  return preference;
};
