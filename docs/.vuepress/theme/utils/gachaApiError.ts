// Read errors separately from success payloads so empty/platform responses do
// not hide the original HTTP status. Never display raw HTML or request secrets.
export async function gachaApiError(response: Response, operation: string): Promise<Error> {
  const reasons: Record<string, string> = {
    TURNSTILE_REQUIRED: "The Worker requires security verification. Retry the operation.",
    TURNSTILE_FAILED: "Security verification was rejected. Retry the operation.",
    TURNSTILE_UNAVAILABLE: "Security verification is unavailable. Check the Worker Turnstile configuration and secrets; retry after the service is restored.",
    SYNC_SESSION_INVALID: "Sync authorization is invalid or expired. Start sync again to verify and reconcile.",
    RATE_LIMITED: "Too many requests. Wait before retrying.",
    PERSONAL_SYNC_DISABLED: "The deployed Worker has no valid PERSONAL_SYNC_TOKEN secret.",
    DATABASE_UNAVAILABLE: "The Worker could not complete a database operation; check its runtime logs, D1 binding and migrations.",
    UNAUTHORIZED: "The token was rejected by the Worker.",
    ORIGIN_NOT_ALLOWED: "This frontend origin is not in the Worker CORS allowlist.",
    SYNC_CONFLICT: "Remote data changed. Read and reconcile again before retrying.",
    INVALID_SYNC: "The Worker rejected the personal sync payload; check required record fields and limits.",
  };
  // Recognize only fixed backend messages; never render arbitrary server text.
  const protectionReasons: Record<string, string> = {
    "Turnstile configuration is unavailable.": "The Worker protection configuration is incomplete or invalid. Check TURNSTILE_SECRET, SYNC_SESSION_SECRET, public vars and distinct-secret requirements.",
    "Sync protection is unavailable.": "The Worker could not access its security rate-limit counters. Check D1 and migration 0005_sync_security_limits.sql.",
    "Turnstile verification is unavailable.": "The Worker could not validate the challenge with Cloudflare Siteverify. Check the widget secret, its pairing with the sitekey, outbound requests and Worker logs.",
    "Turnstile connection verification is disabled.": "The Worker has disabled connection verification. Check its current Turnstile configuration and retry saving settings.",
  };
  let detail = "The server returned an empty response.";
  try {
    const text = await response.text();
    if (text.trim()) {
      detail = "The server returned a non-JSON or unrecognized error response; inspect the failed request in Network and Worker runtime logs.";
      try {
        const payload = JSON.parse(text);
        const code = payload?.error?.code;
        if (typeof code === "string" && Object.hasOwn(reasons, code)) {
          const message = payload?.error?.message;
          const reason = code === "TURNSTILE_UNAVAILABLE" && typeof message === "string" && Object.hasOwn(protectionReasons, message)
            ? protectionReasons[message] : reasons[code];
          detail = `${code}: ${reason}`;
        }
      } catch { /* Platform HTML and proxy errors are not application JSON. */ }
    }
  } catch {
    detail = "The error response body could not be read.";
  }
  const trace = response.headers.get("cf-ray");
  const suffix = trace && /^[a-zA-Z0-9-]{1,80}$/.test(trace) ? ` Cloudflare Ray ID: ${trace}.` : "";
  return new Error(`${operation} failed (HTTP ${response.status}). ${detail}${suffix}`);
}
