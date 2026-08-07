import {
  type ContextMenuPreference,
  installCustomContextMenu,
  syncCustomContextMenuMode,
} from "./customContextMenu";

export type ContentInteractionPreferenceKey =
  | "copyAllowed"
  | "selectionAllowed"
  | "menuAllowed";

export type ContentInteractionPreferences = {
  copyAllowed: boolean;
  selectionAllowed: boolean;
  menuAllowed: ContextMenuPreference;
};

export const defaultContentInteractionPreferences: ContentInteractionPreferences =
  {
    copyAllowed: false,
    selectionAllowed: false,
    menuAllowed: "custom",
  };

const SELECTION_PROHIBITED_CLASS = "selection-prohibited";
const CODE_COPY_BUTTON_SELECTOR =
  ".vp-copy-code-button, .code-viewer .copy";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

let activePreferences = { ...defaultContentInteractionPreferences };
let guardsInstalled = false;
let codeCopyExemptionExpiresAt = 0;

const isBrowser = () =>
  typeof window !== "undefined" && typeof document !== "undefined";

export const parseBooleanPreference = (
  value: string | null | undefined,
): boolean | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;

  return null;
};

export const parseMenuPreference = (
  value: string | null | undefined,
): ContextMenuPreference | null => {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();
  if (normalized === "custom" || normalized === "original") return normalized;
  if (normalized === "false") return false;

  return null;
};

const readCookie = (key: ContentInteractionPreferenceKey): string | null => {
  if (!isBrowser()) return null;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matched = document.cookie.match(
    new RegExp(`(?:^|; )${escapedKey}=([^;]*)`),
  );

  return matched ? decodeURIComponent(matched[1]) : null;
};

const writeCookie = <Key extends ContentInteractionPreferenceKey>(
  key: Key,
  value: ContentInteractionPreferences[Key],
) => {
  if (!isBrowser()) return;

  document.cookie = `${key}=${String(value)}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
};

export const readContentInteractionPreferences =
  (): ContentInteractionPreferences => ({
    copyAllowed:
      parseBooleanPreference(readCookie("copyAllowed")) ??
      defaultContentInteractionPreferences.copyAllowed,
    selectionAllowed:
      parseBooleanPreference(readCookie("selectionAllowed")) ??
      defaultContentInteractionPreferences.selectionAllowed,
    menuAllowed:
      parseMenuPreference(readCookie("menuAllowed")) ??
      defaultContentInteractionPreferences.menuAllowed,
  });

const applyPreferences = (preferences: ContentInteractionPreferences) => {
  activePreferences = preferences;

  if (!isBrowser()) return;
  document.documentElement.classList.toggle(
    SELECTION_PROHIBITED_CLASS,
    !preferences.selectionAllowed,
  );
  syncCustomContextMenuMode(preferences.menuAllowed);
};

export const applyAndPersistContentInteractionPreference = <
  Key extends ContentInteractionPreferenceKey,
>(
  key: Key,
  value: ContentInteractionPreferences[Key],
) => {
  if (!isBrowser()) return;

  writeCookie(key, value);
  applyPreferences({
    ...activePreferences,
    [key]: value,
  } as ContentInteractionPreferences);
};

const isCodeCopyButton = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest(CODE_COPY_BUTTON_SELECTOR));

const grantCopyExemption = () => {
  const expiresAt = Date.now() + 1_000;
  codeCopyExemptionExpiresAt = expiresAt;

  window.setTimeout(() => {
    if (codeCopyExemptionExpiresAt === expiresAt) {
      codeCopyExemptionExpiresAt = 0;
    }
  }, 1_000);
};

const consumeCopyExemption = (): boolean => {
  const isExempt = Date.now() <= codeCopyExemptionExpiresAt;
  codeCopyExemptionExpiresAt = 0;
  return isExempt;
};

const prohibitEvent = (event: Event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
};

export const installContentInteractionGuards = () => {
  if (!isBrowser() || guardsInstalled) return;

  guardsInstalled = true;
  const preferences = readContentInteractionPreferences();
  writeCookie("copyAllowed", preferences.copyAllowed);
  writeCookie("selectionAllowed", preferences.selectionAllowed);
  writeCookie("menuAllowed", preferences.menuAllowed);
  applyPreferences(preferences);

  document.addEventListener(
    "click",
    (event) => {
      if (isCodeCopyButton(event.target)) {
        grantCopyExemption();
      }
    },
    true,
  );

  document.addEventListener(
    "copy",
    (event) => {
      if (!activePreferences.copyAllowed && !consumeCopyExemption()) {
        prohibitEvent(event);
      }
    },
    true,
  );

  document.addEventListener(
    "selectstart",
    (event) => {
      if (!activePreferences.selectionAllowed) prohibitEvent(event);
    },
    true,
  );

  installCustomContextMenu({
    getMode: () => activePreferences.menuAllowed,
    allowNextCopy: grantCopyExemption,
  });
};
