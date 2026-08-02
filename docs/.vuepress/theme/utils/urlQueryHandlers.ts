import {
  applyAndPersistScriptPreference,
  clearAndResetScriptPreference,
  parseLocaleQueryAction,
} from "./localeScriptPreference";
import {
  applyAndPersistThemeAppearancePreference,
  parseThemeQueryAction,
} from "./themeAppearancePreference";
import {
  applyAndPersistInternalRuleBypassPreference,
  parseInternalRuleBypassQueryAction,
} from "./chinaMainlandUserDetection";
import {
  applyAndPersistContentInteractionPreference,
  parseBooleanPreference,
} from "./contentInteractionPreference";

export type UrlQueryHandlerResult = {
  handled: boolean;
  removeParam?: boolean;
};

export type UrlQueryHandlerContext = {
  url: URL;
};

export type UrlQueryHandler = (
  value: string | null,
  context: UrlQueryHandlerContext,
) => UrlQueryHandlerResult;

const unhandledResult: UrlQueryHandlerResult = {
  handled: false,
  removeParam: false,
};

// Register all query handlers here (existing and future).
export const urlQueryHandlers: Record<string, UrlQueryHandler> = {
  locale(value) {
    const action = parseLocaleQueryAction(value);
    if (!action) return unhandledResult;

    if (action === "reset") {
      clearAndResetScriptPreference();
      return { handled: true, removeParam: true };
    }

    applyAndPersistScriptPreference(action);
    return { handled: true, removeParam: true };
  },

  theme(value) {
    const action = parseThemeQueryAction(value);
    if (!action) return unhandledResult;

    applyAndPersistThemeAppearancePreference(action);
    return { handled: true, removeParam: true };
  },

  bypass(value) {
    const action = parseInternalRuleBypassQueryAction(value);
    if (!action) return unhandledResult;

    applyAndPersistInternalRuleBypassPreference(action);
    return { handled: true, removeParam: true };
  },

  copyAllowed(value) {
    const preference = parseBooleanPreference(value);
    if (preference === null) return unhandledResult;

    applyAndPersistContentInteractionPreference("copyAllowed", preference);
    return { handled: true, removeParam: true };
  },

  selectionAllowed(value) {
    const preference = parseBooleanPreference(value);
    if (preference === null) return unhandledResult;

    applyAndPersistContentInteractionPreference("selectionAllowed", preference);
    return { handled: true, removeParam: true };
  },

  menuAllowed(value) {
    const preference = parseBooleanPreference(value);
    if (preference === null) return unhandledResult;

    applyAndPersistContentInteractionPreference("menuAllowed", preference);
    return { handled: true, removeParam: true };
  },
};

export const runUrlQueryHandlers = (url: URL): boolean => {
  let urlChanged = false;

  for (const [param, handler] of Object.entries(urlQueryHandlers)) {
    const result = handler(url.searchParams.get(param), { url });
    const shouldRemove = result.removeParam !== false;

    if (result.handled && shouldRemove && url.searchParams.has(param)) {
      url.searchParams.delete(param);
      urlChanged = true;
    }
  }

  return urlChanged;
};
