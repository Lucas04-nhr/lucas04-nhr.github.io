<script setup lang="ts">
import VPButton from "vuepress-theme-plume/components/VPButton.vue";
import CardGrid from "vuepress-theme-plume/components/global/VPCardGrid.vue";
import RepoCard from "vuepress-theme-plume/features/RepoCard.vue";
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import {
  compactAccounts,
  exportLanguages,
  exportUigf,
  games,
  groupAccountKey,
  groupAccounts,
  inferredServer,
  mergeAccounts,
  parseUigf,
  poolKey,
  recordRank,
  selectableGames,
  servers,
  statistics,
  type ExportLanguage,
  type GachaAccount,
  type GachaRecord,
  type Game,
  type Metadata,
  type SelectableGame,
  type ServerId,
} from "../theme/utils/gachaRecords";
import {
  fetchGameRecords,
  fetchMetadata,
  prepareExportAccounts,
} from "../theme/utils/gachaFetch";
import { detectGachaHelper } from "../theme/utils/gachaTransport";
import {
  applyGachaFetchPreference,
  gachaFetchAllowed,
} from "../theme/utils/gachaFetchPreference";

import { displayLabel, localizedPoolName } from "../theme/utils/gachaDisplay";

import { gachaApiError } from "../theme/utils/gachaApiError";
import { personalApiBase, synchronizePersonal, validateSyncToken } from "../theme/utils/gachaSync";

import { clearGachaConnection, loadGachaConnection, saveGachaConnection } from "../theme/utils/gachaConnection";

const connectionStatus = ref("");
const connectionBusy = ref(false);

async function rememberConnection() {
  if (connectionBusy.value) return;
  connectionBusy.value = true;
  try {
    if (personalWorker.value) personalApiBase(personalWorker.value);
    if (personalToken.value) validateSyncToken(personalToken.value);
    if (updateToken.value) validateSyncToken(updateToken.value);
    await saveGachaConnection({ worker: personalWorker.value, personalToken: personalToken.value, updateToken: updateToken.value });
    connectionStatus.value = "Connection details remembered for 1 year in this browser.";
  } catch (err) {
    connectionStatus.value = err instanceof Error ? err.message : "Could not remember connection details.";
  } finally {
    connectionBusy.value = false;
  }
}
function forgetConnection() {
  try {
    clearGachaConnection();
    personalWorker.value = "";
    personalToken.value = "";
    updateToken.value = "";
    ownsWorker.value = false;
    connectionStatus.value = "Saved connection details cleared.";
  } catch {
    connectionStatus.value = "Could not clear saved details. Clear this site’s cookies and storage in your browser.";
  }
}

const personalWorker = ref("");
const personalToken = ref("");
const updateToken = ref("");
const updatingMetadata = ref(false);
let updateRequest: AbortController | undefined;
const ownsWorker = ref(false);
const syncing = ref(false);
const personalSyncStatus = ref("");
const personalSyncError = ref("");
const metadataUpdateStatus = ref("");
const metadataUpdateError = ref("");
let syncRequest: AbortController | undefined;

async function syncPersonal() {
  if (busy.value || !ready.value || !ownsWorker.value) return;
  busy.value = true;
  personalSyncError.value = "";
  personalSyncStatus.value = "Reading remote accounts…";
  const controller = new AbortController();
  syncRequest = controller;
  syncing.value = true;
  try {
    const synced = await synchronizePersonal(personalWorker.value, personalToken.value, accounts.value, controller.signal, message => { personalSyncStatus.value = message; });
    controller.signal.throwIfAborted();
    accounts.value = synced;
    if (!selectedKey.value && synced.length) selectedKey.value = groupAccountKey(synced[0]);
    save();
    personalSyncStatus.value = "Personal sync complete. Local and remote records merged; deletions are not propagated.";
  } catch (err) {
    personalSyncStatus.value = "";
    personalSyncError.value = controller.signal.aborted ? "Sync cancelled. Earlier upload batches may already be saved; retry to reconcile." : err instanceof TypeError ? "Cannot reach your Worker. Check its address, network and ALLOWED_ORIGINS." : err instanceof Error ? err.message : "Personal sync failed.";
  } finally {
    busy.value = false;
    syncRequest = undefined;
    syncing.value = false;
  }
}

async function updateRemoteMetadata() {
  if (busy.value || !ready.value) return;
  metadataUpdateError.value = "";
  metadataUpdateStatus.value = "Updating upstream metadata…";
  busy.value = true;
  updatingMetadata.value = true;
  const controller = new AbortController();
  updateRequest = controller;
  try {
    const base = personalApiBase(personalWorker.value);
    validateSyncToken(updateToken.value);
    const response = await fetch(`${base}/api/v1/admin/sync`, {
      method: "POST", credentials: "omit", referrerPolicy: "no-referrer", redirect: "error", cache: "no-store",
      headers: { Authorization: `Bearer ${updateToken.value}` },
      signal: AbortSignal.any([controller.signal, AbortSignal.timeout(180000)]),
    });
    if (!response.ok) throw await gachaApiError(response, "Metadata update");
    const result = await response.json();
    controller.signal.throwIfAborted();
    if (!Number.isSafeInteger(result.updated) || result.updated < 0 || !Number.isSafeInteger(result.sources) || result.sources < 0) throw new Error("Invalid metadata update response.");
    metadataUpdateStatus.value = `Metadata updated: ${result.updated} items from ${result.sources} sources. Public query caches may take five minutes to expire.`;
  } catch (err) {
    metadataUpdateStatus.value = "";
    metadataUpdateError.value = controller.signal.aborted ? "Request cancelled. The backend update may still finish." : err instanceof TypeError ? "Cannot reach the metadata admin API. Allow this frontend origin, POST and Authorization in backend CORS, and check your network. The backend update may already have started." : err instanceof Error ? err.message : "Metadata update failed.";
  } finally {
    updatingMetadata.value = false;
    busy.value = false;
    updateRequest = undefined;
  }
}

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
const exportLanguage = ref<ExportLanguage>("en-us");
const exporting = ref(false);
let exportRequest: AbortController | undefined;
const displayLanguage = ref<ExportLanguage>("en-us");
const overviewLanguage: ExportLanguage = "en-us";
const goldPage = ref(1);
const goldPageSize = ref(5);
const metadata = ref<
  Partial<Record<ExportLanguage, Partial<Record<Game, Metadata>>>>
>({});
const rankFilter = ref("all");
const search = ref("");
const page = ref(1);
const pageSize = ref(5);
const pendingDelete = ref(false);
const helperState = ref<"checking" | "available" | "unavailable">("checking");
let helperCheck: AbortController | undefined;
let request: AbortController | undefined;
let metadataRequest: AbortController | undefined;
const displayAccounts = computed(() => groupAccounts(accounts.value));
const selected = computed(() =>
  displayAccounts.value.find((account) => account.key === selectedKey.value),
);
const allRows = computed(
  () =>
    selected.value?.accounts.flatMap((account) =>
      account.list.map((row) => ({
        ...row,
        __game: account.game,
        __timezone: account.timezone,
      })),
    ) ?? [],
);
function rowGame(row: GachaRecord): Game {
  return row.__game as Game;
}
function rowMetadata(row: GachaRecord, language = displayLanguage.value): Metadata {
  return (
    metadata.value[language]?.[rowGame(row)] ?? {}
  );
}
function itemMetadata(row: GachaRecord, language = displayLanguage.value) {
  return rowMetadata(row, language)[row.item_id];
}
function itemName(row: GachaRecord, language = displayLanguage.value) {
  return itemMetadata(row, language)?.name ?? row.item_id;
}
function rowRank(row: GachaRecord) {
  return recordRank(row, rowGame(row), rowMetadata(row));
}
function displayPoolKey(row: GachaRecord) {
  return `${rowGame(row)}:${poolKey(row, rowGame(row))}`;
}
function displayPoolName(key: string, language = overviewLanguage) {
  const [namespace, type] = key.split(":") as [Game, string];
  return localizedPoolName(namespace, type, language);
}
function serverAlias(game: SelectableGame) {
  return game === "hkrpg"
    ? "Astral Express / Nameless"
    : game === "nap"
      ? "New Eridu"
      : "Celestia / Irminsul";
}
function serverName(language = overviewLanguage) {
  if (!selected.value) return displayLabel("Server", language);
  if (selected.value.game !== "hk4e") return displayLabel(serverAlias(selected.value.game), language);
  const stored = serverByAccount.value[selected.value.key];
  if (stored === "cn") return displayLabel(serverAlias(selected.value.game), language);
  const region = stored
    ? servers[stored].label
    : inferredServer(selected.value.accounts[0]);
  return displayLabel(region, language);
}
const pools = computed(() => [...new Set(allRows.value.map(displayPoolKey))]);
const rows = computed(() =>
  allRows.value.filter(
    (row) =>
      selectedPool.value === "all" ||
      displayPoolKey(row) === selectedPool.value,
  ),
);
function poolTopRank(key: string) {
  return key === "hk4e_ugc:1000" ? 4 : 5;
}
const topRank = computed(() => poolTopRank(selectedPool.value));
const rarityOptions = computed(() =>
  selectedPool.value === "hk4e_ugc:1000" ? [4, 3, 2] :
    rows.value.some((row) => rowGame(row) === "hk4e_ugc") ? [5, 4, 3, 2] : [5, 4, 3],
);
function rarityLabel(rank: number) {
  return selected.value?.game === "nap"
    ? `${rank}-star / ${rank === 5 ? "S" : rank === 4 ? "A" : "B"}-rank`
    : `${rank}-star`;
}
watch(rarityOptions, (options) => {
  if (rankFilter.value !== "all" && rankFilter.value !== "null" &&
      !options.includes(Number(rankFilter.value))) rankFilter.value = "all";
});
const calculateStats = (list: GachaRecord[], rank = topRank.value) =>
  statistics(list, selected.value?.game ?? game.value, {}, rowRank, rank);
const stats = computed(() => calculateStats(rows.value));
const goldPageCount = computed(() =>
  Math.max(1, Math.ceil(stats.value.goldHistory.length / goldPageSize.value)),
);
const visibleGoldHistory = computed(() =>
  stats.value.goldHistory.slice(
    (goldPage.value - 1) * goldPageSize.value,
    goldPage.value * goldPageSize.value,
  ),
);
watch([selectedKey, selectedPool, goldPageSize], () => {
  goldPage.value = 1;
});
watch(goldPageCount, (count) => {
  goldPage.value = Math.min(goldPage.value, count);
});
const poolStats = computed(() =>
  pools.value.map((key) => ({
    key,
    name: displayPoolName(key),
    ...calculateStats(
      allRows.value.filter((row) => displayPoolKey(row) === key),
      poolTopRank(key),
    ),
  })),
);
const filtered = computed(() =>
  [...rows.value]
    .sort(
      (a, b) =>
        b.time.localeCompare(a.time) || (BigInt(a.id) < BigInt(b.id) ? 1 : -1),
    )
    .filter(
      (row) =>
        (rankFilter.value === "all" ||
          String(rowRank(row)) === String(rankFilter.value)) &&
        `${itemName(row)} ${row.item_id}`
          .toLowerCase()
          .includes(search.value.toLowerCase()),
    ),
);
const pageCount = computed(() =>
  Math.max(1, Math.ceil(filtered.value.length / pageSize.value)),
);
const visible = computed(() =>
  filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value),
);
const totalRecords = computed(() =>
  accounts.value.reduce((sum, account) => sum + account.list.length, 0),
);
watch(selectedKey, () => {
  selectedPool.value = "all";
  pendingDelete.value = false;
});
watch([selectedKey, selectedPool, rankFilter, search, pageSize], () => {
  page.value = 1;
});
watch(displayLanguage, () => {
  page.value = 1;
  void loadMetadata();
});
watch(selectedKey, () => {
  void loadMetadata();
});
watch(pageCount, (count) => {
  page.value = Math.min(page.value, count);
});
watch(gachaFetchAllowed, (allowed) => {
  if (allowed && ready.value) void checkHelper();
  else if (!allowed) {
    helperCheck?.abort();
    request?.abort();
    link.value = "";
  }
});

function save() {
  if (!ready.value) return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        archive: exportUigf(compactAccounts(accounts.value)),
        servers: serverByAccount.value,
      }),
    );
    storageError.value = "";
  } catch {
    storageError.value =
      "Browser storage is unavailable or full. Records remain in memory. Export a backup now; refreshing may lose recent changes.";
  }
}
function merge(incoming: GachaAccount[]) {
  const result = mergeAccounts(accounts.value, incoming);
  accounts.value = compactAccounts(result.accounts);
  if (!selectedKey.value && incoming.length)
    selectedKey.value = groupAccountKey(incoming[0]);
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
          if (typeof value === "string" && Object.hasOwn(servers, value))
            serverByAccount.value[key] = value as ServerId;
        }
      }
      if (Object.keys(games).some((key) => archive[key]?.length))
        accounts.value = compactAccounts(parseUigf(archive));
      selectedKey.value = accounts.value[0]
        ? groupAccountKey(accounts.value[0])
        : "";
    }
  } catch {
    storageError.value =
      "Could not read the local archive. It has not been overwritten. Check browser storage or import a backup.";
  }
  void loadGachaConnection().then(connection => {
    if (!ready.value || !connection) return;
    // Preserve any values entered while decryption was in progress.
    if (!personalWorker.value) personalWorker.value = connection.worker;
    if (!personalToken.value) personalToken.value = connection.personalToken;
    if (!updateToken.value) updateToken.value = connection.updateToken;
    connectionStatus.value = "Saved connection details restored.";
  }).catch(() => {
    if (ready.value) connectionStatus.value = "Could not restore saved details. Clear them and save again.";
  });
  ready.value = true;
  if (accounts.value.length) save();
  const url = new URL(window.location.href);
  const wasEnabled = gachaFetchAllowed.value;
  const preference = url.searchParams
    .get("gachaFetchAllowed")
    ?.trim()
    .toLowerCase();
  applyGachaFetchPreference(
    preference === "true" ? true : preference === "false" ? false : null,
    url,
  );
  if (wasEnabled && gachaFetchAllowed.value) void checkHelper();
});
onBeforeUnmount(() => {
  ready.value = false;
  request?.abort();
  syncRequest?.abort();
  updateRequest?.abort();
  updateToken.value = "";
  personalToken.value = "";
  metadataRequest?.abort();
  exportRequest?.abort();
  helperCheck?.abort();
});

async function checkHelper() {
  helperCheck?.abort();
  const controller = new AbortController();
  helperCheck = controller;
  helperState.value = "checking";
  const available = await detectGachaHelper(controller.signal);
  if (!controller.signal.aborted)
    helperState.value = available ? "available" : "unavailable";
}

const dragDepth = ref(0);

async function importFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  try { await importJsonFiles([...(input.files ?? [])]); }
  finally { input.value = ""; }
}

function dragEnter(event: DragEvent) {
  if (event.dataTransfer?.types.includes("Files")) dragDepth.value++;
}

function dragOver(event: DragEvent) {
  if (event.dataTransfer) event.dataTransfer.dropEffect = busy.value || !ready.value ? "none" : "copy";
}

async function dropFiles(event: DragEvent) {
  dragDepth.value = 0;
  await importJsonFiles([...(event.dataTransfer?.files ?? [])]);
}

async function importJsonFiles(files: File[]) {
  if (!files.length || busy.value || !ready.value) return;
  error.value = "";
  status.value = "Importing JSON files…";
  busy.value = true;
  try {
    // Parse all files first, so one invalid file cannot cause a partial import.
    const incoming: GachaAccount[] = [];
    for (const file of files) {
      if (!/\.json$/i.test(file.name)) throw new Error(`${file.name} is not a JSON file.`);
      if (file.size > 50 * 1024 * 1024)
        throw new Error(
          `${file.name} exceeds 50 MiB. Split the file before importing.`,
        );
      incoming.push(...parseUigf(JSON.parse(await file.text())));
    }
    if (!ready.value) return;
    const result = merge(incoming);
    status.value = `Imported ${files.length} files: ${result.added} added, ${result.duplicates} duplicates skipped.`;
  } catch (err) {
    status.value = "";
    error.value = err instanceof Error ? err.message : "Import failed.";
  } finally {
    busy.value = false;
  }
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
    const total = await fetchGameRecords({
      game: game.value,
      link: link.value,
      server: fetchServer,
      existing: accounts.value,
      incremental: incremental.value,
      useHelper: helperState.value === "available",
      signal: controller.signal,
      progress: (message) => {
        status.value = message;
      },
      onPage: (account) => {
        added += merge([account]).added;
        selectedKey.value = groupAccountKey(account);
        serverByAccount.value[selectedKey.value] = fetchServer;
        save();
      },
    });
    status.value = `Finished: ${total} records read, ${added} added. ${total === 0 ? "No available records returned." : ""}`;
  } catch (err) {
    if (controller.signal.aborted)
      status.value = `Stopped. ${added} new records retained.`;
    else {
      const message =
        err instanceof TypeError
          ? "Browser request failed: the official API may block cross-origin access (CORS), or the network may be unavailable. Install the browser helper below to fetch locally, or import a UIGF JSON file."
          : err instanceof Error && err.name === "TimeoutError"
            ? "Official API request timed out. Please try again."
            : err instanceof Error
              ? err.message
              : "Fetching failed.";
      error.value = `${message} ${added} new records retained.`;
    }
  } finally {
    link.value = "";
    busy.value = false;
    request = undefined;
  }
}

async function download(selectedAccounts: GachaAccount[]) {
  if (exporting.value) return;
  error.value = "";
  exporting.value = true;
  const controller = new AbortController();
  exportRequest = controller;
  try {
    const lang = exportLanguage.value;
    status.value = `Preparing ${exportLanguages[lang]} export…`;
    const outputAccounts = await prepareExportAccounts(
      selectedAccounts,
      lang,
      controller.signal,
    );
    controller.signal.throwIfAborted();
    const blob = new Blob(
      [JSON.stringify(exportUigf(outputAccounts), null, 2)],
      { type: "application/json;charset=utf-8" },
    );
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "UIGFv4_GachaManager.json";
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.value = "Export ready. Your saved records have not been changed.";
  } catch (err) {
    status.value = "";
    error.value = err instanceof Error ? err.message : "Export failed.";
  } finally {
    exporting.value = false;
    exportRequest = undefined;
  }
}
function deleteAccount() {
  if (busy.value || !selected.value) return;
  delete serverByAccount.value[selectedKey.value];
  accounts.value = accounts.value.filter(
    (account) => groupAccountKey(account) !== selectedKey.value,
  );
  selectedKey.value = accounts.value[0]
    ? groupAccountKey(accounts.value[0])
    : "";
  pendingDelete.value = false;
  save();
  status.value = "Local records for the selected account deleted.";
}
async function loadMetadata() {
  if (!selected.value) return;
  metadataRequest?.abort();
  metadataBusy.value = true;
  metadataStatus.value = "Loading item metadata…";
  const account = selected.value;
  const controller = new AbortController();
  metadataRequest = controller;
  try {
    let loaded = 0,
      missing = 0;
    for (const entry of account.accounts) {
      const languages = new Set([
        overviewLanguage,
        displayLanguage.value,
      ]);
      for (const lang of languages) {
        const data = await fetchMetadata(
          entry.game,
          entry.list.map((row) => row.item_id),
          controller.signal,
          lang,
        );
        controller.signal.throwIfAborted();
        metadata.value = {
          ...metadata.value,
          [lang]: {
            ...metadata.value[lang],
            [entry.game]: { ...metadata.value[lang]?.[entry.game], ...data },
          },
        };
        loaded += Object.keys(data).length;
        missing += new Set(
          entry.list
            .filter((row) => !data[row.item_id])
            .map((row) => row.item_id),
        ).size;
      }
    }
    metadataStatus.value = `Loaded ${loaded} items (selected display languages)${missing ? `; ${missing} items are missing requested-language metadata and display their IDs` : ""}.`;
  } catch {
    if (!controller.signal.aborted)
      metadataStatus.value =
        "Metadata lookup failed. Item IDs and saved ranks remain available. Try again later.";
  } finally {
    if (metadataRequest === controller) {
      metadataBusy.value = false;
      metadataRequest = undefined;
    }
  }
}
</script>

<template>
  <div class="gacha-manager" :aria-busy="busy">
    <section class="gacha-panel intro">
      <p>
        Import a UIGF archive to organize your Genshin Impact, Honkai: Star Rail
        and Zenless Zone Zero records in your browser. Genshin accounts also
        include Miliastra Wonderland.
      </p>
      <div class="summary-line">
        <span>{{ displayAccounts.length }} accounts</span
        ><span>{{ totalRecords.toLocaleString() }} records</span
        ><span>Saved in this browser</span>
      </div>
    </section>

    <section v-if="gachaFetchAllowed" class="gacha-panel">
      <h3>Fetch records</h3>
      <div class="helper-status" role="status">
        <span>{{
          helperState === "available"
            ? "Browser helper connected · requests stay on your device"
            : helperState === "checking"
              ? "Checking browser helper…"
              : "Browser helper not detected · direct fetch may be blocked by CORS"
        }}</span>
        <VPButton
          theme="alt"
          type="button"
          :disabled="busy || helperState === 'checking'"
          @click="checkHelper"
          >Check helper</VPButton
        >
      </div>
      <details :open="helperState === 'unavailable'">
        <summary>Set up the browser helper</summary>
        <ol>
          <li>
            Install
            <a
              href="https://www.tampermonkey.net/"
              target="_blank"
              rel="noopener noreferrer"
              >Tampermonkey</a
            >
            for your browser.
          </li>
          <li>
            Open
            <a
              href="/script/gacha-manager-helper.user.js"
              target="_blank"
              rel="noopener noreferrer"
              >Gacha Manager Helper</a
            >
            and install it. If it opens as text, paste its contents into a new
            script in the Tampermonkey dashboard.
          </li>
          <li>
            Update the helper to version 1.2.1 or later, enable userscript
            execution and allow the listed official API hosts when requested.
            Reload this page and look for “Browser helper connected”.
          </li>
        </ol>
        <p class="muted">
          The helper sends requests from your device using extension
          permissions. It runs only on this tool page and can access only
          official gacha history endpoints. No relay, cookies or custom Origin
          header are used; authentication links are not saved.
        </p>
      </details>
      <form @submit.prevent="retrieve">
        <div class="controls account-controls">
          <label
            >Game<select v-model="game" :disabled="busy">
              <option
                v-for="(name, key) in selectableGames"
                :key="key"
                :value="key"
              >
                {{ name }}
              </option>
            </select></label
          >
          <label
            >Server<select v-model="server" :disabled="busy">
              <optgroup label="Mainland China">
                <option value="cn">{{ serverAlias(game) }}</option>
              </optgroup>
              <optgroup label="Overseas">
                <option
                  v-for="id in ['asia', 'europe', 'america', 'tw'] as const"
                  :key="id"
                  :value="id"
                >
                  {{ servers[id].label }}
                </option>
              </optgroup>
            </select></label
          >
        </div>
        <p v-if="game === 'hk4e'" class="muted">
          Genshin wishes and Miliastra Wonderland records are fetched together.
        </p>
        <label class="link-label"
          >Gacha history URL<textarea
            v-model="link"
            rows="3"
            placeholder="https://…?authkey=…"
            autocomplete="off"
            spellcheck="false"
            :disabled="busy"
          />
        </label>
        <div class="actions">
          <VPButton
            theme="brand"
            type="button"
            @click="retrieve"
            :disabled="
              busy || !ready || helperState === 'checking' || !link.trim()
            "
            >{{ busy ? "Processing…" : "Fetch gacha records" }}</VPButton
          >
          <VPButton
            theme="alt"
            v-if="request"
            type="button"
            @click="request?.abort()"
            >Stop fetching</VPButton
          >
          <label class="check"
            ><input
              v-model="incremental"
              type="checkbox"
              :disabled="busy"
            />Incremental fetch</label
          >
        </div>
      </form>
      <p class="muted">
        Requests go directly from your browser to the official API. Your URL is
        used only for this fetch, is never saved, and is cleared afterwards.
        Keep URLs containing authkey private.
      </p>
      <details>
        <summary>URLs, servers and browser access</summary>
        <p>
          Open the in-game gacha history, then obtain the complete official URL
          using a tool such as Starward. Select your game and server. Mainland
          China combines Celestia and Irminsul; overseas servers are listed
          separately. Server time is assigned automatically: China / Asia /
          TW-HK-MO use UTC+8, Europe UTC+1 and America UTC−5, independently of
          your device timezone or daylight saving time. Original timestamps are
          preserved.
        </p>
        <p>
          Without the helper, normal browser requests may automatically include
          Origin and can be blocked by CORS. The helper uses extension
          permissions to fetch directly from your device. A UIGF JSON import is
          also available. Incremental fetching stops at your newest saved
          record. Disable it when filling gaps or recovering an interrupted
          fetch.
        </p>
      </details>
    </section>

    <section class="gacha-panel">
      <h3>Import</h3>
      <p
        v-if="status"
        class="hint-container note"
        role="status"
        aria-live="polite"
      >
        {{ status }}
      </p>
      <p v-if="error" class="hint-container caution" role="alert">{{ error }}</p>
      <p v-if="storageError" class="hint-container caution" role="alert">
        {{ storageError }}
      </p>
      <div v-if="!gachaFetchAllowed" class="hint-container note">
        <p class="hint-container-title">Note</p>
        <p>
          Browser cross-origin restrictions (CORS) prevent this page from
          fetching gacha history through a link. Use Starward or Latte Helper to
          obtain your records, export a UIGF JSON file, then import it here to
          organize and analyze your history.
        </p>
        <CardGrid :cols="2">
          <RepoCard repo="Scighost/Starward" />
          <RepoCard repo="pizza-studio/PizzaHelperUnited" />
        </CardGrid>
      </div>
      <p class="muted">
        Import multiple UIGF v4.0–v4.2 JSON files together. Records merge by
        game, UID and record ID.
      </p>
      <label
        class="json-drop-zone"
        :class="{ dragging: dragDepth > 0, disabled: busy || !ready }"
        @dragenter.prevent="dragEnter"
        @dragover.prevent="dragOver"
        @dragleave.prevent="dragDepth = Math.max(0, dragDepth - 1)"
        @drop.prevent="dropFiles"
      >
        <strong>{{ busy ? 'Import unavailable while processing' : 'Drop JSON files here' }}</strong>
        <span>or click to select files · UIGF v4.0–v4.2 · up to 50 MiB per file</span>
        <input
            type="file"
            accept=".json,application/json"
            multiple
            :disabled="busy || !ready"
            @change="importFiles"
        />
      </label>
      <p class="muted">
        Upgrade older UIGF / SRGF files with
        <a
          href="https://upgrader.uigf.org/"
          target="_blank"
          rel="noopener noreferrer"
          >UIGF Upgrader</a
        >.
      </p>
      <h4>Remote service</h4>
      <label>Worker URL<input v-model="personalWorker" type="url" placeholder="https://your-worker.example.com" :disabled="busy" /></label>
      <h4>Metadata updates</h4>
      <p class="muted">
        Update upstream item metadata on your Worker. Backend v1.2.1 supports
        browser requests from origins in its CORS allowlist.
        METADATA_UPDATE_TOKEN is separate from the personal synchronization token.
      </p>
      <form class="remote-service-form" @submit.prevent="updateRemoteMetadata">
        <label>METADATA_UPDATE_TOKEN<input v-model="updateToken" type="password" autocomplete="off" :disabled="busy" required /></label>
        <div class="actions">
          <VPButton @click="updateRemoteMetadata" text="Update metadata" :disabled="busy || !ready || !personalWorker || !updateToken" />
          <VPButton v-if="updatingMetadata" text="Cancel request" theme="alt" @click="updateRequest?.abort()" />
        </div>
        <p v-if="metadataUpdateStatus" class="hint-container note" role="status" aria-live="polite">{{ metadataUpdateStatus }}</p>
        <p v-if="metadataUpdateError" class="hint-container caution" role="alert">{{ metadataUpdateError }}</p>
      </form>
      <h4>Personal remote synchronization</h4>
      <p class="muted">
        Sync only to your own Worker and D1 database. Its operator and anyone
        holding the token can read, modify or delete all remote records.
        Sync merges saved records in both directions; local deletions are not propagated.
        Each upload batch commits separately.
      </p>
      <form class="remote-service-form" @submit.prevent="syncPersonal">
        <div class="controls">
          <label>PERSONAL_SYNC_TOKEN<input v-model="personalToken" type="password" autocomplete="off" :disabled="busy" required /></label>
        </div>
        <label class="check"><input v-model="ownsWorker" type="checkbox" :disabled="busy" />I own and manage this Worker and D1 database.</label>
        <div class="actions">
          <VPButton @click="syncPersonal" :disabled="busy || !ready || !ownsWorker || !personalWorker || !personalToken" text="Sync personal records" />
          <VPButton v-if="syncing" text="Cancel sync" theme="alt" @click="syncRequest?.abort()" />
        </div>
        <p v-if="personalSyncStatus" class="hint-container note" role="status" aria-live="polite">{{ personalSyncStatus }}</p>
        <p v-if="personalSyncError" class="hint-container caution" role="alert">{{ personalSyncError }}</p>
      </form>
      <div class="connection-memory">
        <p class="muted">Remember the Worker URL and both tokens for 1 year. The encrypted cookie and its local browser key allow automatic recovery; anyone with access to this browser or this site's scripts can decrypt them.</p>
        <div class="actions">
          <VPButton text="Remember connection details" theme="alt" :disabled="busy || !ready || connectionBusy || !personalWorker" @click="rememberConnection" />
          <VPButton text="Clear saved details" theme="alt" :disabled="busy || !ready || connectionBusy" @click="forgetConnection" />
        </div>
        <p v-if="connectionStatus" class="muted" role="status" aria-live="polite">{{ connectionStatus }}</p>
      </div>
    </section>

    <section class="gacha-panel">
      <h3>Export</h3>
      <p class="muted">Exports use UIGF v4.2.</p>
      <label class="export-language"
        >Export language<select v-model="exportLanguage" :disabled="exporting">
          <option
            v-for="(name, code) in exportLanguages"
            :key="code"
            :value="code"
          >
            {{ name }}
          </option>
        </select></label
      >
      <p class="muted">
        Choose one of the four backend languages to look up localized item names
        for export. Local storage keeps IDs and record details without names or
        source-language information.
      </p>
      <div class="actions">
        <VPButton
          theme="alt"
          :disabled="!accounts.length || busy || exporting"
          @click="download(accounts)"
          >{{
            exporting ? "Preparing export…" : "Export all accounts"
          }}</VPButton
        >
      </div>
      <details v-if="accounts.length">
        <summary>Download per account</summary>
        <p class="muted">
          Each download contains one UID for one game. Genshin includes wishes
          and Miliastra records in their respective UIGF fields.
        </p>
        <div
          v-for="account in displayAccounts"
          :key="account.key"
          class="account-download"
        >
          <span
            >{{ games[account.game] }} · {{ account.uid }} ·
            {{ account.total }} pulls</span
          ><VPButton
            theme="alt"
            :disabled="busy || exporting"
            @click="download(account.accounts)"
            >Download JSON</VPButton
          >
        </div>
      </details>
      <p class="muted">
        Records are saved in this browser; personal synchronization is optional. Export backups regularly.
      </p>
    </section>


    <section v-if="!accounts.length" class="gacha-panel empty">
      <h3>Start with your first archive</h3>
      <p>
        Import a UIGF file to view pull counts, five-star rates, pool statistics
        and five-star history.
      </p>
    </section>
    <template v-if="selected">
      <section class="gacha-panel">
        <h3>Overview</h3>
        <div class="controls account-controls">
          <label
            >Account<select v-model="selectedKey">
              <option
                v-for="account in displayAccounts"
                :key="account.key"
                :value="account.key"
              >
                {{ games[account.game] }} · {{ account.uid }}
              </option>
            </select></label
          >
          <label
            >Pool<select v-model="selectedPool">
              <option value="all">{{ displayLabel("all", overviewLanguage) }}</option>
              <option v-for="pool in pools" :key="pool" :value="pool">
                {{ displayPoolName(pool) }}
              </option>
            </select></label
          >
        </div>
        <div class="actions">
          <VPButton
            theme="alt"
            :disabled="metadataBusy || busy"
            @click="loadMetadata"
            >{{
              metadataBusy ? "Loading…" : "Load item names & icons"
            }}</VPButton
          ><VPButton
            theme="alt"
            :disabled="busy"
            @click="pendingDelete = !pendingDelete"
            >Delete account</VPButton
          >
        </div>
        <p v-if="metadataStatus" role="status" class="muted">
          {{ metadataStatus }}
        </p>
        <div v-if="pendingDelete" class="hint-container caution">
          <p>
            Delete all local records for {{ games[selected.game] }} ·
            {{ selected.uid }}? Export a backup first.
          </p>
          <div class="actions">
            <VPButton theme="alt" :disabled="busy" @click="deleteAccount"
              >Confirm deletion</VPButton
            ><VPButton theme="alt" @click="pendingDelete = false"
              >Cancel</VPButton
            >
          </div>
        </div>
        <p class="muted">
          Metadata queries send only the game, language and public item IDs.
          Your UID, URL and history are never sent to the metadata backend.
          Display metadata does not change your local archive.
        </p>
        <div class="metrics">
          <div>
            <span>Total pulls</span
            ><strong>{{ stats.total.toLocaleString() }}</strong>
          </div>
          <div class="gold">
            <span>{{ rarityLabel(topRank) }}</span><strong>{{ stats.gold }}</strong>
          </div>
          <div class="gold">
            <span>5-star rate</span
            ><strong>{{ stats.goldRate.toFixed(2) }}<small>%</small></strong>
          </div>
          <div>
            <span>{{ rarityLabel(topRank - 1) }}</span><strong>{{ stats.purple }}</strong>
          </div>
          <div>
            <span>Average {{ topRank }}-star interval</span
            ><strong
              >{{
                selectedPool === "all" ||
                stats.unknown ||
                stats.average === null
                  ? "—"
                  : stats.average.toFixed(1)
              }}<small> pulls</small></strong
            >
          </div>
          <div>
            <span>Pulls since last {{ topRank }}-star</span
            ><strong
              >{{
                selectedPool === "all" || stats.unknown
                  ? "—"
                  : `${stats.hasGold ? "" : "≥ "}${stats.sinceGold}`
              }}<small> pulls</small></strong
            >
          </div>
        </div>
        <p class="muted">
          Rate = known {{ topRank }}-star (S-rank in ZZZ) records / all records. Each
          record counts as one pull; item count is not the number of pulls.
          These statistics describe saved history, not official probabilities.
        </p>
        <p v-if="stats.unknown" class="hint-container note">
          {{ stats.unknown }} records have unknown rarity. The {{ topRank }}-star rate is
          a lower bound. Load metadata to fill missing ranks; intervals and pity
          counts are hidden until then.
        </p>
        <p class="muted">
          Average intervals use only complete spans between known {{ topRank }}-star
          pulls; history before the first may be missing. Pools are calculated
          separately, except Genshin character pools 301 / 400, which share a
          group. Miliastra is grouped by op_gacha_type without assuming shared
          pity. Standard Evocation uses 4-star records; other pools use 5-star records.
        </p>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Pool</th>
                <th>Pulls</th>
                <th>Top rarity</th>
                <th>Top rarity rate</th>
                <th>Avg. interval</th>
                <th>Pity / recorded</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pool in poolStats" :key="pool.key">
                <td>
                  <button class="text-button" @click="selectedPool = pool.key">
                    {{ pool.name }}
                  </button>
                </td>
                <td>{{ pool.total }}</td>
                <td class="gold">{{ pool.gold }} ({{ poolTopRank(pool.key) }}-star)</td>
                <td>
                  {{ pool.unknown ? "≥ " : "" }}{{ pool.goldRate.toFixed(2) }}%
                </td>
                <td>
                  {{
                    pool.unknown || pool.average === null
                      ? "—"
                      : pool.average.toFixed(1)
                  }}
                </td>
                <td>
                  {{
                    pool.unknown
                      ? "—"
                      : `${pool.sinceGold}${pool.hasGold ? "" : " (at least)"}`
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        v-if="selectedPool !== 'all' && stats.goldHistory.length"
        class="gacha-panel"
      >
        <h3>{{ topRank }}-star history</h3>
        <p class="muted">
          Names are shown in English. The first interval is a lower bound if earlier
          history is missing. Intervals are hidden when any records have unknown
          rarity.
        </p>
        <div class="controls">
          <label
            >Records per page<select v-model.number="goldPageSize">
              <option v-for="size in [5, 10, 20, 50, 100]" :key="size" :value="size">
                {{ size }}
              </option>
            </select></label
          >
        </div>
        <div
          v-for="entry in visibleGoldHistory"
          :key="`${rowGame(entry.record)}:${entry.record.id}`"
          class="gold-entry"
        >
          <div>
            <strong class="gold">{{ itemName(entry.record, overviewLanguage) }}</strong
            ><small>{{ serverName() }} · {{ entry.record.time }}</small>
          </div>
          <span>{{
            stats.unknown
              ? "—"
              : `${entry.partial ? "At least " : ""}${entry.pulls} pulls`
          }}</span>
        </div>
        <div class="pagination">
          <span class="pagination-info">
            {{ goldPage }} / {{ goldPageCount }} · {{ stats.goldHistory.length }} records
          </span>
          <nav class="pagination-links" :aria-label="`${topRank}-star history pagination`">
            <button
              type="button"
              class="text-button"
              :disabled="goldPage <= 1"
              @click="goldPage--"
            >&lt; Previous</button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              class="text-button"
              :disabled="goldPage >= goldPageCount"
              @click="goldPage++"
            >Next &gt;</button>
          </nav>
        </div>
      </section>

      <section class="gacha-panel">
        <h3>Record history</h3>
        <div class="controls record-controls">
          <label
            >Search items<input
              v-model="search"
              type="search"
              placeholder="Name or item ID" /></label
          ><label
            >Rarity<select v-model="rankFilter">
              <option value="all">All</option>
              <option v-for="rank in rarityOptions" :key="rank" :value="String(rank)">
                {{ rarityLabel(rank) }}
              </option>
              <option value="null">Unknown</option>
            </select></label
          >
          <label
            >Display language<select v-model="displayLanguage">
              <option
                v-for="(name, code) in exportLanguages"
                :key="code"
                :value="code"
              >
                {{ name }}
              </option>
            </select></label
          >
          <label
            >Records per page<select v-model.number="pageSize">
              <option v-for="size in [5, 10, 20, 50, 100]" :key="size" :value="size">
                {{ size }}
              </option>
            </select></label
          >
        </div>
        <div class="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Rarity</th>
                <th>Pool</th>
                <th>Server time</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in visible" :key="`${rowGame(row)}:${row.id}`">
                <td>
                  <span class="item"
                    ><img
                      v-if="itemMetadata(row)?.icon"
                      :src="itemMetadata(row)!.icon!"
                      alt=""
                      loading="lazy"
                      referrerpolicy="no-referrer"
                    /><span :class="{ gold: rowRank(row) === 5 }"
                      >{{ itemName(row)
                      }}<small>ID {{ row.item_id }}</small></span
                    ></span
                  >
                </td>
                <td>{{ rowRank(row) ?? "Unknown" }}</td>
                <td>{{ displayPoolName(displayPoolKey(row), displayLanguage) }}</td>
                <td>{{ serverName(displayLanguage) }} · {{ row.time }}</td>
              </tr>
              <tr v-if="!visible.length">
                <td colspan="4">No matching records.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="muted">
          Timestamps retain the archive's server
          timezone (UTC{{ selected.accounts[0].timezone >= 0 ? '+' : '' }}{{ selected.accounts[0].timezone }}),
          without conversion to your device timezone or daylight saving time.
        </p>
        <p class="muted">
          Fetched records use UTC+8 for China / Asia / TW-HK-MO, UTC+1 for
          Europe, and UTC−5 for America. Imported records keep their archive's
          timezone; UTC+8 alone cannot distinguish China, Asia and TW-HK-MO.
        </p>
        <div class="pagination">
          <span class="pagination-info">
            {{ page }} / {{ pageCount }} · {{ filtered.length }} records
          </span>
          <nav class="pagination-links" aria-label="Record history pagination">
            <button
              type="button"
              class="text-button"
              :disabled="page <= 1"
              @click="page--"
            >&lt; Previous</button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              class="text-button"
              :disabled="page >= pageCount"
              @click="page++"
            >Next &gt;</button>
          </nav>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.gacha-manager {
  display: grid;
  gap: 24px;
  margin-top: 24px;
}
.gacha-panel {
  min-width: 0;
}
.gacha-panel + .gacha-panel {
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
.gacha-manager h2,
.gacha-manager h3 {
  margin: 0 0 16px;
  border: 0;
  padding: 0;
}
.summary-line,
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.connection-memory {
  margin-top: 24px;
}
.remote-service-form .actions {
  margin-top: 16px;
}
.summary-line {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}
.account-controls {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.helper-status {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 12px;
  border-radius: 8px;
  background: var(--vp-c-brand-soft);
  font-size: 13px;
  margin-bottom: 16px;
}
form {
  margin-top: 20px;
}
label {
  display: grid;
  gap: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}
input,
select,
textarea {
  box-sizing: border-box;
  min-width: 0;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
}
textarea {
  resize: vertical;
  overflow-wrap: anywhere;
}
.link-label {
  margin-bottom: 16px;
}
.export-language {
  max-width: 360px;
}
.json-drop-zone {
  position: relative;
  overflow: hidden;
  padding: 24px 16px;
  margin-bottom: 16px;
  border: 2px dashed var(--vp-c-divider);
  border-radius: 12px;
  text-align: center;
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
.json-drop-zone span { font-size: 13px; }
.json-drop-zone:hover, .json-drop-zone.dragging {
  border-color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}
.json-drop-zone.disabled { opacity: 0.5; cursor: not-allowed; }
:deep(.vp-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
.actions :deep(.vp-button + .vp-button) {
  margin-left: 0;
}
:is(button, input, select, textarea, summary):focus-visible,
.json-drop-zone:focus-within {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 3px;
}
.json-drop-zone {
  position: relative;
  overflow: hidden;
}
.json-drop-zone input {
  position: absolute;
  inset: 0;
  opacity: 0;
  height: 100%;
  cursor: inherit;
}
.check {
  display: flex;
  gap: 8px;
  align-items: center;
}
.check input {
  width: auto;
}
.muted {
  color: var(--vp-c-text-2);
  font-size: 13px;
  line-height: 1.7;
}
details {
  border-top: 1px solid var(--vp-c-divider);
  margin-top: 16px;
  padding-top: 12px;
  font-size: 14px;
}
summary {
  cursor: pointer;
  color: var(--vp-c-brand-1);
}
.hint-container {
  overflow-wrap: anywhere;
}
.empty {
  text-align: center;
  padding-block: 40px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
.metrics > div {
  padding: 16px;
  background: var(--vp-c-bg-soft);
  border-radius: 8px;
}
.metrics span {
  display: block;
  font-size: 13px;
  color: var(--vp-c-text-2);
}
.metrics strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1.3;
  font-variant-numeric: tabular-nums;
}
small {
  font-size: 12px;
  font-weight: normal;
}
.gold {
  color: var(--vp-c-warning-1);
}
.table-scroll {
  overflow-x: auto;
  margin: 16px 0;
}
.table-scroll table {
  display: table;
  width: 100%;
  margin: 0;
  font-size: 13px;
}
th,
td {
  white-space: nowrap;
}
.text-button {
  padding: 0;
  border: 0;
  background: none;
  color: var(--vp-c-brand-1);
  text-align: left;
}
.item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.item img {
  width: 36px;
  height: 36px;
  object-fit: contain;
}
.item small,
.gold-entry small {
  display: block;
  color: var(--vp-c-text-2);
}
.gold-entry,
.account-download {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid var(--vp-c-divider);
}
.gold-entry > span {
  white-space: nowrap;
}
.gacha-manager .pagination {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding-top: 24px;
  font-size: 13px;
}
.pagination-info,
.pagination-links {
  white-space: nowrap;
}
.pagination-links {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pagination-links .text-button {
  font: inherit;
  cursor: pointer;
}
.pagination-links .text-button:hover:not(:disabled) {
  text-decoration: underline;
}
.pagination-links .text-button:disabled {
  color: var(--vp-c-text-3);
  cursor: default;
}
@media (max-width: 640px) {
  .controls,
  .account-controls {
    grid-template-columns: 1fr;
  }
  .record-controls {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .metrics strong {
    font-size: 24px;
  }
  .account-download {
    align-items: start;
    flex-direction: column;
  }
}
</style>
