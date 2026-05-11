import {
  applyAndPersistScriptPreference,
  clearAndResetScriptPreference,
  parseLocaleQueryAction,
} from "./localeScriptPreference";
import {
  applyAndPersistThemeAppearancePreference,
  parseThemeQueryAction,
} from "./themeAppearancePreference";

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
