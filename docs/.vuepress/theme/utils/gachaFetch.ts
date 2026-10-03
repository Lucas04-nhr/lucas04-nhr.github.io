import { accountKey, compareIds, localizeAccount, poolKey, poolNames, servers, validateRecord, type ExportLanguage, type GachaAccount, type Game, type ItemMetadata, type Metadata, type SelectableGame, type ServerId } from "./gachaRecords";
import { fetchWithGachaHelper } from "./gachaTransport";

const hosts: Record<Game, [string, string]> = {
  hk4e: ["public-operation-hk4e.mihoyo.com", "public-operation-hk4e-sg.hoyoverse.com"],
  hk4e_ugc: ["public-operation-hk4e.mihoyo.com", "public-operation-hk4e-sg.hoyoverse.com"],
  hkrpg: ["public-operation-hkrpg.mihoyo.com", "public-operation-hkrpg-sg.hoyoverse.com"],
  nap: ["public-operation-common.mihoyo.com", "public-operation-nap-sg.hoyoverse.com"],
};
const paths: Record<Game, string> = {
  hk4e: "/gacha_info/api/getGachaLog",
  hk4e_ugc: "/gacha_info/api/getBeyondGachaLog",
  hkrpg: "/common/hkrpg_gacha_record/api/getGachaLog",
  nap: "/common/gacha_record/api/getGachaLog",
};

// Endpoint and parameter conventions checked against Starward's gacha clients.
export function parseRecordUrl(input: string, game: Game): URL {
  let source: URL;
  try { source = new URL(input.trim()); } catch { throw new Error("Enter a complete HTTPS gacha history URL."); }
  if (source.protocol !== "https:" || source.username || source.password) throw new Error("Only official HTTPS gacha history URLs are accepted.");
  const legacyZzzCn = game === "nap" && source.hostname === "public-operation-nap.mihoyo.com";
  const cn = source.hostname === hosts[game][0] || source.hostname === "webstatic.mihoyo.com" || legacyZzzCn;
  const global = source.hostname === hosts[game][1] || source.hostname === "gs.hoyoverse.com";
  if (!cn && !global) throw new Error("The URL host does not match the selected game. Use an official history URL.");
  // Authkeys use Base64: a literal '+' is part of the key, not a form-space.
  // Normalize before URLSearchParams reads/re-serializes the query. Already
  // percent-encoded keys remain unchanged and are decoded exactly once.
  source.search = source.search.replace(/([?&]authkey=)([^&]*)/g, (_, prefix: string, value: string) => prefix + value.replace(/\+/g, "%2B"));
  if (!source.searchParams.get("authkey")) throw new Error("Missing authkey. Open the in-game history again and obtain a fresh URL.");
  const result = new URL(`https://${hosts[game][cn ? 0 : 1]}${paths[game]}`);
  // Preserve official authentication parameters, discard the webpage fragment.
  result.search = source.search;
  for (const key of ["page", "size", "end_id", "gacha_type", "real_gacha_type"]) result.searchParams.delete(key);
  return result;
}

async function fetchJson(url: URL, signal: AbortSignal, useHelper = false): Promise<Record<string, unknown>> {
  if (useHelper) return fetchWithGachaHelper(url, signal);
  // Browser supplies its own cross-origin headers. No proxy, custom headers,
  // cookies, or referrer containing the user's authkey are sent.
  const response = await fetch(url, { credentials: "omit", referrerPolicy: "no-referrer", signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]) });
  if (!response.ok) throw new Error(`The API returned HTTP ${response.status}.`);
  const body: unknown = await response.json();
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("The API returned invalid JSON.");
  return body as Record<string, unknown>;
}

function pause(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const cancel = () => { clearTimeout(timer); reject(new DOMException("Cancelled", "AbortError")); };
    const timer = setTimeout(() => { signal.removeEventListener("abort", cancel); resolve(); }, 350);
    if (signal.aborted) cancel();
    else signal.addEventListener("abort", cancel, { once: true });
  });
}

export interface FetchOptions {
  game: Game;
  link: string;
  timezone: number;
  existing: GachaAccount[];
  incremental: boolean;
  useHelper?: boolean;
  signal: AbortSignal;
  progress: (message: string) => void;
  onPage: (account: GachaAccount) => void;
}

export async function fetchGameRecords(options: Omit<FetchOptions, "game" | "timezone"> & { game: SelectableGame; server: ServerId }): Promise<number> {
  const config = servers[options.server];
  const url = parseRecordUrl(options.link, options.game);
  if (url.hostname.endsWith("hoyoverse.com") !== config.overseas) throw new Error("The selected server region does not match this URL. Choose Mainland China or an overseas server to match your link.");
  let uid: string | undefined;
  const onPage = (account: GachaAccount) => {
    if (uid && uid !== account.uid) throw new Error("UID differs between Genshin and Miliastra records. Fetching stopped.");
    uid = account.uid;
    options.onPage(account);
  };
  let total = 0;
  for (const namespace of (options.game === "hk4e" ? ["hk4e", "hk4e_ugc"] : [options.game]) as Game[]) {
    total += await fetchRecords({ ...options, game: namespace, timezone: config.timezone, onPage,
      progress: message => options.progress(`${namespace === "hk4e_ugc" ? "Miliastra Wonderland" : options.game === "hk4e" ? "Genshin wishes" : "Gacha history"} · ${message}`),
    });
  }
  return total;
}

export async function fetchRecords(options: FetchOptions): Promise<number> {
  const { game, signal } = options;
  const base = parseRecordUrl(options.link, game);
  const lang = "en-us";
  base.searchParams.set("lang", lang);
  const size = game === "hk4e_ugc" ? 5 : 20;
  const queryTypes = game === "hk4e_ugc" ? ["1000", "2000"] : game === "hk4e" ? ["100", "200", "301", "302", "500"] : Object.keys(poolNames[game]);
  // ZZZ rerun channels return the UIGF gacha_type 2/3 and use separate query IDs.
  if (game === "nap") queryTypes.push("102", "103");
  let total = 0;
  let sessionUid: string | undefined;
  for (const type of queryTypes) {
    let cursor = "0";
    const seen = new Set<string>();
    for (let page = 1; page <= 10000; page++) {
      signal.throwIfAborted();
      options.progress(`${poolNames[game][type] ?? `Pool ${type}`} · Page ${page} · ${total} records read`);
      const url = new URL(base);
      if (game === "hkrpg" && ["21", "22"].includes(type)) url.pathname = url.pathname.replace("getGachaLog", "getLdGachaLog");
      url.searchParams.set(game === "nap" ? "real_gacha_type" : "gacha_type", type);
      url.searchParams.set("page", String(page));
      url.searchParams.set("size", String(size));
      url.searchParams.set("end_id", cursor);
      const body = await fetchJson(url, signal, options.useHelper);
      if (body.retcode !== 0) {
        const message = typeof body.message === "string" ? body.message : "Refresh your URL and try again";
        const authError = /auth[ _-]?key/i.test(message) || body.retcode === -101;
        throw new Error(`Official API error ${String(body.retcode)}: ${message}${authError ? ". Reopen the in-game history and copy a fresh URL for the selected game and server. An expired authkey cannot be renewed from this link alone." : ""}`);
      }
      const data = body.data as { list?: unknown[] } | undefined;
      if (!data || !Array.isArray(data.list)) throw new Error("The official API did not return a record list.");
      if (!data.list.length) break;
      let uid = "";
      const rows = data.list.map(value => {
        if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid official record format.");
        const raw = { ...value } as Record<string, unknown>;
        // Official special-item endpoints may use numeric fields. Convert only
        // safe integers; never round a large record ID before UIGF validation.
        for (const field of ["uid", "id", "item_id", "rank_type", "gacha_type", "gacha_id", "schedule_id", "op_gacha_type", "count"]) {
          if (typeof raw[field] === "number") {
            if (!Number.isSafeInteger(raw[field])) throw new Error(`Official ${field} exceeds the safe integer range. Fetching stopped to avoid corrupting IDs.`);
            raw[field] = String(raw[field]);
          }
        }
        if (typeof raw.uid !== "string" || !/^\d+$/.test(raw.uid)) throw new Error("The official record is missing a string UID.");
        if (uid && uid !== raw.uid) throw new Error("Multiple accounts returned; fetching stopped.");
        uid = raw.uid;
        delete raw.uid;
        if (game === "hk4e") raw.uigf_gacha_type = raw.gacha_type === "400" ? "301" : raw.gacha_type;
        return validateRecord(raw, game);
      });
      if (sessionUid && sessionUid !== uid) throw new Error("UID changed between pages; fetching stopped.");
      sessionUid = uid;
      const account: GachaAccount = { game, uid, timezone: options.timezone, lang, list: rows };
      const existing = options.existing.find(item => accountKey(item) === accountKey(account));
      // A full scan is required for rerun channels: they share a UIGF pool but
      // may contain older records missing from a previous normal-channel fetch.
      const canStop = options.incremental && !["102", "103"].includes(type);
      const previous = existing?.list.filter(row => game === "hk4e_ugc" ? (type === "1000" ? row.op_gacha_type === "1000" : row.op_gacha_type !== "1000") : poolKey(row, game) === poolKey(rows[0], game));
      const newest = previous?.reduce<string | undefined>((max, row) => !max || compareIds(row.id, max) > 0 ? row.id : max, undefined);
      options.onPage(account);
      total += rows.length;
      const next = rows[rows.length - 1].id;
      if (rows.length < size || (canStop && newest && rows.some(row => compareIds(row.id, newest) <= 0))) break;
      if (seen.has(next) || compareIds(next, cursor) >= 0 && cursor !== "0") throw new Error("The pagination cursor did not advance. Fetching stopped; fetched records are retained.");
      if (page === 10000) throw new Error("Page limit exceeded; fetching stopped.");
      seen.add(next);
      cursor = next;
      await pause(signal);
    }
    await pause(signal);
  }
  return total;
}

export async function fetchMetadata(game: Game, ids: string[], signal: AbortSignal, lang: ExportLanguage = "en-us"): Promise<Metadata> {
  const result: Metadata = {};
  const unique = [...new Set(ids)].filter(id => /^\d{1,20}$/.test(id));
  for (let offset = 0; offset < unique.length; offset += 90) {
    const url = new URL("https://gachameta.lucas04.top/api/v1/items");
    url.search = new URLSearchParams({ game, lang, ids: unique.slice(offset, offset + 90).join(",") }).toString();
    const body = await fetchJson(url, signal);
    if (!Array.isArray(body.items)) throw new Error("Invalid metadata API response.");
    for (const item of body.items as (ItemMetadata & { item_id: string })[]) {
      if (typeof item.item_id === "string" && typeof item.name === "string") result[item.item_id] = { name: item.name, rank: typeof item.rank === "number" && item.rank >= 1 && item.rank <= 5 ? item.rank : null, type: typeof item.type === "string" ? item.type : null, icon: typeof item.icon === "string" && /^https:\/\//.test(item.icon) ? item.icon : null };
    }
  }
  return result;
}

export async function prepareExportAccounts(accounts: GachaAccount[], language: ExportLanguage, signal: AbortSignal): Promise<GachaAccount[]> {
  const byGame: Partial<Record<Game, Metadata>> = {};
  for (const game of [...new Set(accounts.map(account => account.game))]) {
    byGame[game] = await fetchMetadata(game, accounts.filter(account => account.game === game).flatMap(account => account.list.map(row => row.item_id)), signal, language);
  }
  return accounts.map(account => localizeAccount(account, language, byGame[account.game]!));
}
