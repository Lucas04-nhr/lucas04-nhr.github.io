const REQUEST = "lucas-gacha-helper-request";
const RESPONSE = "lucas-gacha-helper-response";
const PROTOCOL = 1;

function helperRequest(action: "probe" | "fetch", signal: AbortSignal, url?: string): Promise<unknown> {
  if (typeof window === "undefined") return Promise.reject(new Error("The browser helper is only available in a browser."));
  // getRandomValues also works on HTTP LAN previews, where randomUUID is not
  // exposed because the page is not a secure context.
  const id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, "0")).join("");
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener("message", receive);
      signal.removeEventListener("abort", cancel);
    };
    const cancel = () => {
      cleanup();
      window.postMessage({ type: REQUEST, protocol: PROTOCOL, id, action: "cancel" }, window.location.origin);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const receive = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const message = event.data;
      if (!message || message.type !== RESPONSE || message.protocol !== PROTOCOL || message.id !== id) return;
      cleanup();
      if (message.error) reject(new Error(typeof message.error === "string" ? message.error : "Browser helper request failed."));
      else resolve(message.result);
    };
    const timer = setTimeout(() => {
      cleanup();
      if (action === "fetch") window.postMessage({ type: REQUEST, protocol: PROTOCOL, id, action: "cancel" }, window.location.origin);
      reject(new Error(action === "probe" ? "Browser helper not detected." : "Browser helper request timed out. Check Tampermonkey permissions and try again."));
    }, action === "probe" ? 1000 : 25000);
    if (signal.aborted) { cancel(); return; }
    window.addEventListener("message", receive);
    signal.addEventListener("abort", cancel, { once: true });
    window.postMessage({ type: REQUEST, protocol: PROTOCOL, id, action, ...(url ? { url } : {}) }, window.location.origin);
  });
}

export async function detectGachaHelper(signal: AbortSignal): Promise<boolean> {
  try {
    const result = await helperRequest("probe", signal);
    return !!result && typeof result === "object" && "version" in result && result.version === "1.0.0";
  } catch { return false; }
}

export async function fetchWithGachaHelper(url: URL, signal: AbortSignal): Promise<Record<string, unknown>> {
  const body = await helperRequest("fetch", signal, url.href);
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Browser helper returned invalid JSON.");
  return body as Record<string, unknown>;
}
