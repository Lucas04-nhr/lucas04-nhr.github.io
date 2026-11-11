<template>
  <NetworkToolShell
    eyebrow="CDN Radar"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress-range="[7000, 11000]"
    :button-text="finished ? 'Test again' : 'Start'"
    stoppable
    @run="toggle"
  >
    <div class="network-tool-stats" aria-label="CDN summary">
      <div class="network-tool-stat">
        <span>Your Location</span>
        <strong>{{ visitorText }}</strong>
      </div>
      <div class="network-tool-stat">
        <span>Nearby</span>
        <strong>{{ report ? `${report.near} of ${report.located}` : "N/A" }}</strong>
      </div>
      <div class="network-tool-stat">
        <span>Median Round Trip</span>
        <strong>{{ formatMs(report?.med) }}</strong>
      </div>
      <div class="network-tool-stat">
        <span>Farthest</span>
        <strong>{{ farthestText }}</strong>
      </div>
    </div>

    <ul v-if="findingLines.length" class="network-tool-notes">
      <li
        v-for="line in findingLines"
        :key="line.text"
        :class="line.tone && `tool-tone-${line.tone}`"
      >
        {{ line.text }}
      </li>
    </ul>

    <div class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>CDN</th>
            <th>Location</th>
            <th>Distance</th>
            <th>Round Trip</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in tableRows" :key="row.id">
            <td>
              <strong>{{ row.name }}</strong>
              <div v-if="row.flag" class="network-tool-detail">{{ row.flag }}</div>
            </td>
            <td>{{ row.location }}</td>
            <td :class="row.distanceTone && `tool-tone-${row.distanceTone}`">{{ row.distance }}</td>
            <td :class="`tool-tone-${row.msTone}`">{{ row.ms }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <article class="network-tool-card cdn-radar-site" :class="`is-${siteStatus}`">
      <header class="network-tool-card-header">
        <VPIcon name="mdi:web-check" size="22" aria-hidden="true" />
        <h3>Check a Website</h3>
      </header>
      <form class="cdn-radar-site-form" @submit.prevent="checkSite">
        <input
          v-model="siteInput"
          type="text"
          inputmode="url"
          placeholder="example.com"
          aria-label="Website domain"
        />
        <button class="network-tool-secondary-button" type="submit" :disabled="siteChecking">
          {{ siteChecking ? "Checking..." : "Check" }}
        </button>
      </form>
      <p v-if="siteLine" class="network-tool-value">{{ siteLine }}</p>
      <p v-if="siteDetail" class="network-tool-detail">{{ siteDetail }}</p>
    </article>

    <ul class="network-tool-notes">
      <li>Your location comes from Cloudflare's reading of your IP address, so with a proxy it is the proxy's location.</li>
      <li>A round trip cannot be shorter than the distance divided by 100 km per millisecond, the speed of light in fiber there and back.</li>
      <li>Google, Alibaba Cloud, Tencent EdgeOne, Wangsu, Gcore, and CDN77 do not let pages read which location answered, so they are timed only.</li>
      <li>The website check sends the domain to this site's API for a DNS lookup through Cloudflare's resolver.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type ConnectionSummary,
  type Tone,
  countryName,
  fetchMe,
  formatMs,
  msTone,
} from "../theme/utils/networkTools/shared";
import {
  BY,
  CDNS,
  PARSE,
  SITE_HEADERS,
  SITE_TIMING,
  cdnOfName,
  isCloudflareIP,
  nameOf,
  placeOf,
  popMaps,
} from "../theme/utils/networkTools/vendor/cdn-radar/cdns.mjs";
import {
  detoured,
  floorMs,
  hostOf,
  km,
  missedNearest,
  nearest,
  summary as summarize,
  tierOf,
} from "../theme/utils/networkTools/vendor/cdn-radar/lib.mjs";
import {
  dns,
  once,
  probe,
  readPop,
} from "../theme/utils/networkTools/vendor/cdn-radar/probe.mjs";

type Place = [string, string, number, number];

interface CdnRow {
  id: string;
  code: string | null;
  place: Place | null;
  ms: number | null;
  d: number | null;
  near: [string, Place, number] | null;
}

interface Finding {
  kind: "bad" | "warn" | "ok";
  key: string;
  ids?: string[];
  row?: CdnRow;
  n?: number;
}

interface PlaceData {
  pops: Record<string, Record<string, Place>>;
  places: {
    iata: Record<string, [number, number, string, string]>;
    city: Record<string, [number, number, string]>;
  };
}

const POOL_SIZE = 4;

const rows = shallowRef<Record<string, CdnRow | undefined>>({});
const visitor = ref<ConnectionSummary | null>(null);
const running = ref(false);
const finished = ref(false);
const siteInput = ref("");
const siteChecking = ref(false);
const siteStatus = ref<"idle" | "running" | "ok" | "bad">("idle");
const siteLine = ref("");
const siteDetail = ref("");
let controller: AbortController | null = null;
let siteController: AbortController | null = null;
let placeData: Promise<PlaceData> | null = null;

const loadPlaces = () => {
  placeData ??= Promise.all([
    import("../theme/utils/networkTools/vendor/cdn-radar/data/pops.json"),
    import("../theme/utils/networkTools/vendor/cdn-radar/data/places.json"),
  ]).then(([pops, places]) => ({
    pops: popMaps(pops.default),
    places: places.default,
  }));
  return placeData;
};

const cdnName = (id: string) =>
  BY[id] ? nameOf(BY[id], "en") : id;

const placeText = (place: Place | null) =>
  place ? `${place[0]}, ${countryName(place[1])}` : "";

const kmText = (distance: number) =>
  `${Math.round(distance).toLocaleString("en-US")} km`;

const hasPosition = computed(
  () => visitor.value?.lat != null && visitor.value?.lon != null,
);

const buildRow = (
  id: string,
  code: string | null,
  ms: number | null,
  data: PlaceData,
): CdnRow => {
  const place = code ? (placeOf(id, code, data.pops, data.places) as Place | null) : null;
  const me = visitor.value;
  const hasDistance = place && hasPosition.value;
  const list = BY[id]?.list && data.pops[BY[id].list];

  return {
    id,
    code,
    place,
    ms,
    d: hasDistance ? km(me!.lat, me!.lon, place[2], place[3]) : null,
    near: list && hasPosition.value ? nearest(list, me!.lat, me!.lon) : null,
  };
};

const resolved = computed(() =>
  Object.values(rows.value).filter((row): row is CdnRow => Boolean(row)),
);

const completed = computed(() => resolved.value.length);

const report = computed(() =>
  finished.value ? summarize(resolved.value) : null,
);

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (!report.value) return "idle" as const;
  if (report.value.key === "v_good") return "ok" as const;
  if (report.value.key === "v_none") return "bad" as const;
  return "warn" as const;
});

const HEADLINES: Record<string, string> = {
  v_good: "CDNs Serve You From Nearby",
  v_mixed: "Some CDNs Send You Far Away",
  v_far: "Most CDNs Send You Far Away",
  v_noloc: "Done, but Your Location Is Unknown",
  v_none: "No CDN Answered",
};

const title = computed(() => {
  if (running.value) return "Testing...";
  return report.value ? HEADLINES[report.value.key] : "Which CDN Locations Serve You?";
});

const summary = computed(() => {
  if (running.value) return `${completed.value} of ${CDNS.length} CDNs answered so far.`;
  if (!report.value) {
    return `Tests ${CDNS.length} CDNs from your browser.`;
  }
  if (report.value.located) {
    return `${report.value.located} CDNs said where they answered from: ${report.value.near} nearby, ${report.value.far} far away.`;
  }
  return "No distances could be worked out from this run.";
});

const visitorText = computed(() => {
  const me = visitor.value;
  if (!me) return running.value ? "Checking..." : "N/A";
  if (!hasPosition.value) return "Location unknown";
  return [me.city, countryName(me.country)].filter(Boolean).join(", ");
});

const farthestText = computed(() => {
  const row: CdnRow | null | undefined = report.value?.farthest;
  if (!row || row.d === null) return "N/A";
  return `${cdnName(row.id)}, ${kmText(row.d)}`;
});

const nameList = (ids: string[] = []) => ids.map(cdnName).join(", ");

const findingText = (finding: Finding) => {
  const row = finding.row;

  if (finding.key === "f_fail") {
    return `${nameList(finding.ids)} didn't answer: a browser extension or your network may block them, and sites on them may not load for you.`;
  }
  if (finding.key === "f_more") {
    return `${finding.n} more serve you from far away; see the table.`;
  }
  if (finding.key === "f_fast") {
    return `${nameList(finding.ids)} answer within 30 ms.`;
  }
  if (!row || row.d === null) return "";

  const base = `${cdnName(row.id)} serves you from ${placeText(row.place)}, ${kmText(row.d)} away`;
  if (finding.key === "f_slowpath") {
    return `${base}, but takes ${formatMs(row.ms)}: far beyond the ${formatMs(floorMs(row.d))} the distance needs.`;
  }

  const nearestLine =
    row.near && missedNearest(row.d, row.near)
      ? ` Its nearest location is ${placeText(row.near[1])}, ${kmText(row.near[2])} away.`
      : "";
  return `${base}: ${formatMs(row.ms)} round trip.${nearestLine}`;
};

const FINDING_TONES: Record<Finding["kind"], Tone> = {
  bad: "bad",
  warn: "warn",
  ok: "ok",
};

const findingLines = computed(() =>
  ((report.value?.findings ?? []) as Finding[])
    .map((finding) => ({
      text: findingText(finding),
      tone: FINDING_TONES[finding.kind],
    }))
    .filter((line) => line.text),
);

const distanceTones: Record<string, Tone> = {
  t1: "ok",
  t2: "ok",
  t3: "warn",
  t5: "bad",
};

const flagOf = (row: CdnRow) => {
  const flags: string[] = [];
  if (row.d !== null && row.near && missedNearest(row.d, row.near)) {
    flags.push(`Not the nearest: ${placeText(row.near[1])} is ${kmText(row.near[2])} away`);
  }
  if (row.d !== null && row.ms !== null && detoured(row.ms, row.d)) {
    flags.push(`Long way round: this distance allows ${formatMs(floorMs(row.d))}`);
  }
  return flags.join(" · ");
};

const tableRows = computed(() =>
  (CDNS as { id: string; read: string | null }[]).map((cdn) => {
    const row = rows.value[cdn.id];
    const waiting = running.value ? "..." : "N/A";

    if (!row) {
      return {
        id: cdn.id,
        name: cdnName(cdn.id),
        flag: "",
        location: waiting,
        distance: waiting,
        distanceTone: "" as Tone,
        ms: waiting,
        msTone: "muted" as Tone,
      };
    }

    let location = cdn.read ? "Didn't say where" : "Not public";
    if (row.place) location = placeText(row.place);
    else if (row.code) location = `${row.code} (unknown place)`;
    if (row.ms === null) location = "N/A";

    return {
      id: cdn.id,
      name: cdnName(cdn.id),
      flag: flagOf(row),
      location,
      distance: row.d === null ? "N/A" : kmText(row.d),
      distanceTone: row.d === null ? ("" as Tone) : distanceTones[tierOf(row.d)[1]],
      ms: row.ms === null ? "No answer" : formatMs(row.ms),
      msTone: row.ms === null ? ("bad" as Tone) : msTone(row.ms),
    };
  }),
);

const start = async () => {
  const active = new AbortController();
  const { signal } = active;

  controller = active;
  running.value = true;
  finished.value = false;
  rows.value = {};

  const [data, me] = await Promise.all([loadPlaces(), fetchMe(signal)]);
  if (signal.aborted) return;
  visitor.value = me;

  const queue = [...CDNS];
  await Promise.all(
    Array.from({ length: POOL_SIZE }, async () => {
      while (queue.length && !signal.aborted) {
        const cdn = queue.shift();
        let result: { ms: number | null; code: string | null } | null;
        try {
          result = await probe(cdn, signal);
        } catch {
          result = null;
        }
        if (signal.aborted) return;
        rows.value = {
          ...rows.value,
          [cdn.id]: buildRow(cdn.id, result?.code ?? null, result?.ms ?? null, data),
        };
      }
    }),
  );

  if (controller === active) {
    controller = null;
    running.value = false;
    finished.value = !signal.aborted;
  }
};

const toggle = () => {
  if (controller) {
    controller.abort();
    controller = null;
    running.value = false;
    return;
  }
  void start();
};

const checkSite = async () => {
  const host = hostOf(siteInput.value) as string | null;

  if (!host) {
    siteLine.value = "Enter a domain, like example.com";
    siteDetail.value = "";
    siteStatus.value = "bad";
    return;
  }

  siteController?.abort();
  const active = new AbortController();
  const { signal } = active;
  const site: { cdn: string | null; code: string | null; cname: string | null } = {
    cdn: null,
    code: null,
    cname: null,
  };

  siteController = active;
  siteChecking.value = true;
  siteStatus.value = "running";
  siteLine.value = `Checking ${host}...`;
  siteDetail.value = "";

  try {
    const lookup = dns(host, signal)
      .then((answer: { cnames: string[]; ips: string[] } | null) => {
        if (!answer) return;
        for (const name of answer.cnames) {
          const found = cdnOfName(name);
          if (found) {
            site.cdn = found;
            site.cname = name;
            break;
          }
        }
        if (!site.cdn && answer.ips.some(isCloudflareIP)) site.cdn = "cloudflare";
      })
      .catch(() => undefined);

    const base = `https://${host}`;
    let timeUrl = `${base}/favicon.ico`;

    try {
      const trace = await once(`${base}/cdn-cgi/trace`, true, 6000, signal);
      const colo = PARSE.trace(trace.body);
      if (colo) {
        site.cdn = "cloudflare";
        site.code = colo;
        timeUrl = `${base}/cdn-cgi/trace`;
      }
    } catch {
      if (signal.aborted) return;
    }

    if (!site.code) {
      const readable = await once(timeUrl, true, 6000, signal).catch(() => null);
      if (signal.aborted) return;
      if (readable) {
        for (const [header, id] of SITE_HEADERS) {
          const code = readPop(`h:${header}`, readable);
          if (code) {
            site.cdn = id;
            site.code = code;
            break;
          }
        }
      }
    }

    if (!site.code) {
      const opaque = await once(timeUrl, false, 6000, signal).catch(() => null);
      if (signal.aborted) return;
      if (opaque) {
        for (const [name, id] of SITE_TIMING) {
          const code = readPop(`st:${name}`, opaque);
          if (code) {
            site.cdn = id;
            site.code = code;
            break;
          }
        }
      }
    }

    await lookup;
    const timing = await probe({ url: timeUrl, read: null }, signal).catch(() => null);
    if (signal.aborted) return;

    const data = await loadPlaces();
    const row = site.cdn && BY[site.cdn] && site.code
      ? buildRow(site.cdn, site.code, timing?.ms ?? null, data)
      : null;
    const cdnLabel = site.cdn ? cdnName(site.cdn) : "No known CDN";
    const where = row?.place ? `answers from ${placeText(row.place)}` : site.code ? `answers from ${site.code}` : "";

    siteStatus.value = timing?.ms != null ? "ok" : "bad";
    siteLine.value = [host, cdnLabel, where].filter(Boolean).join(" · ");
    siteDetail.value = [
      row?.d != null ? kmText(row.d) : "",
      timing?.ms != null ? `${formatMs(timing.ms)} round trip` : "No answer",
      site.cname ? `CNAME ${site.cname}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  } catch {
    if (signal.aborted) return;
    siteStatus.value = "bad";
    siteLine.value = `Couldn't check ${host}`;
  } finally {
    if (siteController === active) {
      siteController = null;
      siteChecking.value = false;
    }
  }
};

onMounted(() => {
  void start();
});

onBeforeUnmount(() => {
  controller?.abort();
  controller = null;
  siteController?.abort();
  siteController = null;
});
</script>

<style scoped>
/* The website check has its own status, separate from the page's CDN test. */
.cdn-radar-site {
  border-left: 5px solid var(--tool-accent);
}

.cdn-radar-site.is-idle {
  --tool-accent: var(--vp-c-brand-1);
}

.cdn-radar-site.is-running {
  --tool-accent: var(--status-neutral);
}

.cdn-radar-site.is-ok {
  --tool-accent: var(--tool-ok);
}

.cdn-radar-site.is-bad {
  --tool-accent: var(--tool-bad);
}

.cdn-radar-site-form {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}

.cdn-radar-site-form input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 8px 12px;
  border: 1px solid var(--tool-border);
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
}
</style>
