<script setup lang="ts">
import VPButton from "@theme/VPButton.vue";
import CardGrid from "@theme/global/VPCardGrid.vue";
import RepoCard from "vuepress-theme-plume/features/RepoCard.vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { exportLanguages, exportUigf, games, groupAccountKey, groupAccounts, inferredServer, mergeAccounts, parseUigf, poolKey, poolNames, recordRank, selectableGames, servers, statistics, type ExportLanguage, type GachaAccount, type GachaRecord, type Game, type Metadata, type SelectableGame, type ServerId } from "../theme/utils/gachaRecords";
import { fetchGameRecords, fetchMetadata, prepareExportAccounts } from "../theme/utils/gachaFetch";
import { detectGachaHelper } from "../theme/utils/gachaTransport";
import { applyGachaFetchPreference, gachaFetchAllowed } from "../theme/utils/gachaFetchPreference";

const STORAGE_KEY = "lucas-gacha-manager-uigf-v4";
const accounts = ref<GachaAccount[]>([]);
const selectedKey = ref("");
const selectedPool = ref("all");
const game = ref<SelectableGame>("hk4e");
const link = ref("");
const server = ref<ServerId>("cn");
const serverByAccount = ref<Record<string, ServerId>>({});
const incremental = ref(true);
const busy = ref(false);
const metadataBusy = ref(false);
const ready = ref(false);
const status = ref("");
const error = ref("");
const storageError = ref("");
const metadataStatus = ref("");
const exportLanguage = ref<ExportLanguage | "original">("original");
const exporting = ref(false);
let exportRequest: AbortController | undefined;
const metadata = ref<Partial<Record<Game, Metadata>>>({});
const rankFilter = ref("all");
const search = ref("");
const page = ref(1);
const pendingDelete = ref(false);
const helperState = ref<"checking" | "available" | "unavailable">("checking");
let helperCheck: AbortController | undefined;
let request: AbortController | undefined;
let metadataRequest: AbortController | undefined;
const displayAccounts = computed(() => groupAccounts(accounts.value));
const selected = computed(() => displayAccounts.value.find(account => account.key === selectedKey.value));
const allRows = computed(() => selected.value?.accounts.flatMap(account => account.list.map(row => ({ ...row, __game: account.game, __timezone: account.timezone }))) ?? []);
function rowGame(row: GachaRecord): Game { return row.__game as Game; }
function rowMetadata(row: GachaRecord): Metadata { return metadata.value[rowGame(row)] ?? {}; }
function itemMetadata(row: GachaRecord) { return rowMetadata(row)[row.item_id]; }
function itemName(row: GachaRecord) { return itemMetadata(row)?.name ?? row.name ?? row.item_name ?? row.item_id; }
function rowRank(row: GachaRecord) { return recordRank(row, rowGame(row), rowMetadata(row)); }
function displayPoolKey(row: GachaRecord) { return `${rowGame(row)}:${poolKey(row, rowGame(row))}`; }
function displayPoolName(key: string) {
  const [namespace, type] = key.split(":") as [Game, string];
  return `${namespace === "hk4e_ugc" ? "Miliastra · " : ""}${poolNames[namespace][type] ?? type}`;
}
function serverName() {
  if (!selected.value) return "Server";
  const stored = serverByAccount.value[selected.value.key];
  if (stored) return stored === "cn" && selected.value.game !== "hk4e" ? "Mainland China" : servers[stored].label;
  return inferredServer(selected.value.accounts[0]);
}
const pools = computed(() => [...new Set(allRows.value.map(displayPoolKey))]);
const rows = computed(() => allRows.value.filter(row => selectedPool.value === "all" || displayPoolKey(row) === selectedPool.value));
const calculateStats = (list: GachaRecord[]) => statistics(list, selected.value?.game ?? game.value, {}, rowRank);
const stats = computed(() => calculateStats(rows.value));
const poolStats = computed(() => pools.value.map(key => ({ key, name: displayPoolName(key), ...calculateStats(allRows.value.filter(row => displayPoolKey(row) === key)) })));
const filtered = computed(() => [...rows.value].sort((a, b) => b.time.localeCompare(a.time) || (BigInt(a.id) < BigInt(b.id) ? 1 : -1)).filter(row =>
  (rankFilter.value === "all" || String(rowRank(row)) === rankFilter.value) && `${itemName(row)} ${row.item_id}`.toLowerCase().includes(search.value.toLowerCase())
));
const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / 50)));
const visible = computed(() => filtered.value.slice((page.value - 1) * 50, page.value * 50));
const totalRecords = computed(() => accounts.value.reduce((sum, account) => sum + account.list.length, 0));
watch(selectedKey, () => { selectedPool.value = "all"; pendingDelete.value = false; });
watch([selectedKey, selectedPool, rankFilter, search], () => { page.value = 1; });
watch(pageCount, count => { page.value = Math.min(page.value, count); });
watch(gachaFetchAllowed, allowed => {
  if (allowed && ready.value) void checkHelper();
  else if (!allowed) { helperCheck?.abort(); request?.abort(); link.value = ""; }
});

function save() {
  if (!ready.value) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ archive: exportUigf(accounts.value), servers: serverByAccount.value }));
    storageError.value = "";
  } catch {
    storageError.value = "Browser storage is unavailable or full. Records remain in memory. Export a backup now; refreshing may lose recent changes.";
  }
}
function merge(incoming: GachaAccount[]) {
  const result = mergeAccounts(accounts.value, incoming);
  accounts.value = result.accounts;
  if (!selectedKey.value && incoming.length) selectedKey.value = groupAccountKey(incoming[0]);
  save();
  return result;
}
onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const saved = JSON.parse(stored);
      const archive = saved.archive ?? saved;
      if (saved.servers && typeof saved.servers === "object") {
        for (const [key, value] of Object.entries(saved.servers)) {
          if (typeof value === "string" && Object.hasOwn(servers, value)) serverByAccount.value[key] = value as ServerId;
        }
      }
      if (Object.keys(games).some(key => archive[key]?.length)) accounts.value = parseUigf(archive);
      selectedKey.value = accounts.value[0] ? groupAccountKey(accounts.value[0]) : "";
    }
  } catch { storageError.value = "Could not read the local archive. It has not been overwritten. Check browser storage or import a backup."; }
  ready.value = true;
  const url = new URL(window.location.href);
  const wasEnabled = gachaFetchAllowed.value;
  const preference = url.searchParams.get("gachaFetchAllowed")?.trim().toLowerCase();
  applyGachaFetchPreference(preference === "true" ? true : preference === "false" ? false : null, url);
  if (wasEnabled && gachaFetchAllowed.value) void checkHelper();
});
onBeforeUnmount(() => { ready.value = false; request?.abort(); metadataRequest?.abort(); exportRequest?.abort(); helperCheck?.abort(); });

async function checkHelper() {
  helperCheck?.abort();
  const controller = new AbortController();
  helperCheck = controller;
  helperState.value = "checking";
  const available = await detectGachaHelper(controller.signal);
  if (!controller.signal.aborted) helperState.value = available ? "available" : "unavailable";
}

async function importFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = [...(input.files ?? [])];
  if (!files.length) return;
  error.value = "";
  busy.value = true;
  try {
    // Parse all files first, so one invalid file cannot cause a partial import.
    const incoming: GachaAccount[] = [];
    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) throw new Error(`${file.name} exceeds 50 MiB. Split the file before importing.`);
      incoming.push(...parseUigf(JSON.parse(await file.text())));
    }
    if (!ready.value) return;
    const result = merge(incoming);
    status.value = `Imported ${files.length} files: ${result.added} added, ${result.duplicates} duplicates skipped.`;
  } catch (err) { error.value = err instanceof Error ? err.message : "Import failed."; }
  finally { busy.value = false; input.value = ""; }
}

async function retrieve() {
  if (busy.value || !ready.value || !gachaFetchAllowed.value) return;
  busy.value = true;
  error.value = "";
  const controller = new AbortController();
  request = controller;
  let added = 0;
  try {
    const fetchServer = server.value;
    const total = await fetchGameRecords({ game: game.value, link: link.value, server: fetchServer, existing: accounts.value, incremental: incremental.value, useHelper: helperState.value === "available", signal: controller.signal,
      progress: message => { status.value = message; },
      onPage: account => { added += merge([account]).added; selectedKey.value = groupAccountKey(account); serverByAccount.value[selectedKey.value] = fetchServer; save(); },
    });
    status.value = `Finished: ${total} records read, ${added} added. ${total === 0 ? "No available records returned." : ""}`;
  } catch (err) {
    if (controller.signal.aborted) status.value = `Stopped. ${added} new records retained.`;
    else {
      const message = err instanceof TypeError ? "Browser request failed: the official API may block cross-origin access (CORS), or the network may be unavailable. Install the browser helper below to fetch locally, or import a UIGF JSON file." : err instanceof Error && err.name === "TimeoutError" ? "Official API request timed out. Please try again." : err instanceof Error ? err.message : "Fetching failed.";
      error.value = `${message} ${added} new records retained.`;
    }
  } finally { link.value = ""; busy.value = false; request = undefined; }
}

async function download(selectedAccounts: GachaAccount[], filename: string) {
  if (exporting.value) return;
  error.value = "";
  exporting.value = true;
  const controller = new AbortController();
  exportRequest = controller;
  try {
    const lang = exportLanguage.value;
    status.value = `Preparing ${lang === "original" ? "original-language" : exportLanguages[lang]} export…`;
    const outputAccounts = await prepareExportAccounts(selectedAccounts, lang, controller.signal);
    controller.signal.throwIfAborted();
    const blob = new Blob([JSON.stringify(exportUigf(outputAccounts), null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename.replace(/\.json$/, `-${lang}.json`);
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.value = "Export ready. Your saved records have not been changed.";
  } catch (err) { status.value = ""; error.value = err instanceof Error ? err.message : "Export failed."; }
  finally { exporting.value = false; exportRequest = undefined; }
}
function deleteAccount() {
  if (!selected.value) return;
  delete serverByAccount.value[selectedKey.value];
  accounts.value = accounts.value.filter(account => groupAccountKey(account) !== selectedKey.value);
  selectedKey.value = accounts.value[0] ? groupAccountKey(accounts.value[0]) : "";
  pendingDelete.value = false;
  save();
  status.value = "Local records for the selected account deleted.";
}
async function loadMetadata() {
  if (!selected.value || metadataBusy.value) return;
  metadataBusy.value = true;
  metadataStatus.value = "Loading item metadata…";
  const account = selected.value;
  const controller = new AbortController();
  metadataRequest = controller;
  try {
    let loaded = 0, missing = 0;
    for (const entry of account.accounts) {
      const data = await fetchMetadata(entry.game, entry.list.map(row => row.item_id), controller.signal, entry.game === "hk4e_ugc" ? "zh-cn" : "en-us");
      metadata.value = { ...metadata.value, [entry.game]: { ...metadata.value[entry.game], ...data } };
      loaded += Object.keys(data).length;
      missing += new Set(entry.list.filter(row => !data[row.item_id]).map(row => row.item_id)).size;
    }
    metadataStatus.value = `Loaded ${loaded} items${missing ? `; ${missing} items are missing English metadata and keep their original display` : ""}.`;
  } catch { if (!controller.signal.aborted) metadataStatus.value = "Metadata lookup failed. Original names and ranks remain available. Try again later."; }
  finally { metadataBusy.value = false; metadataRequest = undefined; }
}
</script>

<template>
  <div class="gacha-manager" :aria-busy="busy">
    <section class="gacha-panel intro">
      <p>Import a UIGF archive to organize your Genshin Impact, Honkai: Star Rail and Zenless Zone Zero records in your browser. Genshin accounts also include Miliastra Wonderland.</p>
      <div class="summary-line"><span>{{ displayAccounts.length }} accounts</span><span>{{ totalRecords.toLocaleString() }} records</span><span>Saved in this browser</span></div>
    </section>

    <section v-if="gachaFetchAllowed" class="gacha-panel">
      <h3>Fetch records</h3>
      <div class="helper-status" role="status">
        <span>{{ helperState === 'available' ? 'Browser helper connected · requests stay on your device' : helperState === 'checking' ? 'Checking browser helper…' : 'Browser helper not detected · direct fetch may be blocked by CORS' }}</span>
        <VPButton theme="alt" type="button" :disabled="busy || helperState === 'checking'" @click="checkHelper">Check helper</VPButton>
      </div>
      <details :open="helperState === 'unavailable'">
        <summary>Set up the browser helper</summary>
        <ol>
          <li>Install <a href="https://www.tampermonkey.net/" target="_blank" rel="noopener noreferrer">Tampermonkey</a> for your browser.</li>
          <li>Open <a href="/script/gacha-manager-helper.user.js" target="_blank" rel="noopener noreferrer">Gacha Manager by Lucas</a> and install it. If it opens as text, paste its contents into a new script in the Tampermonkey dashboard.</li>
          <li>Enable userscript execution and allow the listed official API hosts when requested. Reload this page and look for “Browser helper connected”.</li>
        </ol>
        <p class="muted">The helper sends requests from your device using extension permissions. It runs only on this tool page and can access only official gacha history endpoints. No relay, cookies or custom Origin header are used; authentication links are not saved.</p>
      </details>
      <form @submit.prevent="retrieve">
        <div class="controls">
          <label>Game<select v-model="game" :disabled="busy"><option v-for="(name, key) in selectableGames" :key="key" :value="key">{{ name }}</option></select></label>
          <label>Server<select v-model="server" :disabled="busy"><optgroup label="Mainland China"><option value="cn">{{ game === 'hk4e' ? 'Mainland China · Celestia / Irminsul' : 'Mainland China' }}</option></optgroup><optgroup label="Overseas"><option v-for="id in (['asia', 'europe', 'america', 'tw'] as const)" :key="id" :value="id">{{ servers[id].label }}</option></optgroup></select></label>
        </div>
        <p v-if="game === 'hk4e'" class="muted">Genshin wishes and Miliastra Wonderland records are fetched together.</p>
        <label class="link-label">Gacha history URL<textarea v-model="link" rows="3" placeholder="https://…?authkey=…" autocomplete="off" spellcheck="false" :disabled="busy" /></label>
        <div class="actions">
          <VPButton theme="brand" type="button" @click="retrieve" :disabled="busy || !ready || helperState === 'checking' || !link.trim()">{{ busy ? 'Processing…' : 'Fetch gacha records' }}</VPButton>
          <VPButton theme="alt" v-if="request" type="button" @click="request?.abort()">Stop fetching</VPButton>
          <label class="check"><input v-model="incremental" type="checkbox" :disabled="busy">Incremental fetch</label>
        </div>
      </form>
      <p class="muted">Requests go directly from your browser to the official API. Your URL is used only for this fetch, is never saved, and is cleared afterwards. Keep URLs containing authkey private.</p>
      <details><summary>URLs, servers and browser access</summary><p>Open the in-game gacha history, then obtain the complete official URL using a tool such as Starward. Select your game and server. Mainland China combines Celestia and Irminsul; overseas servers are listed separately. Server time is assigned automatically: China / Asia / TW-HK-MO use UTC+8, Europe UTC+1 and America UTC−5, independently of your device timezone or daylight saving time. Original timestamps are preserved.</p><p>Without the helper, normal browser requests may automatically include Origin and can be blocked by CORS. The helper uses extension permissions to fetch directly from your device. A UIGF JSON import is also available. Incremental fetching stops at your newest saved record. Disable it when filling gaps or recovering an interrupted fetch.</p></details>
    </section>

    <section class="gacha-panel">
      <h3>Import & export</h3>
      <div v-if="!gachaFetchAllowed" class="hint-container note">
        <p class="hint-container-title">Note</p>
        <p>Browser cross-origin restrictions (CORS) prevent this page from fetching gacha history through a link. Use Starward or Latte Helper to obtain your records, export a UIGF JSON file, then import it here to organize and analyze your history.</p>
        <CardGrid :cols="2">
          <RepoCard repo="Scighost/Starward" />
          <RepoCard repo="pizza-studio/PizzaHelperUnited" />
        </CardGrid>
      </div>
      <p class="muted">Import multiple UIGF v4.0–v4.2 JSON files together. Records merge by game, UID and record ID. Exports use UIGF v4.2.</p>
      <label class="export-language">Export language<select v-model="exportLanguage" :disabled="exporting"><option value="original">Original record language</option><option v-for="(name, code) in exportLanguages" :key="code" :value="code">{{ name }}</option></select></label>
      <p class="muted">Choose one of the four backend languages to look up localized item names for export. Original-language export preserves the names of ordinary game records.</p>
      <div class="hint-container note"><p class="hint-container-title">Note</p><p>Due to upstream repository limitations, Miliastra Wonderland records are always exported in Simplified Chinese, regardless of the import or export language selected. Other records use your chosen export language.</p></div>
      <div class="actions">
        <label class="file-button">Import JSON<input type="file" accept=".json,application/json" multiple :disabled="busy || !ready" @change="importFiles"></label>
        <VPButton theme="alt" :disabled="!accounts.length || busy || exporting" @click="download(accounts, 'gacha-uigf-v4.2.json')">{{ exporting ? 'Preparing export…' : 'Export all accounts' }}</VPButton>
        <VPButton theme="alt" :disabled="!selected || busy || exporting" @click="selected && download(selected.accounts, `gacha-${selected.game}-${selected.uid}.json`)">Export selected account</VPButton>
      </div>
      <details v-if="accounts.length"><summary>Download per account</summary><p class="muted">Each download contains one UID for one game. Genshin includes wishes and Miliastra records in their respective UIGF fields.</p><div v-for="account in displayAccounts" :key="account.key" class="account-download"><span>{{ games[account.game] }} · {{ account.uid }} · {{ account.total }} pulls</span><VPButton theme="alt" :disabled="busy || exporting" @click="download(account.accounts, `gacha-${account.game}-${account.uid}.json`)">Download JSON</VPButton></div></details>
      <p class="muted">Upgrade older UIGF / SRGF files with <a href="https://upgrader.uigf.org/" target="_blank" rel="noopener noreferrer">UIGF Upgrader</a>. Records are stored only in this browser. Export backups regularly.</p>
    </section>

    <p v-if="status" class="hint-container note" role="status" aria-live="polite">{{ status }}</p>
    <p v-if="error" class="hint-container caution" role="alert">{{ error }}</p>
    <p v-if="storageError" class="hint-container caution" role="alert">{{ storageError }}</p>

    <section v-if="!accounts.length" class="gacha-panel empty"><h3>Start with your first archive</h3><p>Import a UIGF file to view pull counts, five-star rates, pool statistics and five-star history.</p></section>
    <template v-if="selected">
      <section class="gacha-panel">
        <div class="controls">
          <label>Account<select v-model="selectedKey"><option v-for="account in displayAccounts" :key="account.key" :value="account.key">{{ games[account.game] }} · {{ account.uid }}</option></select></label>
          <label>Pool<select v-model="selectedPool"><option value="all">All pools</option><option v-for="pool in pools" :key="pool" :value="pool">{{ displayPoolName(pool) }}</option></select></label>
        </div>
        <div class="actions"><VPButton theme="alt" :disabled="metadataBusy || busy" @click="loadMetadata">{{ metadataBusy ? 'Loading…' : 'Load item names & icons' }}</VPButton><VPButton theme="alt" :disabled="busy" @click="pendingDelete = !pendingDelete">Delete account</VPButton></div>
        <p v-if="metadataStatus" role="status" class="muted">{{ metadataStatus }}</p>
        <div v-if="pendingDelete" class="hint-container caution"><p>Delete all local records for {{ games[selected.game] }} · {{ selected.uid }}? Export a backup first.</p><div class="actions"><VPButton theme="alt" :disabled="busy" @click="deleteAccount">Confirm deletion</VPButton><VPButton theme="alt" @click="pendingDelete = false">Cancel</VPButton></div></div>
        <p class="muted">Metadata queries send only the game, language and public item IDs. Your UID, URL and history are never sent to the metadata backend. Display metadata does not change your local archive.</p>
      </section>

      <section class="gacha-panel">
        <h3>Overview</h3>
        <div class="metrics">
          <div><span>Total pulls</span><strong>{{ stats.total.toLocaleString() }}</strong></div>
          <div class="gold"><span>5-star / S-rank</span><strong>{{ stats.gold }}</strong></div>
          <div class="gold"><span>5-star rate</span><strong>{{ stats.goldRate.toFixed(2) }}<small>%</small></strong></div>
          <div><span>4-star / A-rank</span><strong>{{ stats.purple }}</strong></div>
          <div><span>Average 5-star interval</span><strong>{{ selectedPool === 'all' || stats.unknown || stats.average === null ? '—' : stats.average.toFixed(1) }}<small> pulls</small></strong></div>
          <div><span>Pulls since last 5-star</span><strong>{{ selectedPool === 'all' || stats.unknown ? '—' : `${stats.hasGold ? '' : '≥ '}${stats.sinceGold}` }}<small> pulls</small></strong></div>
        </div>
        <p class="muted">Rate = known five-star (S-rank in ZZZ) records / all records. Each record counts as one pull; item count is not the number of pulls. These statistics describe saved history, not official probabilities.</p>
        <p v-if="stats.unknown" class="hint-container note">{{ stats.unknown }} records have unknown rarity. The five-star rate is a lower bound. Load metadata to fill missing ranks; intervals and pity counts are hidden until then.</p>
        <p class="muted">Average intervals use only complete spans between known five-star pulls; history before the first may be missing. Pools are calculated separately, except Genshin character pools 301 / 400, which share a group. Miliastra is grouped by op_gacha_type without assuming shared pity.</p>
        <div class="table-scroll"><table><thead><tr><th>Pool</th><th>Pulls</th><th>5-star</th><th>5-star rate</th><th>Avg. interval</th><th>Pity / recorded</th></tr></thead><tbody><tr v-for="pool in poolStats" :key="pool.key"><td><button class="text-button" @click="selectedPool = pool.key">{{ pool.name }}</button></td><td>{{ pool.total }}</td><td class="gold">{{ pool.gold }}</td><td>{{ pool.unknown ? '≥ ' : '' }}{{ pool.goldRate.toFixed(2) }}%</td><td>{{ pool.unknown || pool.average === null ? '—' : pool.average.toFixed(1) }}</td><td>{{ pool.unknown ? '—' : `${pool.sinceGold}${pool.hasGold ? '' : ' (at least)'}` }}</td></tr></tbody></table></div>
      </section>

      <section v-if="selectedPool !== 'all' && stats.goldHistory.length" class="gacha-panel">
        <h3>5-star history</h3>
        <p class="muted">Showing the latest 50 five-star pulls. The first interval is a lower bound if earlier history is missing. Intervals are hidden when any records have unknown rarity.</p>
        <div v-for="entry in stats.goldHistory.slice(0, 50)" :key="`${rowGame(entry.record)}:${entry.record.id}`" class="gold-entry"><div><strong class="gold">{{ itemName(entry.record) }}</strong><small>{{ serverName() }} · {{ entry.record.time }}</small></div><span>{{ stats.unknown ? '—' : `${entry.partial ? 'At least ' : ''}${entry.pulls} pulls` }}</span></div>
      </section>

      <section class="gacha-panel">
        <h3>Record history</h3>
        <div class="controls"><label>Search items<input v-model="search" type="search" placeholder="Name or item ID"></label><label>Rarity<select v-model="rankFilter"><option value="all">All</option><option value="5">5-star / S-rank</option><option value="4">4-star / A-rank</option><option value="3">3-star / B-rank</option><option value="2">2-star</option><option value="1">1-star</option><option value="null">Unknown</option></select></label></div>
        <div class="table-scroll"><table><thead><tr><th>Item</th><th>Rarity</th><th>Pool</th><th>Server time</th></tr></thead><tbody><tr v-for="row in visible" :key="`${rowGame(row)}:${row.id}`"><td><span class="item"><img v-if="itemMetadata(row)?.icon" :src="itemMetadata(row)!.icon!" alt="" loading="lazy" referrerpolicy="no-referrer"><span :class="{ gold: rowRank(row) === 5 }">{{ itemName(row) }}<small>ID {{ row.item_id }}</small></span></span></td><td>{{ rowRank(row) ?? 'Unknown' }}</td><td>{{ displayPoolName(displayPoolKey(row)) }}</td><td>{{ serverName() }} · {{ row.time }}</td></tr><tr v-if="!visible.length"><td colspan="4">No matching records.</td></tr></tbody></table></div>
        <div class="actions pagination"><VPButton theme="alt" :disabled="page <= 1" @click="page--">Previous</VPButton><span>{{ page }} / {{ pageCount }} · {{ filtered.length }} records</span><VPButton theme="alt" :disabled="page >= pageCount" @click="page++">Next</VPButton></div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.gacha-manager { display: grid; gap: 24px; margin-top: 24px; }
.gacha-panel { min-width: 0; }
.gacha-panel + .gacha-panel { padding-top: 24px; border-top: 1px solid var(--vp-c-divider); }
.gacha-manager h2, .gacha-manager h3 { margin: 0 0 16px; border: 0; padding: 0; }
.summary-line, .actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.summary-line { font-size: 13px; color: var(--vp-c-text-2); }

.controls { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
.helper-status { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 12px; align-items: center; padding: 12px; border-radius: 8px; background: var(--vp-c-brand-soft); font-size: 13px; margin-bottom: 16px; }
form { margin-top: 20px; }
label { display: grid; gap: 8px; font-size: 14px; color: var(--vp-c-text-2); }
input, select, textarea { box-sizing: border-box; min-width: 0; width: 100%; padding: 10px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; color: var(--vp-c-text-1); background: var(--vp-c-bg); font: inherit; }
textarea { resize: vertical; overflow-wrap: anywhere; }
.link-label { margin-bottom: 16px; }
.export-language { max-width: 360px; }
.file-button { display: inline-flex; justify-content: center; padding: 0 20px; line-height: 38px; border: 1px solid var(--vp-button-alt-border); border-radius: 20px; background: var(--vp-button-alt-bg); color: var(--vp-button-alt-text); font-size: 14px; font-weight: 600; cursor: pointer; }
.file-button:hover { color: var(--vp-button-alt-hover-text); background: var(--vp-button-alt-hover-bg); border-color: var(--vp-button-alt-hover-border); }
:deep(.vp-button:disabled) { opacity: .5; cursor: not-allowed; pointer-events: none; }
.actions :deep(.vp-button + .vp-button) { margin-left: 0; }
:is(button, input, select, textarea, summary):focus-visible, .file-button:focus-within { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.file-button { position: relative; overflow: hidden; }
.file-button input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
.file-button:has(input:disabled) { opacity: .5; }
.check { display: flex; gap: 8px; align-items: center; }
.check input { width: auto; }
.muted { color: var(--vp-c-text-2); font-size: 13px; line-height: 1.7; }
details { border-top: 1px solid var(--vp-c-divider); margin-top: 16px; padding-top: 12px; font-size: 14px; }
summary { cursor: pointer; color: var(--vp-c-brand-1); }
.hint-container { overflow-wrap: anywhere; }
.empty { text-align: center; padding-block: 40px; }
.metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.metrics > div { padding: 16px; background: var(--vp-c-bg-soft); border-radius: 8px; }
.metrics span { display: block; font-size: 13px; color: var(--vp-c-text-2); }
.metrics strong { display: block; margin-top: 8px; font-size: 28px; line-height: 1.3; font-variant-numeric: tabular-nums; }
small { font-size: 12px; font-weight: normal; }
.gold { color: var(--vp-c-warning-1); }
.table-scroll { overflow-x: auto; margin: 16px 0; }
.table-scroll table { display: table; width: 100%; margin: 0; font-size: 13px; }
th, td { white-space: nowrap; }
.text-button { padding: 0; border: 0; background: none; color: var(--vp-c-brand-1); text-align: left; }
.item { display: flex; align-items: center; gap: 8px; }
.item img { width: 36px; height: 36px; object-fit: contain; }
.item small, .gold-entry small { display: block; color: var(--vp-c-text-2); }
.gold-entry, .account-download { display: flex; justify-content: space-between; gap: 16px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--vp-c-divider); }
.gold-entry > span { white-space: nowrap; }
.pagination { justify-content: center; font-size: 13px; }
@media (max-width: 640px) { .controls { grid-template-columns: 1fr; } .metrics { grid-template-columns: repeat(2, 1fr); } .metrics strong { font-size: 24px; } .account-download { align-items: start; flex-direction: column; } }
</style>
