<template>
  <NetworkToolShell
    eyebrow="Speed Test"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress="progress"
    :error="error"
    :button-text="finished ? 'Test again' : 'Start'"
    stoppable
    @run="toggle"
  >
    <div class="network-tool-stats" aria-label="Speed test results">
      <div v-for="stat in stats" :key="stat.label" class="network-tool-stat">
        <span>{{ stat.label }}</span>
        <strong :class="stat.tone && `tool-tone-${stat.tone}`">{{ stat.value }}</strong>
      </div>
    </div>

    <article v-if="exitInfo" class="network-tool-card">
      <header class="network-tool-card-header">
        <VPIcon name="mdi:lan-connect" size="22" aria-hidden="true" />
        <h3>Measured Route</h3>
      </header>
      <p class="network-tool-value">{{ exitLine }}</p>
      <p class="network-tool-detail">{{ exitDetail }}</p>
      <ul v-if="routeWarnings.length" class="network-tool-notes">
        <li v-for="warning in routeWarnings" :key="warning" class="tool-tone-warn">
          {{ warning }}
        </li>
      </ul>
    </article>

    <div v-if="finished" class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>Use</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in useRows" :key="row.id">
            <td>{{ row.label }}</td>
            <td :class="`tool-tone-${row.tone}`">{{ row.value }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul class="network-tool-notes">
      <li>The test connects directly to Cloudflare's speed test servers, so proxy rules may route it differently from other sites.</li>
      <li>A run usually takes 10 to 25 seconds. On a fast line it can transfer several hundred megabytes, which counts toward metered data plans.</li>
      <li>Download and upload speeds exclude the ramp-up period. Latency under load measures bufferbloat.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type Tone,
  browserTimeZoneCountry,
  countryName,
  errorMessage,
  fetchMe,
  fillTemplate,
} from "../theme/utils/networkTools/shared";
import {
  download,
  exit,
  jitter,
  median,
  ping,
  upload,
} from "../theme/utils/networkTools/vendor/speed-test/measure.mjs";
import {
  DC_RE,
  fromMe,
} from "../theme/utils/networkTools/vendor/speed-test/net.mjs";
import {
  USES,
  bloat,
  fmtMbps,
  fmtMs,
  grade,
  gradeTier,
  msTier,
  speedTier,
  uses,
} from "../theme/utils/networkTools/vendor/speed-test/verdict.mjs";

interface SpeedResult {
  idle: number | null;
  jit: number | null;
  down: number | null;
  up: number | null;
  ldown: number | null;
  lup: number | null;
}

interface RouteExit {
  ip: string;
  cc: string;
  city: string;
  asn: number | null;
  org: string;
  colo: string;
  http: string;
}

const emptyResult = (): SpeedResult => ({
  idle: null,
  jit: null,
  down: null,
  up: null,
  ldown: null,
  lup: null,
});

const GRADE_TEXT: Record<string, string> = {
  "A+": "The ping rises by only {ms} ms under load. Calls and games won't notice someone downloading.",
  A: "The ping rises by {ms} ms under load. Calls and most games are fine while the line is busy.",
  B: "The ping rises by {ms} ms under load. Fast games may feel it when someone downloads.",
  C: "The ping rises by {ms} ms under load. Calls and games lag while the line is busy; SQM in the router (fq_codel or CAKE) helps.",
  D: "The ping rises by {ms} ms under load. Calls stutter whenever someone downloads or uploads; turn on SQM (fq_codel or CAKE) in your router.",
  F: "The ping rises by {ms} ms under load. Anything live breaks while the line is busy; SQM (fq_codel or CAKE) in the router usually fixes it.",
};

const USE_LABELS: Record<string, string> = {
  video: "4K video",
  call: "Video calls",
  game: "Online games",
  cloud: "Cloud gaming",
  live: "Live streaming",
};

const USE_TEXT: Record<string, [string, Tone]> = {
  good: ["Good", "ok"],
  ok: ["Usable", "warn"],
  poor: ["Poor", "bad"],
};

const result = ref<SpeedResult>(emptyResult());
const phase = ref("");
const progress = ref(0);
const running = ref(false);
const finished = ref(false);
const stopped = ref(false);
const error = ref<string | null>(null);
const usedBytes = ref(0);
const exitInfo = ref<RouteExit | null>(null);
const coloCode = ref("");
let controller: AbortController | null = null;

const tierTone = (tier: string): Tone => {
  if (tier === "t1" || tier === "t2") return "ok";
  if (tier === "t3") return "warn";
  if (tier === "t4" || tier === "t5") return "bad";
  return "muted";
};

const speedValue = (value: number | null) =>
  value === null ? "N/A" : `${fmtMbps(value)} Mbps`;

const msValue = (value: number | null) =>
  value === null ? "N/A" : `${fmtMs(value)} ms`;

const bufferbloatGrade = computed(() => grade(result.value) as string);

const stats = computed(() => {
  const r = result.value;

  return [
    { label: "Download", value: speedValue(r.down), tone: tierTone(speedTier(r.down)) },
    { label: "Upload", value: speedValue(r.up), tone: tierTone(speedTier(r.up)) },
    { label: "Idle Latency", value: msValue(r.idle), tone: tierTone(msTier(r.idle)) },
    { label: "Jitter", value: msValue(r.jit), tone: "" as Tone },
    { label: "Download Latency", value: msValue(r.ldown), tone: tierTone(msTier(r.ldown)) },
    { label: "Upload Latency", value: msValue(r.lup), tone: tierTone(msTier(r.lup)) },
    {
      label: "Bufferbloat",
      value: bufferbloatGrade.value || "N/A",
      tone: tierTone(gradeTier(bufferbloatGrade.value)),
    },
    {
      label: "Data Used",
      value: usedBytes.value ? `${Math.round(usedBytes.value / 1e6)} MB` : "N/A",
      tone: "" as Tone,
    },
  ];
});

const useRows = computed(() => {
  const levels = uses(result.value) as Record<string, string>;

  return (USES as string[]).map((id) => {
    const [value, tone] = USE_TEXT[levels[id]] ?? ["Unknown", "muted" as Tone];
    return { id, label: USE_LABELS[id], value, tone };
  });
});

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (error.value) return "bad" as const;
  if (!finished.value) return "idle" as const;

  const tier = gradeTier(bufferbloatGrade.value);
  if (tier === "t4" || tier === "t5") return "warn" as const;
  return "ok" as const;
});

const title = computed(() => {
  if (running.value) return phase.value;
  if (finished.value) {
    return `Down ${speedValue(result.value.down)}, up ${speedValue(result.value.up)}`;
  }
  return stopped.value ? "Test Stopped" : "How Fast Is Your Internet?";
});

const summary = computed(() => {
  if (running.value) return "Keep this page open while the test runs.";
  if (finished.value) {
    const template = GRADE_TEXT[bufferbloatGrade.value];
    const added = bloat(result.value);
    return template
      ? `Bufferbloat ${bufferbloatGrade.value}. ${fillTemplate(template, { ms: Math.round(added ?? 0) })}`
      : "Latency under load could not be measured.";
  }
  if (stopped.value) return "Partial results stay on the page. Start again for a full run.";
  return "Measures latency, download, upload, and bufferbloat. Nothing runs until you press Start.";
});

const exitLine = computed(() => {
  const info = exitInfo.value;
  if (!info) return "N/A";
  return [info.city, countryName(info.cc)].filter(Boolean).join(", ");
});

const exitDetail = computed(() => {
  const info = exitInfo.value;
  if (!info) return "";
  const network = info.asn ? `AS${info.asn} ${info.org}`.trim() : info.org;
  const colo = coloCode.value || info.colo;
  return [network, colo && `Served by ${colo}`, info.http].filter(Boolean).join(" · ");
});

const routeWarnings = computed(() => {
  const info = exitInfo.value;
  if (!info) return [];

  const warnings: string[] = [];
  const deviceCountry = browserTimeZoneCountry();
  const sameRegion =
    deviceCountry === "CN" && ["HK", "MO"].includes(info.cc);

  if (deviceCountry && info.cc && deviceCountry !== info.cc && !sameRegion) {
    warnings.push(
      `Your device's time zone is in ${countryName(deviceCountry)}, but the exit is in ${countryName(info.cc)}. This run may measure a proxy, not your own line.`,
    );
  }

  if (info.org && DC_RE.test(info.org)) {
    warnings.push(
      `Your exit is ${info.org}, a data-center network: a proxy, VPN, or cloud server.`,
    );
  }

  return warnings;
});

const loadRoute = async (signal: AbortSignal) => {
  const me = fromMe(await fetchMe(signal));
  exitInfo.value = me ?? (await exit(signal));
};

const start = async () => {
  const active = new AbortController();
  const { signal } = active;

  controller = active;
  running.value = true;
  finished.value = false;
  stopped.value = false;
  error.value = null;
  result.value = emptyResult();
  usedBytes.value = 0;
  progress.value = 0;
  coloCode.value = "";
  phase.value = "Measuring Latency...";

  void loadRoute(signal).catch(() => undefined);

  try {
    const idle = await ping({
      signal,
      onSample: (_ms: number, index: number, total: number) => {
        progress.value = (index / total) * 0.1;
      },
    });
    if (signal.aborted) return;

    coloCode.value = idle.meta.colo;
    result.value.idle = median(idle.samples);
    result.value.jit = jitter(idle.samples);

    phase.value = "Measuring Download...";
    const down = await download({
      signal,
      onTick: (tick: { ms: number; mbps: number; bytes: number }) => {
        result.value.down = tick.mbps;
        progress.value = 0.1 + Math.min(1, tick.ms / 10000) * 0.45;
      },
    });
    if (signal.aborted) return;

    usedBytes.value += down.bytes;
    result.value.down = down.mbps;
    result.value.ldown = median(down.loaded);

    phase.value = "Measuring Upload...";
    const up = await upload({
      signal,
      onTick: (tick: { ms: number; mbps: number }) => {
        result.value.up = tick.mbps;
        progress.value = 0.55 + Math.min(1, tick.ms / 10000) * 0.45;
      },
    });
    if (signal.aborted) return;

    usedBytes.value += up.bytes;
    result.value.up = up.mbps;
    result.value.lup = median(up.loaded);
    progress.value = 1;
    finished.value = true;
  } catch (err) {
    if (!signal.aborted) {
      error.value = `Cloudflare's speed test servers could not be reached: ${errorMessage(err)}`;
    }
  } finally {
    if (controller === active) {
      controller = null;
      stopped.value = signal.aborted;
      running.value = false;
    }
  }
};

const toggle = () => {
  if (controller) {
    controller.abort();
    return;
  }
  void start();
};

onBeforeUnmount(() => {
  controller?.abort();
});
</script>
