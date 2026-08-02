export type ContentInteractionPreferenceKey =
  | "copyAllowed"
  | "selectionAllowed"
  | "menuAllowed";

export type ContentInteractionPreferences = Record<
  ContentInteractionPreferenceKey,
  boolean
>;

export const defaultContentInteractionPreferences: ContentInteractionPreferences =
  {
    copyAllowed: false,
    selectionAllowed: false,
    menuAllowed: false,
  };

const SELECTION_PROHIBITED_CLASS = "selection-prohibited";
const CODE_COPY_BUTTON_SELECTOR =
  ".vp-copy-code-button, .code-viewer .copy";

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

const readCookie = (key: ContentInteractionPreferenceKey): boolean | null => {
  if (!isBrowser()) return null;

  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matched = document.cookie.match(
    new RegExp(`(?:^|; )${escapedKey}=([^;]*)`),
  );

  return matched
    ? parseBooleanPreference(decodeURIComponent(matched[1]))
    : null;
};

const writeCookie = (
  key: ContentInteractionPreferenceKey,
  value: boolean,
) => {
  if (!isBrowser()) return;

  document.cookie = `${key}=${String(value)}; path=/; SameSite=Lax`;
};

export const readContentInteractionPreferences =
  (): ContentInteractionPreferences => ({
    copyAllowed:
      readCookie("copyAllowed") ??
      defaultContentInteractionPreferences.copyAllowed,
    selectionAllowed:
      readCookie("selectionAllowed") ??
      defaultContentInteractionPreferences.selectionAllowed,
    menuAllowed:
      readCookie("menuAllowed") ??
      defaultContentInteractionPreferences.menuAllowed,
  });

const applyPreferences = (preferences: ContentInteractionPreferences) => {
  activePreferences = preferences;

  if (!isBrowser()) return;
  document.documentElement.classList.toggle(
    SELECTION_PROHIBITED_CLASS,
    !preferences.selectionAllowed,
  );
};

export const applyAndPersistContentInteractionPreference = (
  key: ContentInteractionPreferenceKey,
  value: boolean,
) => {
  if (!isBrowser()) return;

  writeCookie(key, value);
  applyPreferences({
    ...activePreferences,
    [key]: value,
  });
};

const isCodeCopyButton = (target: EventTarget | null): boolean =>
  target instanceof Element && Boolean(target.closest(CODE_COPY_BUTTON_SELECTOR));

const grantCodeCopyExemption = () => {
  const expiresAt = Date.now() + 1_000;
  codeCopyExemptionExpiresAt = expiresAt;

  window.setTimeout(() => {
    if (codeCopyExemptionExpiresAt === expiresAt) {
      codeCopyExemptionExpiresAt = 0;
    }
  }, 1_000);
};

const consumeCodeCopyExemption = (): boolean => {
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
  applyPreferences(readContentInteractionPreferences());

  document.addEventListener(
    "click",
    (event) => {
      if (isCodeCopyButton(event.target)) {
        grantCodeCopyExemption();
      }
    },
    true,
  );

  document.addEventListener(
    "copy",
    (event) => {
      if (!activePreferences.copyAllowed && !consumeCodeCopyExemption()) {
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

  document.addEventListener(
    "contextmenu",
    (event) => {
      if (!activePreferences.menuAllowed) prohibitEvent(event);
    },
    true,
  );
};
