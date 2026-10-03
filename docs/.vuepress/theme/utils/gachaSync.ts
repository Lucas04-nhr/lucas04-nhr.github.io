import { compactAccounts, exportUigf, mergeAccounts, parseUigf, type GachaAccount } from "./gachaRecords";

export function personalApiBase(value: string): string {
  const url = new URL(value);
  if ((url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname))) || url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("Enter your own Worker HTTPS origin (HTTP is allowed for localhost only).");
  return url.origin;
}

export function validateSyncToken(token: string) {
  if (!/^\S{32,512}$/.test(token)) throw new Error("Use a token of 32–512 non-whitespace characters.");
}

// Read a consistent snapshot before reconciliation. Each write is a separate
// transaction; conflicts stop immediately and are never retried blindly.
export async function synchronizePersonal(base: string, token: string, local: GachaAccount[], signal: AbortSignal, progress: (message: string) => void): Promise<GachaAccount[]> {
  base = personalApiBase(base);
  validateSyncToken(token);
  const post = async (body: Record<string, unknown>) => {
    const response = await fetch(`${base}/api/v1/personal/sync`, {
      method: "POST", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body), signal: AbortSignal.any([signal, AbortSignal.timeout(30000)]),
    });
    if (!response.ok) throw new Error(response.status === 409
      ? "Remote data changed. Sync stopped; reconcile again before retrying. Earlier batches may already be saved."
      : `Personal sync failed (HTTP ${response.status}). Check your token, migrations and allowed frontend origin. Earlier batches may already be saved.`);
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
  const validated = remote.length ? parseUigf(exportUigf(remote)) : [];
  const merged = compactAccounts(mergeAccounts(local, validated).accounts);
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
  for (const [index, body] of batches.entries()) {
    progress(`Uploading batch ${index + 1} of ${batches.length}…`);
    const result = await post({ ...body, revision });
    if (result.revision <= revision!) throw new Error("Invalid write revision. Sync stopped.");
    revision = result.revision;
  }
  signal.throwIfAborted();
  return merged;
}
