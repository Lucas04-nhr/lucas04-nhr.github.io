// Read errors separately from success payloads so empty/platform responses do
// not hide the original HTTP status. Never display raw HTML or request secrets.
export async function gachaApiError(response: Response, operation: string): Promise<Error> {
  const reasons: Record<string, string> = {
    PERSONAL_SYNC_DISABLED: "The deployed Worker has no valid PERSONAL_SYNC_TOKEN secret.",
    DATABASE_UNAVAILABLE: "The Worker could not complete a database operation; check its runtime logs, D1 binding and migrations.",
    UNAUTHORIZED: "The token was rejected by the Worker.",
    ORIGIN_NOT_ALLOWED: "This frontend origin is not in the Worker CORS allowlist.",
    SYNC_CONFLICT: "Remote data changed. Read and reconcile again before retrying.",
    INVALID_SYNC: "The Worker rejected the personal sync payload; check required record fields and limits.",
  };
  let detail = "The server returned an empty response.";
  try {
    const text = await response.text();
    if (text.trim()) {
      detail = "The server returned a non-JSON or unrecognized error response; inspect the failed request in Network and Worker runtime logs.";
      try {
        const payload = JSON.parse(text);
        const code = payload?.error?.code;
        if (typeof code === "string" && Object.hasOwn(reasons, code)) detail = `${code}: ${reasons[code]}`;
      } catch { /* Platform HTML and proxy errors are not application JSON. */ }
    }
  } catch {
    detail = "The error response body could not be read.";
  }
  const trace = response.headers.get("cf-ray");
  const suffix = trace && /^[a-zA-Z0-9-]{1,80}$/.test(trace) ? ` Cloudflare Ray ID: ${trace}.` : "";
  return new Error(`${operation} failed (HTTP ${response.status}). ${detail}${suffix}`);
}
