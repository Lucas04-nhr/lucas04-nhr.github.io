export type ContextMenuPreference = "custom" | "original" | false;

type CustomContextMenuOptions = {
  getMode: () => ContextMenuPreference;
  getCopyAllowed: () => boolean;
  getBlockedCopyText: () => string;
  allowNextCopy: () => void;
};

const CONTENT_SELECTOR = [
  "p",
  "li",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "pre",
  "code",
  "blockquote",
  "figcaption",
  "td",
  "th",
  "dt",
  "dd",
].join(",");
const LONG_PRESS_DELAY_MS = 550;
const LONG_PRESS_MOVE_TOLERANCE_PX = 12;
const VIEWPORT_MARGIN_PX = 10;

let installed = false;
let menuElement: HTMLDivElement | null = null;
let currentText = "";
let hideTimer: number | undefined;

const normalizeText = (text: string | null | undefined): string =>
  text?.trim() ?? "";

const readInputSelection = (target: Element): string => {
  if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
    return "";
  }

  const start = target.selectionStart;
  const end = target.selectionEnd;
  if (start === null || end === null || start === end) return "";

  return normalizeText(target.value.slice(start, end));
};

const readContextText = (target: EventTarget | null): string => {
  if (!(target instanceof Element)) return "";

  const inputSelection = readInputSelection(target);
  if (inputSelection) return inputSelection;

  const documentSelection = normalizeText(window.getSelection()?.toString());
  if (documentSelection) return documentSelection;

  if (target instanceof HTMLImageElement) {
    return normalizeText(target.alt);
  }

  return normalizeText(target.closest(CONTENT_SELECTOR)?.textContent);
};

const createIcon = (path: string): string =>
  `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}" /></svg>`;

const createMenuButton = (
  action: "copy" | "google" | "chatgpt",
  label: string,
  icon: string,
): HTMLButtonElement => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "site-context-menu__item";
  button.dataset.action = action;
  button.setAttribute("role", "menuitem");
  button.innerHTML = `${icon}<span>${label}</span>`;
  return button;
};

const copyText = async (text: string, allowNextCopy: () => void) => {
  try {
    if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
  } catch {
    const textArea = document.createElement("textarea");
    textArea.className = "site-context-menu-copy-source";
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    document.body.appendChild(textArea);
    textArea.select();
    allowNextCopy();
    document.execCommand("copy");
    textArea.remove();
  }
};

const openSearch = (baseUrl: string, text: string) => {
  const url = `${baseUrl}${encodeURIComponent(text.slice(0, 4_000))}`;
  window.open(url, "_blank", "noopener,noreferrer");
};

const hideMenu = () => {
  if (!menuElement || menuElement.hidden) return;

  menuElement.classList.remove("is-open");
  window.clearTimeout(hideTimer);
  hideTimer = window.setTimeout(() => {
    if (menuElement && !menuElement.classList.contains("is-open")) {
      menuElement.hidden = true;
    }
  }, 140);
};

export const syncCustomContextMenuMode = (mode: ContextMenuPreference) => {
  if (typeof document === "undefined") return;

  document.documentElement.classList.toggle(
    "native-context-menu-disabled",
    mode !== "original",
  );
  if (mode !== "custom") hideMenu();
};

const positionMenu = (menu: HTMLDivElement, x: number, y: number) => {
  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;

  if (window.matchMedia("(max-width: 640px)").matches) return;

  const rect = menu.getBoundingClientRect();
  const left = Math.min(
    x,
    window.innerWidth - rect.width - VIEWPORT_MARGIN_PX,
  );
  const top = Math.min(
    y,
    window.innerHeight - rect.height - VIEWPORT_MARGIN_PX,
  );

  menu.style.left = `${Math.max(VIEWPORT_MARGIN_PX, left)}px`;
  menu.style.top = `${Math.max(VIEWPORT_MARGIN_PX, top)}px`;
};

const showMenu = (
  x: number,
  y: number,
  target: EventTarget | null,
  copyAllowed: boolean,
) => {
  if (!menuElement) return;

  currentText = readContextText(target);
  const preview = menuElement.querySelector<HTMLElement>(
    ".site-context-menu__preview",
  );
  if (preview) {
    preview.textContent = currentText || "No text available";
    preview.classList.toggle("is-empty", !currentText);
  }

  menuElement
    .querySelectorAll<HTMLButtonElement>(".site-context-menu__item")
    .forEach((button) => {
      button.disabled =
        !currentText ||
        (button.dataset.action === "copy" && !copyAllowed);
    });

  window.clearTimeout(hideTimer);
  menuElement.hidden = false;
  positionMenu(menuElement, x, y);
  window.requestAnimationFrame(() => menuElement?.classList.add("is-open"));
};

const createMenu = ({
  getCopyAllowed,
  getBlockedCopyText,
  allowNextCopy,
}: Pick<
  CustomContextMenuOptions,
  "getCopyAllowed" | "getBlockedCopyText" | "allowNextCopy"
>): HTMLDivElement => {
  const menu = document.createElement("div");
  menu.className = "site-context-menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", "Content actions");
  menu.hidden = true;

  const preview = document.createElement("div");
  preview.className = "site-context-menu__preview";
  menu.appendChild(preview);

  menu.append(
    createMenuButton(
      "copy",
      "Copy",
      createIcon("M8 7V4h11v13h-3v3H5V7h3Zm2 0h6v8h1V6h-7v1Zm-3 2v9h7V9H7Z"),
    ),
    createMenuButton(
      "google",
      "Search with Google",
      createIcon("m15.5 14 5 5-1.5 1.5-5-5V14l-.5-.5A6.5 6.5 0 1 1 15.5 14ZM5 9.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Z"),
    ),
    createMenuButton(
      "chatgpt",
      "Ask ChatGPT",
      createIcon("M12 2.5 13.7 8l5.8 1.7-5.8 1.7L12 17l-1.7-5.6-5.8-1.7L10.3 8 12 2.5Zm6 11 1 2.5 2.5 1-2.5 1-1 2.5-1-2.5-2.5-1 2.5-1 1-2.5Z"),
    ),
  );

  menu.addEventListener("click", (event) => {
    if (!(event.target instanceof Element)) return;
    const button = event.target.closest<HTMLButtonElement>(
      ".site-context-menu__item",
    );
    if (!button || !currentText) return;

    if (button.dataset.action === "copy") {
      const text = getCopyAllowed() ? currentText : getBlockedCopyText();
      void copyText(text, allowNextCopy);
    } else if (button.dataset.action === "google") {
      if (button.disabled) return;
      openSearch("https://www.google.com/search?q=", currentText);
    } else if (button.dataset.action === "chatgpt") {
      if (button.disabled) return;
      openSearch("https://chatgpt.com/?q=", currentText);
    }

    hideMenu();
  });

  document.body.appendChild(menu);
  return menu;
};

export const installCustomContextMenu = ({
  getMode,
  getCopyAllowed,
  getBlockedCopyText,
  allowNextCopy,
}: CustomContextMenuOptions) => {
  if (typeof window === "undefined" || typeof document === "undefined" || installed) {
    return;
  }

  installed = true;
  menuElement = createMenu({
    getCopyAllowed,
    getBlockedCopyText,
    allowNextCopy,
  });

  let longPressTimer: number | undefined;
  let longPressTarget: EventTarget | null = null;
  let startX = 0;
  let startY = 0;
  let longPressTriggered = false;
  let suppressNativeContextUntil = 0;

  const clearLongPress = () => {
    window.clearTimeout(longPressTimer);
    longPressTimer = undefined;
  };

  document.addEventListener(
    "contextmenu",
    (event) => {
      const mode = getMode();
      if (mode === "original") return;

      event.preventDefault();
      event.stopImmediatePropagation();
      if (mode === false || Date.now() < suppressNativeContextUntil) return;

      showMenu(
        event.clientX,
        event.clientY,
        event.target,
        getCopyAllowed(),
      );
    },
    true,
  );

  document.addEventListener(
    "touchstart",
    (event) => {
      if (getMode() !== "custom" || event.touches.length !== 1) return;
      if (
        event.target instanceof Element &&
        event.target.closest(".site-context-menu, button, input, textarea, select")
      ) {
        return;
      }

      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      longPressTarget = event.target;
      longPressTriggered = false;
      clearLongPress();
      longPressTimer = window.setTimeout(() => {
        longPressTriggered = true;
        suppressNativeContextUntil = Date.now() + 1_000;
        showMenu(startX, startY, longPressTarget, getCopyAllowed());
      }, LONG_PRESS_DELAY_MS);
    },
    { capture: true, passive: true },
  );

  document.addEventListener(
    "touchmove",
    (event) => {
      const touch = event.touches[0];
      if (!touch) return;
      if (
        Math.abs(touch.clientX - startX) > LONG_PRESS_MOVE_TOLERANCE_PX ||
        Math.abs(touch.clientY - startY) > LONG_PRESS_MOVE_TOLERANCE_PX
      ) {
        clearLongPress();
      }
    },
    { capture: true, passive: true },
  );

  document.addEventListener(
    "touchend",
    (event) => {
      clearLongPress();
      if (longPressTriggered) event.preventDefault();
      longPressTriggered = false;
    },
    { capture: true, passive: false },
  );
  document.addEventListener("touchcancel", clearLongPress, true);

  document.addEventListener(
    "pointerdown",
    (event) => {
      if (
        menuElement?.classList.contains("is-open") &&
        event.target instanceof Node &&
        !menuElement.contains(event.target)
      ) {
        hideMenu();
      }
    },
    true,
  );
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hideMenu();
  });
  window.addEventListener("blur", hideMenu);
  window.addEventListener("resize", hideMenu);
  window.addEventListener("scroll", hideMenu, true);
};
