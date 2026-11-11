<template>
  <NetworkToolShell
    eyebrow="Who Are You"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress-range="[5000, 8000]"
    :button-text="finished ? 'Run again' : 'Start'"
    @run="start"
  >
    <div ref="bait" class="adsbox ad-banner ad-placement who-are-you-bait" aria-hidden="true" />

    <div
      v-if="running || finished"
      ref="statsGrid"
      class="network-tool-stats"
      aria-label="Who sites think you are"
    >
      <div v-for="item in portrait" :key="item.label" class="network-tool-stat">
        <span>{{ item.label }}</span>
        <strong
          ref="statValues"
          class="who-are-you-stat-value"
          :title="blurred && item.sensitive ? undefined : item.value"
        >
          <VPPlot v-if="blurred && item.sensitive" class="who-are-you-stat-text">{{ item.value }}</VPPlot>
          <span v-else class="who-are-you-stat-text">{{ item.value }}</span>
        </strong>
      </div>
    </div>

    <div v-if="running || finished" class="network-tool-toolbar">
      <span class="network-tool-count">{{ filled }} of {{ totalRows }} sniffers read</span>
      <button type="button" class="network-tool-secondary-button" @click="blurred = !blurred">
        {{ blurred ? "Show location" : "Blur location" }}
      </button>
    </div>

    <div v-if="finished" class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>Disguise Check</th>
            <th>Result</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in checkRows" :key="row.id">
            <td>{{ row.label }}</td>
            <td :class="row.tone && `tool-tone-${row.tone}`">
              {{ row.text }}
              <div v-if="row.tip" class="network-tool-detail who-are-you-tip">{{ row.tip }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details v-for="group in groups" :key="group.id" class="network-tool-disclosure">
      <summary>
        <span>{{ group.title }}</span>
        <span class="network-tool-count">{{ group.rows.length }} sniffers</span>
      </summary>
      <div class="network-tool-disclosure-body network-tool-table-wrap">
        <table class="network-tool-table">
          <thead>
            <tr>
              <th>Reading</th>
              <th>Value</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in group.rows" :key="row.id">
              <td>{{ row.label }}</td>
              <td>
                <VPPlot v-if="blurred && row.sensitive">{{ row.value }}</VPPlot>
                <template v-else>{{ row.value }}</template>
              </td>
              <td><code>{{ row.method }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
    </details>

    <details v-if="rawOutput" class="network-tool-disclosure">
      <summary>
        <span>Raw JSON Output from API</span>
        <span class="network-tool-count">/v1/whoami</span>
      </summary>
      <div class="network-tool-disclosure-body">
        <p v-if="blurred" class="network-tool-detail">Hidden while location is blurred.</p>
        <div v-else class="vp-code-group who-are-you-raw">
          <CodeViewer lang="json" :content="rawOutput" />
        </div>
      </div>
    </details>

    <ul class="network-tool-notes">
      <li>Any website can read all of this without a permission prompt. Nothing here is stored by this page.</li>
      <li>The server only answers one request to <code>/v1/whoami</code> with what it already sees in it. To find your egress IPs and DNS resolver, your browser also contacts IPIP.NET, IP.SB, ip-api, Cloudflare Radar, the Cloudflare trace on chatgpt.com, claude.ai, and cloudflare.com, and two STUN servers.</li>
      <li>"Nationality" is only a guess from your browser language and system time zone.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import CodeViewer from "./customCodeViewer.vue";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type Tone,
  countryName,
} from "../theme/utils/networkTools/shared";
import {
  type Readings,
  SNIFFER_GROUPS,
  bestGpuName,
  collectReadings,
  isResistFingerprinting,
  readGpuOs,
  refineDnsCheck,
  systemLanguages,
  tzOffset,
} from "../theme/utils/networkTools/whoAreYou";
import {
  checks,
  grade,
  isDataCenter,
  nationality,
  offTxt,
  protocols,
} from "../theme/utils/networkTools/vendor/who-are-you/infer.mjs";

type CheckResult = [string, string, Record<string, string | number | null>] | null;

const CHECK_IDS = ["tz", "lang", "syslang", "dns", "split", "webrtc", "rtt", "dc", "ua", "fp", "bot"];
const PROTOCOL_IDS = ["h3", "ech", "pq", "warp"];

const CHECK_LABELS: Record<string, string> = {
  tz: "Time zone vs IP",
  lang: "Language vs IP",
  syslang: "System language vs IP",
  dns: "DNS leak",
  split: "Split routing",
  webrtc: "WebRTC leak",
  rtt: "Round trip",
  dc: "Data center IP",
  ua: "User agent vs system",
  fp: "Trackable fingerprint",
  bot: "Automation",
  h3: "HTTP/3",
  ech: "ECH",
  pq: "Post-quantum",
  warp: "WARP",
};

const EXIT_NAMES: Record<string, string> = {
  ip: "This site's API",
  ex_cn: "Site in mainland China",
  ex_intl: "IP service abroad",
  ex_gpt: "ChatGPT",
  ex_claude: "Claude",
  ex_cf: "Cloudflare",
  stack: "IPv4 and IPv6",
};

const MESSAGES: Record<string, string> = {
  c_na: "No data",
  c_tz_ok: "Both UTC{a}",
  c_tz_off: "The IP is on UTC{a}, your system is on UTC{b}",
  c_tz_near: "Same country ({ipc}), but the IP is on UTC{a} and your system on UTC{b}",
  c_tz_rfp: "Firefox's resistFingerprinting gives every site Iceland's time: your real zone stays hidden, but it doesn't match the IP's (UTC{a}), so sites can tell you use it",
  c_lang_info: "English says little about where you are",
  c_lang_ok: "Your language matches {ipc}",
  c_lang_warn: "Your language points to {ccName}, the IP is in {ipc}",
  c_dns_ok: "The resolver is in {ipc} too",
  c_dns_bad: "Resolver in {ccName}, IP in {ipc}",
  c_dns_info: "Couldn't place the resolver",
  c_dns_ecs: "Resolver in {ccName}, but it queries on behalf of your own network",
  c_dns_isp: "Resolver in {ccName}, run by the same provider as your IP",
  c_dns_near: "Resolver in {ccName}, IP in {ipc}: ISPs often host resolvers in a nearby country",
  c_split_ok: "Every destination sees the same egress IP",
  c_split_warn: "{aName} and {bName} see different egress IPs",
  c_rtc_off: "WebRTC is off: nothing to leak",
  c_rtc_ok: "Same address as the page sees",
  c_rtc_none: "No public address came back",
  c_rtc_bad: "Leaks another address: {ip}",
  c_rtc_warn: "Another address too: {ip} (may just be IPv6)",
  c_rtc_relay: "Through a relay like iCloud Private Relay too: no real address leaks",
  c_dc_ok: "An ordinary network: {org}",
  c_dc_warn: "{org} is a data center; sites can tell",
  c_dc_relay: "An egress IP of a relay like iCloud Private Relay: sites can tell, but can't see your real IP",
  c_ua_info: "Not enough clues to compare",
  c_ua_ok: "Everything agrees: {a}",
  c_ua_bad: "The user agent says {a}, the rest looks like {b}",
  c_fp_same: "Stable: sites can recognize you",
  c_fp_rand: "Changes every time: hard to track",
  c_fp_site: "Scrambled per site: another site won't know you",
  c_bot_ok: "None",
  c_bot_bad: "navigator.webdriver is on: a script drives this browser",
  c_rtt_ok: "Browser {b} ms, Cloudflare {a} ms: they agree",
  c_rtt_warn: "Browser {b} ms, Cloudflare sees only {a} ms: maybe another hop in between",
  c_rtt_bad: "Browser {b} ms, Cloudflare sees only {a} ms: another hop in between, like a proxy",
  c_sys_na: "This system ships every language's fonts and voices: no telling",
  c_sys_none: "No other language installed, by the look of it",
  c_sys_ok: "Looks like a system from {ccName}, matching the IP",
  c_sys_warn: "{from} look like a system from {ccName}, not the IP's",
  c_h3_ok: "Works: UDP 443 gets through",
  c_h3_wait: "Not used yet; UDP works, the browser may not have switched",
  c_h3_udp: "Not used, and UDP gets out nowhere: blocked, or the proxy doesn't carry UDP",
  c_h3_unk: "Can't tell with WebRTC off",
  c_ech_ok: "On: the site you visit is hidden from your network",
  c_ech_dns: "Off: DNS gave no HTTPS record (often a proxy's fake-ip)",
  c_ech_ff: "Off: Firefox uses ECH only with DNS over HTTPS",
  c_ech_safari: "Off: Safari doesn't support ECH yet",
  c_pq_ok: "On ({kex})",
  c_pq_mitm: "{b} offers it, yet this connection got {kex}: something in between (a company proxy, antivirus HTTPS scanning) may make its own TLS",
  c_pq_old: "Not offered ({kex}); this browser version doesn't do it yet",
  c_warp_on: "Through Cloudflare WARP ({w})",
  c_warp_gw: "Through Cloudflare Gateway",
  c_warp_off: "Not used",
};

const TIPS: Record<string, string> = {
  tz: "Set the system time zone to the IP's.",
  lang: "Put the IP country's language first in the browser if you need to pass as a local.",
  syslang: "The system has another language pack installed, and its fonts and voices show it.",
  dns: "Send DNS through the proxy too (fake-ip or TUN mode), or turn on secure DNS in the browser.",
  split: "To hide it, switch to global mode. If local sites go direct on purpose, leave it.",
  webrtc: "Turn on TUN mode in your proxy client, or limit WebRTC in the browser.",
  rtt: "A proxy always adds this leg. A server closer to you narrows the gap.",
  dc: "Use a home or mobile egress IP. Streaming, AI, and payment sites often block data centers.",
  ua: "Don't change the user agent alone: the graphics card gives it away.",
  fp: "Use Brave, Firefox with resistFingerprinting, or Tor Browser.",
  bot: "Close Selenium, Puppeteer, or other automation, then reload.",
  h3: "Let the proxy carry UDP, allow UDP 443 on the firewall, and check that QUIC isn't turned off.",
  ech: "Turn on secure DNS in the browser, or turn off fake-ip in your proxy.",
  pq: "Update the browser. Turn off HTTPS scanning in your antivirus, or ask whether the company proxy decrypts traffic.",
};

const TOTAL_ROWS = SNIFFER_GROUPS.reduce((sum, [, , rows]) => sum + rows.length, 0);

const bait = ref<HTMLElement | null>(null);
const values = ref<Record<string, string>>({});
const readings = ref<Readings>({});
const tick = ref(0);
const running = ref(false);
const finished = ref(false);
const blurred = ref(false);
let generation = 0;

const totalRows = TOTAL_ROWS;
const filled = computed(() => Object.keys(values.value).length);

const countryLabel = (code?: string | null) =>
  code ? countryName(code) : "unknown";

const groups = computed(() =>
  SNIFFER_GROUPS.map(([id, title, rows]) => ({
    id,
    title,
    rows: rows.map(([rowId, label, method, sensitive]) => ({
      id: rowId,
      label,
      method,
      sensitive: Boolean(sensitive),
      value: values.value[rowId] ?? (running.value ? "..." : "N/A"),
    })),
  })),
);

const rawOutput = computed(() => {
  void tick.value;

  const server = readings.value.server;
  return server ? JSON.stringify(server, null, 2) : "";
});

const allExits = (R: Readings) => {
  if (!R.exits || !R.stack || !R.server) return null;

  return [
    ["ip", R.server.ip],
    ...Object.entries(R.exits),
    ...R.stack.map((ip) => ["stack", ip]),
  ].filter(([, ip]) => ip);
};

const checkResults = computed<Record<string, CheckResult>>(() => {
  void tick.value;

  const R = readings.value;
  const cf = R.server?.cf ?? {};
  const resist = R.tz ? isResistFingerprinting(R) : false;
  const results = checks({
    tz: R.tz,
    rfp: resist,
    tzOff: R.tzOff == null ? null : offTxt(R.tzOff),
    ipTzOff: cf.timezone ? offTxt(tzOffset(cf.timezone) ?? 0) : null,
    ipTz: cf.timezone ?? null,
    ipcc: cf.country,
    langs: R.langs,
    dnsCC: R.dnsCC,
    exits: allExits(R),
    rtc: R.rtc,
    ip: R.server?.ip,
    asn: cf.asn,
    org: cf.asOrganization,
    uaOS: R.dev?.os,
    real: Boolean(R.dev),
    hintOS: R.hints?.platform,
    gpuOS: readGpuOs(R),
    rand: R.rand,
    noise: R.noise,
    webdriver: R.webdriver,
    rttB: R.rttBrowser ?? null,
    rttCf: cf.clientTcpRtt ?? null,
    sys: systemLanguages(R),
  });
  const trace = R.trace ?? {};

  return {
    ...results,
    dns: refineDnsCheck(results.dns, R),
    ...protocols({
      http: R.http ? [cf.httpProtocol, ...R.http].filter(Boolean) : null,
      rtc: R.rtc,
      br: R.browserInfo,
      sni: trace.sni,
      kex: trace.kex,
      warp: trace.warp,
      gateway: trace.gateway,
    }),
  };
});

const score = computed(() => grade(checkResults.value, CHECK_IDS));

const flagged = computed(() =>
  CHECK_IDS.filter((id) => {
    const level = checkResults.value[id]?.[0];
    return level === "warn" || level === "bad";
  }),
);

const messageOf = (result: CheckResult) => {
  if (!result) return running.value ? "Checking..." : "No data";

  const [, key, vars] = result;
  const ipCountry = countryLabel(readings.value.server?.cf?.country);
  const filledVars: Record<string, string | number | null> = {
    ...vars,
    ipc: ipCountry,
    ccName: vars.cc ? countryLabel(String(vars.cc)) : "",
    aName: EXIT_NAMES[String(vars.a)] ?? vars.a,
    bName: EXIT_NAMES[String(vars.b)] ?? vars.b,
  };

  return (MESSAGES[key] ?? key).replace(/\{(\w+)\}/g, (match, name: string) =>
    filledVars[name] === null || filledVars[name] === undefined
      ? match
      : String(filledVars[name]),
  );
};

const LEVEL_TONES: Record<string, Tone> = {
  ok: "ok",
  warn: "warn",
  bad: "bad",
  info: "",
};

const checkRows = computed(() =>
  [...CHECK_IDS, ...PROTOCOL_IDS].map((id) => {
    const result = checkResults.value[id];
    const level = result?.[0] ?? "";

    return {
      id,
      label: CHECK_LABELS[id],
      text: messageOf(result),
      tone: LEVEL_TONES[level] ?? "muted",
      tip: level === "warn" || level === "bad" ? TIPS[id] ?? "" : "",
    };
  }),
);

const portrait = computed(() => {
  void tick.value;

  const R = readings.value;
  const cf = R.server?.cf ?? {};
  const waiting = running.value ? "Checking..." : "N/A";
  const likely = R.langs
    ? nationality({
        langs: R.langs,
        tz: isResistFingerprinting(R) ? null : R.tz,
        ipcc: cf.country,
        sys: systemLanguages(R) || undefined,
        ios: /^(iOS|iPadOS)/.test(R.dev?.os ?? ""),
      })
    : null;
  const place = [cf.city, cf.country && countryName(cf.country)].filter(Boolean).join(", ");
  const network = cf.asn
    ? `${cf.asOrganization ?? `AS${cf.asn}`} (${isDataCenter(cf.asn, cf.asOrganization) ? "data center" : "home or mobile"})`
    : "";
  const deviceText = [
    [R.dev?.os, R.dev?.osv].filter(Boolean).join(" "),
    R.arch?.name,
    R.dev?.model,
  ].filter(Boolean).join(" · ");
  const browserText = [R.browserInfo?.name, R.browserInfo?.v].filter(Boolean).join(" ");

  return [
    { label: "Probably From", value: likely ? countryLabel(likely.cc) : waiting, sensitive: Boolean(likely) },
    { label: "Right Now In", value: place || waiting, sensitive: Boolean(place) },
    { label: "Device", value: deviceText || waiting },
    { label: "Browser", value: browserText || waiting },
    { label: "Graphics", value: bestGpuName(R) || waiting },
    { label: "Network", value: network || waiting, sensitive: Boolean(network) },
    { label: "DNS Resolver", value: R.dnsCC ? countryLabel(R.dnsCC) : waiting, sensitive: Boolean(R.dnsCC) },
    { label: "Fingerprint ID", value: R.fingerprint ?? waiting },
  ];
});

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (!finished.value) return "idle" as const;
  if (score.value.score >= 90) return "ok" as const;
  if (score.value.score >= 60) return "warn" as const;
  return "bad" as const;
});

const title = computed(() => {
  if (running.value) return "Sniffing...";
  if (!finished.value) return "Who Do Sites Think You Are?";
  if (!flagged.value.length) return `Grade ${score.value.grade}: No Contradictions Found`;
  return `Grade ${score.value.grade}: ${flagged.value.length} Things Could Give You Away`;
});

const summary = computed(() => {
  if (running.value) return "Your browser is running the same checks any website can run.";
  if (!finished.value) {
    return "See what any website learns about you without asking, and whether a VPN or proxy shows. This page stores nothing.";
  }
  if (!flagged.value.length) {
    return `Scored ${score.value.score} / 100. Everything agrees: if you aren't hiding, this is the real you as sites see it; if you are, the disguise holds.`;
  }
  return `Scored ${score.value.score} / 100. When you want to hide, the amber and red rows are what a site would notice. Red costs more than amber.`;
});

const start = async () => {
  const current = ++generation;
  const nextReadings: Readings = {};

  running.value = true;
  finished.value = false;
  values.value = {};
  readings.value = nextReadings;

  await collectReadings(
    nextReadings,
    bait.value,
    (id, value) => {
      if (current === generation) values.value[id] = value;
    },
    () => {
      if (current === generation) tick.value += 1;
    },
  );

  if (current !== generation) return;
  tick.value += 1;
  running.value = false;
  finished.value = true;
};

const MIN_STAT_FONT_PX = 9;
const statsGrid = ref<HTMLElement | null>(null);
const statValues = ref<HTMLElement[]>([]);
let statsObserver: ResizeObserver | null = null;
let statsWidth = 0;

// Shrink each overview value until it fits on one line, so cards keep a fixed height.
const fitStats = () => {
  for (const el of statValues.value) {
    const text = el.firstElementChild as HTMLElement | null;
    el.style.fontSize = "";
    if (!text) continue;

    const available = text.clientWidth;
    const needed = text.scrollWidth;
    if (!available || needed <= available) continue;

    const base = parseFloat(getComputedStyle(el).fontSize);
    const size = Math.floor((base * available / needed) * 10) / 10;
    el.style.fontSize = `${Math.max(size, MIN_STAT_FONT_PX)}px`;
  }
};

watch([portrait, blurred], () => {
  void nextTick(fitStats);
}, { flush: "post" });

watch(statsGrid, (el, old) => {
  if (old) statsObserver?.unobserve(old);
  if (el) statsObserver?.observe(el);
});

onMounted(() => {
  if (typeof ResizeObserver !== "undefined") {
    statsObserver = new ResizeObserver(([entry]) => {
      const width = entry?.contentRect.width ?? 0;
      if (width === statsWidth) return;
      statsWidth = width;
      fitStats();
    });
    if (statsGrid.value) statsObserver.observe(statsGrid.value);
  }
  void start();
});

onBeforeUnmount(() => {
  generation += 1;
  statsObserver?.disconnect();
  statsObserver = null;
});
</script>

<style scoped>
.who-are-you-bait {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  pointer-events: none;
}

.network-tool-stat .who-are-you-stat-value {
  display: block;
  min-width: 0;
}

/* The shell styles every span in a stat card as its label; keep values out of that,
   and let the ellipsis sit inside VPPlot so it blurs with the text. */
.network-tool-stat .who-are-you-stat-text {
  display: block;
  overflow: hidden;
  padding: 0;
  color: inherit;
  font: inherit;
  overflow-wrap: normal;
  text-overflow: ellipsis;
  text-transform: none;
  white-space: nowrap;
}

@media (max-width: 719px) {
  .network-tool-stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .network-tool-stat {
    padding: 8px;
  }

  .network-tool-stat > span {
    font-size: 0.62rem;
  }
}

.who-are-you-raw :deep(pre),
.who-are-you-raw :deep(code) {
  width: auto !important;
  min-width: 0 !important;
  overflow-wrap: anywhere;
  white-space: pre-wrap !important;
}

.who-are-you-tip {
  margin-top: 4px;
  font-weight: 400;
}
</style>
