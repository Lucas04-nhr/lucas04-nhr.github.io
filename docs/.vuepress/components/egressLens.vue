<template>
  <NetworkToolShell
    eyebrow="EgressLens"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress-range="[9000, 13000]"
    :button-text="finished ? 'Run again' : 'Start'"
    @run="start"
  >
    <div v-if="finished && exits.length" class="network-tool-toolbar">
      <span class="network-tool-count">{{ exits.length }} exits found</span>
      <button type="button" class="network-tool-secondary-button" @click="masked = !masked">
        {{ masked ? "Show IPs" : "Hide IPs" }}
      </button>
    </div>

    <div v-if="finished && exits.length" class="network-tool-grid">
      <article v-for="exit in exits" :key="exit.key" class="network-tool-card">
        <header class="network-tool-card-header">
          <VPIcon
            :name="exit.kind === 'local' ? 'mdi:home-outline' : 'mdi:server-network'"
            size="22"
            aria-hidden="true"
          />
          <h3>{{ exit.letter }} · {{ exit.kind === "local" ? "Local" : "Proxy" }}</h3>
        </header>
        <p class="network-tool-value">{{ exitPlace(exit) }}</p>
        <p class="network-tool-detail">{{ exitNetwork(exit) }}</p>
        <p class="network-tool-detail network-tool-mono">{{ exit.ips.map(showIp).join(" · ") }}</p>
      </article>
    </div>

    <div v-if="finished" class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>Check</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in checkRows" :key="row.id">
            <td>{{ row.label }}</td>
            <td :class="row.tone && `tool-tone-${row.tone}`">{{ row.text }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <details v-for="group in probeGroups" :key="group.id" class="network-tool-disclosure">
      <summary>
        <span>{{ group.title }}</span>
        <span class="network-tool-count">{{ group.answered }} of {{ group.rows.length }} answered</span>
      </summary>
      <div class="network-tool-disclosure-body network-tool-table-wrap">
        <table class="network-tool-table">
          <thead>
            <tr>
              <th>Probe</th>
              <th>Address</th>
              <th>Exit</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.rows" :key="row.id">
              <td>
                <strong>{{ row.name }}</strong>
                <div class="network-tool-detail">{{ row.host }}</div>
              </td>
              <td :class="row.tone && `tool-tone-${row.tone}`">
                <code>{{ row.address }}</code>
                <div v-if="row.note" class="network-tool-detail">{{ row.note }}</div>
              </td>
              <td>{{ row.exit }}</td>
              <td>{{ row.ms }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <ul class="network-tool-notes">
      <li>An address registered to a cloud or hosting company is labeled a proxy, and any other is treated as your local line. A residential proxy or a VPN on an ISP network cannot be told apart this way.</li>
      <li>Your browser talks to each probe directly, and each probe sees your address as any website does.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type Tone,
  TRACE_URL,
  browserTimeZoneCountry,
  countryName,
  formatMs,
} from "../theme/utils/networkTools/shared";
import {
  CHECKS,
  READERS,
  exitOfProbe,
  findings,
  geoOf,
  groupExits,
  maskIp,
  natOf,
  netOf,
  oddProbes,
  parseTrace,
  readProbe,
  srflxAt,
  srflxOf,
  verdictOf,
} from "../theme/utils/networkTools/vendor/egresslens/lib.mjs";
import {
  GROUPS,
  PROBES,
} from "../theme/utils/networkTools/vendor/egresslens/probes.mjs";

interface Probe {
  id: string;
  g: string;
  name: string;
  host: string;
  url: string;
  read: string;
  fam?: number;
  self?: number;
}

interface ProbeResult {
  ip: string;
  geo?: { cc: string; city: string; asn: number | null; org: string };
  cf?: { colo: string; loc: string; warp: string };
}

interface ExitInfo {
  key: string;
  ips: string[];
  probes: string[];
  cc: string;
  city: string;
  asn: number | null;
  org: string;
  dc: boolean;
  warp: boolean;
  kind: "local" | "proxy";
  letter: string;
}

interface Finding {
  s: "ok" | "warn" | "bad" | "info" | "none";
  k: string;
  v: Record<string, any>;
}

const probes = PROBES as Probe[];
const GROUP_OF = Object.fromEntries(probes.map((probe) => [probe.id, probe.g]));

const GROUP_TITLES: Record<string, string> = {
  cn: "Sites in Mainland China",
  intl: "IP Lookup Services",
  ai: "AI Services",
  web: "Popular Sites",
  stack: "IPv4 Only / IPv6 Only",
  udp: "WebRTC (UDP)",
};

const CHECK_LABELS: Record<string, string> = {
  route: "Routing",
  except: "Exceptions",
  ai: "AI region",
  rtc: "WebRTC",
  nat: "NAT type",
  v6: "IPv6",
  tz: "Time zone",
};

const FAILURE_TEXT: Record<string, string> = {
  timeout: "No answer within 7 seconds",
  http: "Answered HTTP {n}",
  net: "Couldn't connect: blocked by the network, the proxy, or an ad blocker",
  parse: "Answered, but without a usable IP address",
  stun: "No STUN reply: UDP is blocked, or the browser disables WebRTC",
};

const VERDICTS: Record<string, [string, "ok" | "warn" | "bad"]> = {
  leak: ["IP Leak Found: Some Traffic Skips the Proxy", "bad"],
  ai: ["AI Services See an Unsupported Region", "bad"],
  split: ["Split Routing: Sites Use Different Exits", "warn"],
  proxy: ["Every Website Sees the Same Proxy Exit", "ok"],
  direct: ["Direct: Every Website Sees the Local IP", "ok"],
};

const probeFailure = (why: string, status?: number) =>
  Object.assign(new Error(why), { why, status });

const results = ref<Record<string, ProbeResult[]>>({});
const failures = ref<Record<string, { why: string; status?: number }>>({});
const timings = ref<Record<string, number | null>>({});
const exits = ref<ExitInfo[]>([]);
const report = ref<Record<string, Finding> | null>(null);
const oddRows = ref<Record<string, { k: string; x: string; y?: string }>>({});
const done = ref(0);
const running = ref(false);
const finished = ref(false);
const masked = ref(false);
let generation = 0;

const showIp = (ip: string) => (masked.value ? maskIp(ip) : ip);

const httpProbe = async (probe: Probe): Promise<ProbeResult[]> => {
  const separator = probe.url.includes("?") ? "&" : "?";
  let response: Response;

  try {
    response = await fetch(
      `${probe.url}${separator}_=${Math.random().toString(36).slice(2, 8)}`,
      {
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
        signal: AbortSignal.timeout(7000),
      },
    );
  } catch (err) {
    throw probeFailure(
      err instanceof Error && err.name === "TimeoutError" ? "timeout" : "net",
    );
  }

  if (!response.ok) throw probeFailure("http", response.status);

  let parsed: ProbeResult | null = null;
  try {
    const text = await response.text();
    const isText = probe.read === "text" || probe.read === "trace";
    parsed = readProbe(probe, isText ? text : JSON.parse(text));
  } catch {
    parsed = null;
  }

  if (!parsed) throw probeFailure("parse");
  return [parsed];
};

const gatherCandidates = async <T,>(
  iceServers: RTCIceServer[],
  timeout: number,
  read: (line: string) => T | null,
): Promise<T[]> => {
  if (!window.RTCPeerConnection) return [];

  let connection: RTCPeerConnection | null = null;
  const found: T[] = [];

  try {
    connection = new RTCPeerConnection({ iceServers });
    connection.createDataChannel("x");

    const gathered = new Promise<void>((resolve) => {
      connection!.onicecandidate = (event) => {
        if (!event.candidate) {
          resolve();
          return;
        }
        const value = read(event.candidate.candidate);
        if (value) found.push(value);
      };
      window.setTimeout(resolve, timeout);
    });

    await connection.setLocalDescription(await connection.createOffer());
    await gathered;
    return found;
  } catch {
    return found;
  } finally {
    connection?.close();
  }
};

const stunProbe = async (probe: Probe): Promise<ProbeResult[]> => {
  const addresses = await gatherCandidates<string>(
    [{ urls: probe.url }],
    4000,
    srflxOf,
  );
  return [...new Set(addresses)].map((ip) => ({ ip }));
};

const natProbe = () =>
  gatherCandidates<{ ip: string; port: number }>(
    probes.filter((probe) => probe.g === "udp").map((probe) => ({ urls: probe.url })),
    5000,
    srflxAt,
  );

const seenAddresses = () =>
  probes.flatMap((probe) =>
    (results.value[probe.id] ?? []).map((result) => ({
      ip: result.ip,
      probe: probe.id,
    })),
  );

const start = async () => {
  const current = ++generation;
  const geo: Record<string, ProbeResult["geo"]> = {};
  const lookups: Promise<void>[] = [];
  const looked = new Set<string>();
  let warp = "off";

  running.value = true;
  finished.value = false;
  results.value = {};
  failures.value = {};
  timings.value = {};
  exits.value = [];
  report.value = null;
  oddRows.value = {};
  done.value = 0;

  fetch(TRACE_URL, { cache: "no-store", signal: AbortSignal.timeout(5000) })
    .then((response) => (response.ok ? response.text() : ""))
    .then((text) => {
      warp = parseTrace(text).warp || "off";
    })
    .catch(() => undefined);

  const lookup = (ip: string) => {
    if (geoOf(geo, ip) || looked.has(netOf(ip)) || looked.size >= 8) return;
    looked.add(netOf(ip));
    lookups.push(
      fetch(`https://api.ip.sb/geoip/${encodeURIComponent(ip)}`, {
        cache: "no-store",
        credentials: "omit",
        signal: AbortSignal.timeout(6000),
      })
        .then((response) => (response.ok ? response.json() : Promise.reject()))
        .then((body) => {
          const parsed = READERS.ipsb(body);
          if (current === generation && parsed.geo) geo[ip] = parsed.geo;
        })
        .catch(() => undefined),
    );
  };

  const natPromise = natProbe();

  await Promise.all(
    probes.map(async (probe) => {
      const startedAt = performance.now();
      let answers: ProbeResult[] = [];
      let failure: { why: string; status?: number } | undefined;

      try {
        answers = await (probe.read === "stun" ? stunProbe(probe) : httpProbe(probe));
        if (!answers.length) failure = { why: "stun" };
      } catch (err) {
        const known = err as { why?: string; status?: number };
        failure = { why: known.why ?? "net", status: known.status };
      }
      if (current !== generation) return;

      if (failure) failures.value[probe.id] = failure;
      timings.value[probe.id] =
        probe.read === "stun" ? null : performance.now() - startedAt;
      results.value[probe.id] = answers;

      for (const answer of answers) {
        if (answer.geo && (answer.geo.cc || answer.geo.asn) && !geo[answer.ip]) {
          geo[answer.ip] = answer.geo;
        }
      }

      done.value += 1;
    }),
  );
  if (current !== generation) return;

  for (const { ip } of seenAddresses()) lookup(ip);
  await Promise.allSettled(lookups);
  const candidates = await natPromise;
  if (current !== generation) return;

  const grouped = groupExits(seenAddresses(), geo, GROUP_OF, warp) as ExitInfo[];
  const cloudflareViews = Object.fromEntries(
    probes
      .map((probe) => [probe.id, results.value[probe.id]?.[0]?.cf])
      .filter(([, view]) => view),
  );
  const stunViews = Object.fromEntries(
    probes
      .filter((probe) => probe.g === "udp")
      .map((probe) => [
        probe.id,
        (results.value[probe.id] ?? []).map((result) => result.ip),
      ]),
  );
  const nat = natOf(candidates, stunViews, grouped);

  exits.value = grouped;
  report.value = findings(
    probes,
    grouped,
    cloudflareViews,
    browserTimeZoneCountry(),
    nat,
  );
  oddRows.value = oddProbes(probes, grouped);
  running.value = false;
  finished.value = true;
};

const exitOf = (letter: string) =>
  exits.value.find((exit) => exit.letter === letter);

const exitPlace = (exit: ExitInfo) =>
  [exit.city, exit.cc && countryName(exit.cc)].filter(Boolean).join(", ") ||
  "Unknown place";

const exitNetwork = (exit: ExitInfo) =>
  [exit.asn ? `AS${exit.asn}` : "", exit.org, exit.warp ? "WARP" : ""]
    .filter(Boolean)
    .join(" · ") || "Unknown network";

const exitLabel = (letter?: string) => {
  const exit = letter ? exitOf(letter) : undefined;
  if (!exit) return letter ?? "";
  return `${letter} ${exit.cc ? countryName(exit.cc) : exitPlace(exit)}`;
};

const probeName = (id: string) => {
  if (id === "@v6") return "IPv6-only sites";

  const probe = probes.find((item) => item.id === id);
  if (!probe) return id;
  if (probe.self) return "This site's API";
  if (probe.g === "stack") return `${probe.name} IPv${probe.fam}`;
  if (probe.g === "udp") return `STUN ${probe.name}`;
  return probe.name;
};

const findingText = (id: string, finding: Finding) => {
  const { k, v } = finding;

  if (finding.s === "none") return "N/A";

  switch (id) {
    case "route":
      return k === "split"
        ? `China ${exitLabel(v.a)}, abroad ${exitLabel(v.b)}`
        : `Everything via ${exitLabel(v.a)}`;
    case "except":
      return k === "some"
        ? v.groups
            .map(
              (group: { x: string; list: string[] }) =>
                `${group.list.map(probeName).join(", ")} → ${exitLabel(group.x)}`,
            )
            .join("; ")
        : "None";
    case "ai":
      if (k === "bad") {
        return `${v.list.map(probeName).join(", ")} see ${countryName(v.c)}: not a supported region`;
      }
      return `${exitLabel(v.x)}: ChatGPT and Claude are available${v.dc ? " · data-center IP, more likely to be challenged" : ""}`;
    case "rtc":
      if (k === "leak") return `Leaks your local IP ${exitLabel(v.a)}`;
      if (k === "proxy") return `Via proxy ${exitLabel(v.a)}, no leak`;
      if (k === "same") return `${exitLabel(v.a)}, same as websites`;
      return "No leak (UDP blocked)";
    case "nat": {
      const base: Record<string, string> = {
        cone: "Cone (one of NAT1–3): the same public port for every server",
        sym: "Symmetric (NAT4): a new public port for each server, so P2P and game hosting often fail",
        none: "Can't tell: fewer than two STUN servers answered",
      };
      return [
        base[k],
        v.px ? "this is your proxy's NAT, not your line's" : "",
        v.multi ? "servers see different public IPs (carrier-grade NAT or several lines)" : "",
      ]
        .filter(Boolean)
        .join(" · ");
    }
    case "v6":
      if (k === "leak") return `Bypasses the proxy, exposes ${exitLabel(v.a)}`;
      if (k === "ok") return `Via ${exitLabel(v.a)}`;
      return "No IPv6 exit";
    case "tz":
      return k === "ok"
        ? `Matches the exit (${countryName(v.a)})`
        : `Browser says ${countryName(v.a)}, exit is in ${countryName(v.b)}: easy to spot as a proxy`;
    default:
      return "N/A";
  }
};

const STATUS_TONES: Record<Finding["s"], Tone> = {
  ok: "ok",
  warn: "warn",
  bad: "bad",
  info: "",
  none: "muted",
};

const checkRows = computed(() => {
  const current = report.value;
  if (!current) return [];

  return (CHECKS as string[]).map((id) => ({
    id,
    label: CHECK_LABELS[id],
    text: findingText(id, current[id]),
    tone: STATUS_TONES[current[id].s],
  }));
});

const probeGroups = computed(() => {
  const labels = exitOfProbe(exits.value) as Record<string, string[]>;

  return (GROUPS as string[]).map((id) => {
    const rows = probes
      .filter((probe) => probe.g === id)
      .map((probe) => {
        const answers = results.value[probe.id];
        const failure = failures.value[probe.id];
        const odd = oddRows.value[probe.id];
        let note = "";
        let tone: Tone = "";

        if (failure) {
          note = (FAILURE_TEXT[failure.why] ?? "").replace(
            "{n}",
            String(failure.status ?? ""),
          );
          tone = "muted";
        } else if (odd?.k === "leak") {
          note = `Sees your local exit ${exitLabel(odd.x)} over UDP: the proxy doesn't carry WebRTC`;
          tone = "bad";
        } else if (odd?.k === "odd") {
          note = `Sees ${exitLabel(odd.x)}; most similar sites see ${exitLabel(odd.y)}`;
          tone = "warn";
        }

        let address = running.value ? "..." : "N/A";
        if (answers?.length) address = answers.map((answer) => showIp(answer.ip)).join(" · ");
        else if (failure) address = "No answer";

        return {
          id: probe.id,
          name: probeName(probe.id),
          host: probe.self ? "ip.lucas04.top" : probe.host,
          address,
          note,
          tone,
          exit: (labels[probe.id] ?? []).join(", ") || "N/A",
          ms: timings.value[probe.id] != null ? formatMs(timings.value[probe.id]) : "N/A",
          answered: Boolean(answers?.length),
        };
      });

    return {
      id,
      title: GROUP_TITLES[id],
      rows,
      answered: rows.filter((row) => row.answered).length,
    };
  });
});

const verdictKey = computed(() =>
  report.value ? (verdictOf(report.value, exits.value) as string | null) : null,
);

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (!finished.value) return "idle" as const;
  return verdictKey.value ? VERDICTS[verdictKey.value][1] : ("bad" as const);
});

const title = computed(() => {
  if (running.value) return "Asking the Probes...";
  if (!finished.value) return "Which IP Addresses Does the Internet See You As?";
  return verdictKey.value ? VERDICTS[verdictKey.value][0] : "No Probe Answered";
});

const summary = computed(() => {
  if (running.value) return `${done.value} of ${probes.length} probes finished.`;
  if (!finished.value) {
    return `${probes.length} probes, in mainland China and abroad, at AI services, over IPv4, IPv6, and WebRTC, show every exit your traffic takes.`;
  }
  return verdictKey.value
    ? `${exits.value.length} exits found across ${probes.length} probes.`
    : "Are you offline? An ad blocker may also be blocking the probes.";
});

onMounted(() => {
  void start();
});

onBeforeUnmount(() => {
  generation += 1;
});
</script>
