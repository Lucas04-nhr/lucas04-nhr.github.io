import { gachaApiError } from "./gachaApiError";
import { gachaLog } from "./gachaLog";

export async function checkGachaHealth(
  origin: string,
  signal: AbortSignal,
): Promise<{ turnstile?: { enabled: boolean; siteKey?: string } }> {
  gachaLog("info", "Worker health check started");
  let response: Response;
  try {
    response = await fetch(`${origin}/api/v1/health`, {
      credentials: "omit",
      referrerPolicy: "no-referrer",
      redirect: "error",
      cache: "no-store",
      signal: AbortSignal.any([signal, AbortSignal.timeout(10000)]),
    });
  } catch {
    gachaLog("error", "Worker health check could not connect");
    throw new Error(
      "Cannot verify the Worker health endpoint. Check the domain, HTTPS, network and Worker CORS settings. Connection details were not saved.",
    );
  }
  if (!response.ok) {
    gachaLog("error", "Worker health check failed", {
      status: response.status,
    });
    throw await gachaApiError(response, "Worker health check");
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    /* Reject HTML and invalid JSON below. */
  }
  if (
    !body ||
    typeof body !== "object" ||
    !("status" in body) ||
    body.status !== "ok" ||
    !("database" in body) ||
    body.database !== "gacha_meta"
  ) {
    gachaLog("error", "Worker health check returned an unexpected response");
    throw new Error(
      "The domain did not return a valid Helios Assistant health response. Connection details were not saved.",
    );
  }
  const turnstile = "turnstile" in body ? body.turnstile : undefined;
  if (turnstile !== undefined && (
    !turnstile || typeof turnstile !== "object" ||
    !("enabled" in turnstile) || typeof turnstile.enabled !== "boolean" ||
    (turnstile.enabled && (!("siteKey" in turnstile) || typeof turnstile.siteKey !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(turnstile.siteKey)))
  )) throw new Error("The Worker returned an invalid Turnstile configuration.");
  signal.throwIfAborted();
  gachaLog("info", "Worker health check passed");
  return { turnstile: turnstile as { enabled: boolean; siteKey?: string } | undefined };
}
