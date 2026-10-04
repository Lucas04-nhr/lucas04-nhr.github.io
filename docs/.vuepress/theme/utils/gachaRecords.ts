import { fallbackGachaVersion } from "./gachaVersion";
// UIGF v4.2: keep record IDs as strings and server-local timestamps intact.
export const games = {
  hk4e: "Genshin Impact",
  hkrpg: "Honkai: Star Rail",
  nap: "Zenless Zone Zero",
  hk4e_ugc: "Miliastra Wonderland",
} as const;
export type Game = keyof typeof games;
export type SelectableGame = Exclude<Game, "hk4e_ugc">;
export const selectableGames = { hk4e: games.hk4e, hkrpg: games.hkrpg, nap: games.nap };
export const servers = {
  cn: { label: "Celestia / Irminsul", timezone: 8, overseas: false },
  asia: { label: "Asia", timezone: 8, overseas: true },
  europe: { label: "Europe", timezone: 1, overseas: true },
  america: { label: "America", timezone: -5, overseas: true },
  tw: { label: "TW / HK / MO", timezone: 8, overseas: true },
} as const;
export type ServerId = keyof typeof servers;
export const groupAccountKey = (account: GachaAccount) => `${account.game === "hk4e_ugc" ? "hk4e" : account.game}:${account.uid}`;
export interface AccountGroup {
  key: string;
  game: SelectableGame;
  uid: string;
  accounts: GachaAccount[];
  total: number;
}
export function groupAccounts(accounts: GachaAccount[]): AccountGroup[] {
  const groups = new Map<string, AccountGroup>();
  for (const account of accounts) {
    const key = groupAccountKey(account);
    const group = groups.get(key) ?? { key, game: account.game === "hk4e_ugc" ? "hk4e" : account.game, uid: account.uid, accounts: [], total: 0 };
    group.accounts.push(account);
    group.total += account.list.length;
    groups.set(key, group);
  }
  return [...groups.values()];
}
export function inferredServer(account: GachaAccount): string {
  if (account.timezone === 1) return servers.europe.label;
  if (account.timezone === -5) return servers.america.label;
  if (account.timezone !== 8) return `Server UTC${account.timezone >= 0 ? "+" : ""}${account.timezone}`;
  if (account.game === "hk4e" || account.game === "hk4e_ugc") {
    if (account.uid.startsWith("18") || account.uid.startsWith("8")) return servers.asia.label;
    if (account.uid.startsWith("9")) return servers.tw.label;
    if (/^[125]/.test(account.uid)) return servers.cn.label;
  }
  // Timezone alone cannot distinguish the three UTC+8 server regions.
  return "China / Asia / TW-HK-MO";
}
export const exportLanguages = { "en-us": "English", "zh-cn": "Simplified Chinese", "zh-tw": "Traditional Chinese", "ja-jp": "Japanese" } as const;
export type ExportLanguage = keyof typeof exportLanguages;
export const poolNames: Record<Game, Record<string, string>> = {
  hk4e: { "100": "Beginners' Wish", "200": "Standard Wish", "301": "Character Event Wish", "302": "Weapon Event Wish", "400": "Character Event Wish 2", "500": "Chronicled Wish" },
  hkrpg: { "1": "Stellar Warp", "2": "Departure Warp", "11": "Character Event Warp", "12": "Light Cone Event Warp", "21": "Character Collaboration Warp", "22": "Light Cone Collaboration Warp" },
  nap: { "1": "Stable Channel", "2": "Exclusive Channel", "3": "W-Engine Channel", "5": "Bangboo Channel" },
  hk4e_ugc: { "1000": "Standard Evocation", "2000": "Event Evocation", "20011": "Event Evocation", "20012": "Event Evocation", "20021": "Event Evocation", "20022": "Event Evocation" },
};
export interface GachaRecord {
  id: string;
  item_id: string;
  time: string;
  gacha_type?: string;
  uigf_gacha_type?: string;
  gacha_id?: string;
  count?: string;
  name?: string;
  item_name?: string;
  item_type?: string;
  rank_type?: string;
  schedule_id?: string;
  op_gacha_type?: string;
  [key: string]: unknown;
}
export interface GachaAccount {
  game: Game;
  uid: string;
  timezone: number;
  lang?: string;
  list: GachaRecord[];
}
export interface ItemMetadata {
  name: string;
  rank: number | null;
  type: string | null;
  icon: string | null;
}
export type Metadata = Record<string, ItemMetadata>;
const languages = new Set("de-de en-us es-es fr-fr id-id it-it ja-jp ko-kr pt-pt ru-ru th-th tr-tr vi-vn zh-cn zh-tw".split(" "));
const timestamp = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  return value as Record<string, unknown>;
}
function identifier(value: unknown, label: string): string {
  if (typeof value === "number" && !Number.isSafeInteger(value)) throw new Error(`${label} exceeds the safe integer range; use a string.`);
  if ((typeof value !== "string" && typeof value !== "number") || !/^\d+$/.test(String(value))) throw new Error(`${label} must be a decimal ID.`);
  return String(value);
}

export function validateRecord(value: unknown, game: Game): GachaRecord {
  const row = object(value, "Record");
  for (const field of ["id", "item_id", "time"]) {
    if (typeof row[field] !== "string") throw new Error(`Record ${field} must be a string.`);
  }
  if (!/^\d{1,19}$/.test(row.id as string) || !/^\d+$/.test(row.item_id as string)) throw new Error("Invalid record or item ID.");
  if (!timestamp.test(row.time as string)) throw new Error("Record time must use YYYY-MM-DD HH:mm:ss.");
  for (const field of ["count", "name", "item_name", "item_type", "rank_type", "gacha_type", "uigf_gacha_type", "gacha_id", "schedule_id", "op_gacha_type"]) {
    if (row[field] !== undefined && typeof row[field] !== "string") throw new Error(`${field} must be a string.`);
  }
  if (game === "hk4e_ugc") {
    for (const field of ["schedule_id", "rank_type", "op_gacha_type"]) {
      if (typeof row[field] !== "string") throw new Error(`Miliastra record is missing ${field}.`);
    }
    if (!/^\d+$/.test(row.schedule_id as string) || !/^\d+$/.test(row.rank_type as string) || !poolNames[game][row.op_gacha_type as string]) throw new Error("Invalid Miliastra pool, rank or schedule ID.");
  } else {
    if (!poolNames[game][row.gacha_type as string]) throw new Error("Unsupported pool type; check the game and UIGF version.");
    if (game === "hk4e") {
      const expected = row.gacha_type === "400" ? "301" : row.gacha_type;
      if (row.uigf_gacha_type !== expected) throw new Error("Genshin uigf_gacha_type does not match gacha_type.");
    }
    if (game === "hkrpg" && typeof row.gacha_id !== "string") throw new Error("Star Rail record is missing gacha_id.");
  }
  return { ...row } as GachaRecord;
}

export function parseUigf(value: unknown): GachaAccount[] {
  const root = object(value, "UIGF file");
  const info = object(root.info, "info");
  if (!["v4.0", "v4.1", "v4.2"].includes(String(info.version))) throw new Error("Supported formats: UIGF v4.0–v4.2. Upgrade older UIGF / SRGF files with UIGF Upgrader first.");
  if ((typeof info.export_timestamp !== "string" && !Number.isInteger(info.export_timestamp)) || typeof info.export_app !== "string" || typeof info.export_app_version !== "string") throw new Error("info is missing the export timestamp, app name or app version.");
  const accounts: GachaAccount[] = [];
  for (const game of Object.keys(games) as Game[]) {
    if (root[game] === undefined) continue;
    if (!Array.isArray(root[game])) throw new Error(`${game} must be an array of accounts.`);
    for (const entry of root[game] as unknown[]) {
      const account = object(entry, "Account");
      const uid = identifier(account.uid, "UID");
      if (!Number.isInteger(account.timezone) || Number(account.timezone) < -12 || Number(account.timezone) > 14) throw new Error(`${uid} requires a valid integer timezone.`);
      if (account.lang !== undefined && (typeof account.lang !== "string" || !languages.has(account.lang))) throw new Error(`Invalid language code for ${uid}.`);
      if (!Array.isArray(account.list)) throw new Error(`The list for ${uid} must be an array.`);
      // Legacy ZZZ archives incorrectly marked server-local UTC+8 times as UTC+0.
      accounts.push({ game, uid, timezone: game === "nap" && account.timezone === 0 ? 8 : account.timezone as number, ...(account.lang === undefined ? {} : { lang: account.lang as string }), list: account.list.map(row => validateRecord(row, game)) });
    }
  }
  if (!accounts.length) throw new Error("No supported game accounts found in this file.");
  return mergeAccounts([], accounts).accounts;
}

// Store language-independent record data; names and item types come from metadata.
export function compactAccounts(accounts: GachaAccount[]): GachaAccount[] {
  const fields = ["id", "item_id", "time", "gacha_type", "uigf_gacha_type", "gacha_id", "count", "rank_type", "schedule_id", "op_gacha_type"];
  return accounts.map(({ game, uid, timezone, list }) => ({
    game, uid, timezone,
    list: list.map(row => Object.fromEntries(fields.filter(field => row[field] !== undefined).map(field => [field, row[field]])) as GachaRecord),
  }));
}

export const accountKey = (account: GachaAccount) => `${account.game}:${account.uid}`;
export function compareIds(a: string, b: string): number {
  const left = BigInt(a), right = BigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}
export function mergeAccounts(existing: GachaAccount[], incoming: GachaAccount[], correctTimes = false) {
  const result = new Map(existing.map(account => [accountKey(account), { ...account, list: [...account.list] }]));
  let added = 0, duplicates = 0, corrected = 0;
  for (const account of incoming) {
    const key = accountKey(account);
    const target = result.get(key);
    if (target && target.timezone !== account.timezone) throw new Error(`Timezone conflict for ${games[account.game]} ${account.uid}. Nothing was merged; check the server timezone in the source file.`);
    const rows = new Map((target?.list ?? []).map(row => [BigInt(row.id).toString(), row]));
    for (const row of account.list) {
      const id = BigInt(row.id).toString();
      const prior = rows.get(id);
      if (prior) {
        if (prior.item_id !== row.item_id || (!correctTimes && prior.time !== row.time) || poolKey(prior, account.game) !== poolKey(row, account.game)) throw new Error(`Conflicting record ${row.id}. Nothing was merged.`);
        duplicates++;
        // Retain existing optional information when the incoming row omits it.
        if (correctTimes && prior.time !== row.time) corrected++;
        rows.set(id, { ...row, ...prior, time: correctTimes ? row.time : prior.time });
      } else { rows.set(id, { ...row }); added++; }
    }
    const merged = { ...(target ?? account), list: [...rows.values()].sort((a, b) => compareIds(a.id, b.id)) };
    // A merged archive can contain names from several languages. Do not label
    // those records as a single language until explicitly localized on export.
    if (target && target.lang !== account.lang) delete merged.lang;
    result.set(key, merged);
  }
  return { accounts: [...result.values()], added, duplicates, corrected };
}

export function exportUigf(accounts: GachaAccount[], appVersion = fallbackGachaVersion) {
  const output: Record<string, unknown> = { info: { export_timestamp: Math.floor(Date.now() / 1000), export_app: "Gacha Manager Demo by Lucas", export_app_version: appVersion, version: "v4.2" } };
  for (const game of Object.keys(games) as Game[]) {
    const selected = accounts.filter(account => account.game === game);
    if (selected.length) output[game] = selected.map(({ game: _game, ...account }) => ({ ...account, list: account.list.map(row => validateRecord(row, game)) }));
  }
  return output;
}

const itemTypes: Record<ExportLanguage, Record<string, string>> = {
  "en-us": { character: "Character", weapon: "Weapon", light_cone: "Light Cone", w_engine: "W-Engine", bangboo: "Bangboo", outfit: "Outfit", ugc_item: "Item" },
  "zh-cn": { character: "角色", weapon: "武器", light_cone: "光锥", w_engine: "音擎", bangboo: "邦布", outfit: "装扮", ugc_item: "物品" },
  "zh-tw": { character: "角色", weapon: "武器", light_cone: "光錐", w_engine: "音擎", bangboo: "邦布", outfit: "裝扮", ugc_item: "物品" },
  "ja-jp": { character: "キャラクター", weapon: "武器", light_cone: "光円錐", w_engine: "音動機", bangboo: "ボンプ", outfit: "衣装", ugc_item: "アイテム" },
};

// Work on a copy: export localization must never rewrite the saved archive.
export function localizeAccount(account: GachaAccount, lang: ExportLanguage, metadata: Metadata): GachaAccount {
  return { ...account, lang, list: account.list.map(row => {
    const item = metadata[row.item_id];
    if (!item?.name) throw new Error(`Missing ${lang} metadata for ${games[account.game]} item ${row.item_id}. Choose another language or retry the metadata lookup.`);
    const copy = { ...row };
    delete copy.name;
    delete copy.item_name;
    delete copy.item_type;
    if (account.game === "hk4e_ugc") copy.item_name = item.name;
    else copy.name = item.name;
    const type = item.type ? itemTypes[lang][item.type] : undefined;
    if (type) copy.item_type = type;
    else if (account.game === "hk4e_ugc") throw new Error(`Missing item type for Miliastra item ${row.item_id}. Retry the metadata lookup.`);
    if (!copy.rank_type && item.rank !== null) copy.rank_type = String(account.game === "nap" ? item.rank - 1 : item.rank);
    return validateRecord(copy, account.game);
  }) };
}

// Interpret the stored wall clock using its fixed server offset. The device's
// timezone (including daylight saving time at that instant) is display-only.
export function deviceRecordTime(time: string, timezone: number): string {
  const offset = `${timezone >= 0 ? "+" : "-"}${String(Math.abs(timezone)).padStart(2, "0")}:00`;
  const date = new Date(`${time.replace(" ", "T")}${offset}`);
  if (Number.isNaN(date.getTime())) return time;
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function poolKey(row: GachaRecord, game: Game): string {
  if (game === "hk4e") return row.uigf_gacha_type ?? (row.gacha_type === "400" ? "301" : row.gacha_type!);
  // Miliastra pools cannot be assumed to share pity; keep each op type separate.
  return game === "hk4e_ugc" ? row.op_gacha_type! : row.gacha_type!;
}
export function recordRank(row: GachaRecord, game: Game, metadata: Metadata = {}): number | null {
  const raw = Number(row.rank_type);
  if (row.rank_type && Number.isInteger(raw)) {
    const rank = game === "nap" ? raw + 1 : raw;
    if (rank >= 1 && rank <= 5) return rank;
  }
  return metadata[row.item_id]?.rank ?? null;
}
export function statistics(rows: GachaRecord[], game: Game, metadata: Metadata = {}, rankFor: (row: GachaRecord) => number | null = row => recordRank(row, game, metadata), topRank = 5) {
  const ordered = [...rows].sort((a, b) => compareIds(a.id, b.id));
  let gold = 0, purple = 0, unknown = 0, sinceGold = 0;
  let previousGold = false;
  const intervals: number[] = [];
  const goldHistory: { record: GachaRecord; pulls: number; partial: boolean }[] = [];
  for (const row of ordered) {
    const rank = rankFor(row);
    sinceGold++;
    if (rank === null) unknown++;
    if (rank === topRank - 1) purple++;
    if (rank === topRank) {
      gold++;
      goldHistory.push({ record: row, pulls: sinceGold, partial: !previousGold });
      if (previousGold) intervals.push(sinceGold);
      previousGold = true;
      sinceGold = 0;
    }
  }
  return { total: rows.length, gold, purple, unknown, sinceGold, hasGold: previousGold, goldHistory: goldHistory.reverse(), goldRate: rows.length ? gold / rows.length * 100 : 0, average: intervals.length ? intervals.reduce((a, b) => a + b, 0) / intervals.length : null };
}
