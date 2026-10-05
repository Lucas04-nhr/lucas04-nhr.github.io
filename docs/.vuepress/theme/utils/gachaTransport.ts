const REQUEST = "helios-assistant-helper-request";
const RESPONSE = "helios-assistant-helper-response";
const PROTOCOL = 1;

function helperRequest(
  action: "probe" | "fetch",
  signal: AbortSignal,
  url?: string,
): Promise<unknown> {
  if (typeof window === "undefined")
    return Promise.reject(
      new Error("The browser helper is only available in a browser."),
    );
  // getRandomValues also works on HTTP LAN previews, where randomUUID is not
  // exposed because the page is not a secure context.
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      clearInterval(retry);
      document.removeEventListener(RESPONSE, receive);
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      cleanup();
      send("cancel");
      reject(new DOMException("Cancelled", "AbortError"));
    };
    // String event details cross userscript sandboxes without sharing JS objects.
    const send = (requestAction: "probe" | "fetch" | "cancel" = action) => {
      document.dispatchEvent(
        new CustomEvent(REQUEST, {
          detail: JSON.stringify({
            type: REQUEST,
            protocol: PROTOCOL,
            id,
            action: requestAction,
            ...(url ? { url } : {}),
          }),
        }),
      );
    };
    const receive = (event: Event) => {
      let message;
      try {
        message = JSON.parse((event as CustomEvent<string>).detail);
      } catch {
        return;
      }
      if (
        !message ||
        message.type !== RESPONSE ||
        message.protocol !== PROTOCOL ||
        message.id !== id
      )
        return;
      cleanup();
      if (message.error)
        reject(
          new Error(
            typeof message.error === "string"
              ? message.error
              : "Browser helper request failed.",
          ),
        );
      else resolve(message.result);
    };
    const timer = setTimeout(
      () => {
        cleanup();
        if (action === "fetch") send("cancel");
        reject(
          new Error(
            action === "probe"
              ? "Browser helper not detected."
              : "Browser helper request timed out. Check Tampermonkey permissions and try again.",
          ),
        );
      },
      action === "probe" ? 3000 : 25000,
    );
    const retry =
      action === "probe" ? setInterval(() => send(), 250) : undefined;
    if (signal.aborted) {
      cancel();
      return;
    }
    document.addEventListener(RESPONSE, receive);
    signal.addEventListener("abort", cancel, { once: true });
    send();
  });
}

export async function detectGachaHelper(signal: AbortSignal): Promise<boolean> {
  try {
    const result = await helperRequest("probe", signal);
    return (
      !!result &&
      typeof result === "object" &&
      "version" in result &&
      typeof result.version === "string" &&
      /^1\.\d+\.\d+$/.test(result.version)
    );
  } catch {
    return false;
  }
}

export async function fetchWithGachaHelper(
  url: URL,
  signal: AbortSignal,
): Promise<Record<string, unknown>> {
  const body = await helperRequest("fetch", signal, url.href);
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw new Error("Browser helper returned invalid JSON.");
  return body as Record<string, unknown>;
}
