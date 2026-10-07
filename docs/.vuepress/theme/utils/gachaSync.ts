import { checkGachaHealth } from "./gachaHealth";
import { createUploadProgress } from "./gachaUploadProgress";
import { gachaLog } from "./gachaLog";
import { gachaApiError } from "./gachaApiError";
import { accountKey, compactAccounts, exportUigf, mergeAccounts, parseUigf, type GachaAccount } from "./gachaRecords";

export function personalApiBase(value: string): string {
  const url = new URL(value);
  const octets = url.hostname.split(".").map(Number);
  const localIpv4 = octets.length === 4 && octets.every(octet => Number.isInteger(octet) && octet >= 0 && octet <= 255)
    && (octets[0] === 10 || octets[0] === 127
      || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
      || (octets[0] === 192 && octets[1] === 168));
  const localHost = url.hostname === "localhost" || localIpv4;
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && localHost)) || url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Enter your own Worker HTTPS origin (HTTP is allowed for localhost only).");
  return url.origin;
}

export function validateSyncToken(token: string) {
  if (!/^[\x21-\x7E]{32,64}$/.test(token)) throw new Error("Use a token of 32–64 characters containing only uppercase or lowercase English letters, digits and ASCII symbols, without spaces.");
}

export async function authorizePersonalSession(base: string, token: string, turnstileToken: string, signal: AbortSignal, operation = "Sync authorization") {
  base = personalApiBase(base);
  validateSyncToken(token);
  const response = await fetch(`${base}/api/v1/personal/session`, {
    method: "POST", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ turnstileToken }), signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
  });
  if (!response.ok) throw await gachaApiError(response, operation);
  const result = await response.json();
  if (!result || typeof result.sessionToken !== "string" || !/^[\x21-\x7E]{1,4096}$/.test(result.sessionToken) ||
    !Number.isSafeInteger(result.expiresAt) || result.expiresAt <= Date.now())
    throw new Error("Invalid sync session response.");
  return { sessionToken: result.sessionToken as string, expiresAt: result.expiresAt as number };
}

// Existing bearer-only Workers have no session endpoint. A minimal read checks
// authentication without writing remote records or retaining the response.
export async function verifyPersonalToken(base: string, token: string, signal: AbortSignal): Promise<void> {
  base = personalApiBase(base);
  validateSyncToken(token);
  const response = await fetch(`${base}/api/v1/personal/sync`, {
    method: "POST", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ action: "list", limit: 1 }), signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
  });
  if (!response.ok) throw await gachaApiError(response, "Connection token verification");
  const result = await response.json();
  if (!result || !Array.isArray(result.accounts) || !Number.isSafeInteger(result.revision) || result.revision < 0)
    throw new Error("Invalid token verification response.");
}

// This endpoint verifies a challenge only; it must not grant personal access.
export async function verifyGachaConnection(base: string, turnstileToken: string, signal: AbortSignal): Promise<void> {
  base = personalApiBase(base);
  const response = await fetch(`${base}/api/v1/connection/verify`, {
    method: "POST", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnstileToken }), signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
  });
  if (!response.ok) throw await gachaApiError(response, "Connection verification");
  const result = await response.json();
  if (!result || result.verified !== true) throw new Error("Invalid connection verification response.");
}

export type PersonalSyncMode = "merge" | "pull" | "push";

// Read a consistent snapshot before reconciliation. Each write is a separate
// transaction; conflicts stop immediately and are never retried blindly.
export async function synchronizePersonal(base: string, token: string, local: GachaAccount[], signal: AbortSignal, progress: (message: string, percentage?: number) => void, preferLocalTimes = false, mode: PersonalSyncMode = "merge", verifyTurnstile?: (siteKey: string, signal: AbortSignal) => Promise<string>): Promise<GachaAccount[]> {
  base = personalApiBase(base);
  validateSyncToken(token);
  progress("Checking sync protection…");
  const health = await checkGachaHealth(base, signal);
  let session: string | undefined;
  let expiresAt = 0;
  if (health.turnstile?.enabled) {
    if (!verifyTurnstile) throw new Error("This Worker requires Turnstile verification. Update the frontend.");
    progress("Complete the security verification…");
    const turnstileToken = await verifyTurnstile(health.turnstile.siteKey!, signal);
    signal.throwIfAborted();
    progress("Authorizing sync…");
    const result = await authorizePersonalSession(base, token, turnstileToken, signal);
    session = result.sessionToken;
    expiresAt = result.expiresAt;
  }
  const post = async (body: Record<string, unknown>) => {
    signal.throwIfAborted();
    if (session && Date.now() >= expiresAt) throw new Error("Sync authorization expired. Start sync again to verify and reconcile; earlier batches may already be saved.");
    gachaLog("info", `Sync request: ${body.action}`);
    const response = await fetch(`${base}/api/v1/personal/sync`, {
      method: "POST", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(session ? { "X-Gacha-Sync-Session": session } : {}) },
      body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok) {
      const error = await gachaApiError(response, "Personal sync");
      throw new Error(`${error.message} Sync stopped; earlier upload batches may already be saved. Retry only after reading and reconciling again.`);
    }
    const result = await response.json();
    if (!result || !Number.isSafeInteger(result.revision) || result.revision < 0) throw new Error("Invalid sync response.");
    return result;
  };
  let revision: number | undefined;
  const checkPage = (payload: { revision: number; next: unknown }, previous: string | undefined) => {
    if (revision !== undefined && payload.revision !== revision) throw new Error("Remote data changed during download. Retry sync to read a consistent snapshot.");
    revision = payload.revision;
    if (payload.next !== null && (typeof payload.next !== "string" || !payload.next || payload.next === previous)) throw new Error("Invalid sync cursor.");
  };
  progress("Reading remote accounts…");
  const remote: GachaAccount[] = [];
  let after: string | undefined;
  do {
    const page = await post({ action: "list", limit: 500, ...(after ? { after } : {}) });
    checkPage(page, after);
    if (!Array.isArray(page.accounts)) throw new Error("Invalid remote accounts.");
    for (const entry of page.accounts) remote.push({ ...entry, list: [] });
    after = page.next ?? undefined;
  } while (after);
  for (const account of remote) {
    progress("Downloading remote records…");
    after = undefined;
    do {
      const page = await post({ action: "read", game: account.game, uid: account.uid, limit: 500, ...(after ? { after } : {}) });
      checkPage(page, after);
      if (!page.account || page.account.game !== account.game || page.account.uid !== account.uid || page.account.timezone !== account.timezone || !Array.isArray(page.list)) throw new Error("Invalid remote account response.");
      account.list.push(...page.list);
      after = page.next ?? undefined;
    } while (after);
  }
  progress("Remote records downloaded. Reconciling…", mode === "pull" ? 1 : 0.5);
  const validated = remote.length ? parseUigf(exportUigf(remote)) : [];
  if (mode === "pull") {
    signal.throwIfAborted();
    gachaLog("warning", "Remote snapshot replaces all local records", { accounts: validated.length });
    return compactAccounts(validated);
  }
  const localValidated = local.length ? parseUigf(exportUigf(local)) : [];
  // Local timestamps are authoritative only when explicitly requested after correction.
  const reconciliation = mode === "push"
    ? { accounts: localValidated, corrected: 0 }
    : preferLocalTimes
    ? mergeAccounts(validated, local, true)
    : mergeAccounts(local, validated);
  if (reconciliation.corrected) gachaLog("warning", "Sync time conflicts resolved using local timestamps", { corrected: reconciliation.corrected });
  const merged = compactAccounts(reconciliation.accounts);
  // Precompute every batch before writing; record validation and size errors
  // cannot cause an avoidable partial upload.
  const batches: Record<string, unknown>[] = [];
  for (const account of merged) {
    for (let offset = 0; offset < Math.max(1, account.list.length); offset += 500) {
      const body = { action: "write", game: account.game, uid: BigInt(account.uid).toString(), timezone: account.timezone,
        list: account.list.slice(offset, offset + 500).map(row => ({ ...row, id: BigInt(row.id).toString(), item_id: BigInt(row.item_id).toString() })) };
      if (new TextEncoder().encode(JSON.stringify({ ...body, revision: Number.MAX_SAFE_INTEGER })).length > 1024 * 1024) throw new Error("Sync batch exceeds 1 MiB.");
      batches.push(body);
    }
  }
  if (mode === "push") {
    gachaLog("warning", "Local snapshot replaces all remote records", { accounts: merged.length });
    const localByKey = new Map(merged.map(account => [accountKey(account), account]));
    for (const account of validated) {
      const replacement = localByKey.get(accountKey(account));
      if (!replacement) {
        batches.push({ action: "delete_account", game: account.game, uid: BigInt(account.uid).toString() });
        continue;
      }
      const ids = new Set(replacement.list.map(row => BigInt(row.id).toString()));
      const deletes = account.list.filter(row => !ids.has(BigInt(row.id).toString())).map(row => BigInt(row.id).toString());
      for (let offset = 0; offset < deletes.length; offset += 500) {
        batches.push({ action: "write", game: account.game, uid: BigInt(account.uid).toString(), timezone: replacement.timezone,
          list: [], delete_ids: deletes.slice(offset, offset + 500) });
      }
    }
  }
  if (batches.length) {
    const uploadProgress = createUploadProgress(batches.length, percentage => {
      const overall = 50 + percentage / 2;
      progress(`Uploading personal records… ${percentage}%`, overall / 100);
    });
    try {
      for (const [index, body] of batches.entries()) {
        const result = await post({ ...body, revision });
        if (result.revision <= revision!) throw new Error("Invalid write revision. Sync stopped.");
        revision = result.revision;
        uploadProgress.committed();
        gachaLog("info", "Sync batch committed", { batch: index + 1, batches: batches.length });
      }
      await uploadProgress.finish(signal);
    } finally {
      uploadProgress.stop();
    }
  }
  signal.throwIfAborted();
  return merged;
}
