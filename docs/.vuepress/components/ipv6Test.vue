<template>
  <NetworkToolShell
    eyebrow="IPv6 Test"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress-range="[6000, 10000]"
    :button-text="finished ? 'Test again' : 'Start'"
    stoppable
    @run="toggle"
  >
    <div class="network-tool-grid">
      <article class="network-tool-card">
        <header class="network-tool-card-header">
          <VPIcon name="mdi:numeric-6-box-outline" size="22" aria-hidden="true" />
          <h3>IPv6 Address</h3>
        </header>
        <p class="network-tool-value network-tool-mono" :class="addressClass(results.v6)">{{ addressText(results.v6, "No IPv6 address") }}</p>
        <p class="network-tool-detail">{{ addressDetail(results.v6) }}</p>
      </article>
      <article class="network-tool-card">
        <header class="network-tool-card-header">
          <VPIcon name="mdi:numeric-4-box-outline" size="22" aria-hidden="true" />
          <h3>IPv4 Address</h3>
        </header>
        <p class="network-tool-value network-tool-mono" :class="addressClass(results.v4)">{{ addressText(results.v4, "No IPv4 address") }}</p>
        <p class="network-tool-detail">{{ addressDetail(results.v4) }}</p>
      </article>
    </div>

    <div class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>Test</th>
            <th>Result</th>
            <th>First Answer</th>
            <th>Round Trip</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in testRows" :key="row.id">
            <td>
              <strong>{{ row.label }}</strong>
              <div class="network-tool-detail">{{ row.detail }}</div>
            </td>
            <td :class="row.tone && `tool-tone-${row.tone}`">{{ row.result }}</td>
            <td>{{ row.first }}</td>
            <td>{{ row.rtt }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <article class="network-tool-card">
      <header class="network-tool-card-header">
        <VPIcon name="mdi:compare-horizontal" size="22" aria-hidden="true" />
        <h3>IPv4 vs IPv6</h3>
      </header>
      <p class="network-tool-value">{{ comparison.title }}</p>
      <p class="network-tool-detail">{{ comparison.detail }}</p>
    </article>

    <div class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>Network</th>
            <th>IPv4</th>
            <th>IPv6</th>
            <th>IPv6 − IPv4</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in pairRows" :key="row.id">
            <td>
              <strong>{{ row.name }}</strong>
              <div class="network-tool-detail">{{ row.where }}</div>
            </td>
            <td>{{ row.v4 }}</td>
            <td>{{ row.v6 }}</td>
            <td>{{ row.diff }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul class="network-tool-notes">
      <li>The score is out of 10: 4 for IPv6-only sites, 2 for large packets, 2 for dual-stack sites that open without waiting, 1 for IPv6 without DNS, and 1 when the browser picks IPv6. One point comes off when IPv6 takes over 3 seconds to answer.</li>
      <li>With a proxy or VPN on, the result mostly describes the proxy. Turn it off to test your own network.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type Tone,
  countryName,
  fetchMe,
  formatMs,
} from "../theme/utils/networkTools/shared";
import {
  PAIRS,
  SIDES,
  SLOW,
  TESTS,
  compare,
  kind6,
  network,
  runTest,
  sameIp,
  verdict,
} from "../theme/utils/networkTools/vendor/ipv6-test/probe.mjs";

interface TestResult {
  ok: boolean;
  ms?: number;
  rtt?: number;
  host?: string;
  ip?: string;
  fam?: number;
  asn?: number;
  cc?: string;
  err?: string;
}

const TEST_TEXT: Record<string, [string, string]> = {
  v4: ["IPv4-only site", "A site that has only an IPv4 address"],
  v6: ["IPv6-only site", "A site that has only an IPv6 address: needs IPv6, and DNS that returns it"],
  ds: ["Dual-stack site", "A site with both: which one your browser picks"],
  big: ["Large packets over IPv6", "Full-size packets both ways; a broken MTU makes pages hang"],
  lit6: ["IPv6 address, no DNS", "Connects to an IPv6 address directly"],
  lit4: ["IPv4 address, no DNS", "Connects to an IPv4 address directly"],
};

const HEADLINES: Record<string, string> = {
  v_ready: "Your network is IPv6 ready",
  v_partly: "IPv6 works, with problems",
  v_nodns: "IPv6 works, but your DNS hides it",
  v_none: "No IPv6, IPv4 only",
  v_only6: "IPv6 only, no IPv4",
  v_nat64: "IPv6-only network with NAT64",
  v_offline: "None of the test sites answered",
};

const PROBLEMS: Record<string, string> = {
  p_nodns: "Your DNS doesn't return IPv6 addresses (the router may filter AAAA records).",
  p_mtu: "Large packets get lost over IPv6 (MTU): some sites hang.",
  p_slowds: "Sites with both IPv4 and IPv6 open slowly: your browser waits for IPv6 first.",
  p_prefer4: "Your browser picks IPv4 on sites that have both.",
  p_slow6: "IPv6 answers slowly.",
  p_tunnel: "Your IPv6 comes through an old tunnel, not from your provider.",
  p_lit6: "IPv6 addresses can't be reached directly.",
  p_v4dns: "IPv4-only sites don't open by name: check your DNS.",
};

const COMPARISONS: Record<string, [string, string]> = {
  c_same: ["IPv6 is as fast as IPv4", "Either is fine: using IPv6 costs you nothing here."],
  c_6fast: ["IPv6 is faster than IPv4, by {ms}", "IPv6 takes the better path here, and browsers use it first."],
  c_6slow: ["IPv6 is a little slower than IPv4, by {ms}", "Hardly noticeable: a few milliseconds per request."],
  c_6much: ["IPv6 is much slower than IPv4, by {ms}", "Your IPv6 takes a longer or busier path than IPv4, so sites over IPv6 load slower."],
  c_no6: ["No IPv6 to compare: only IPv4 answered", "Turn on IPv6 in your router to compare."],
  c_none: ["No network answered over both", "Check your connection, or a firewall or extension that blocks these hosts."],
};

const WHERE: Record<string, string> = {
  global: "Worldwide",
  nocn: "Worldwide, not mainland China",
  cn: "Mainland China",
};

const KIND_TEXT: Record<string, string> = {
  native: "Native",
  "6to4": "6to4 tunnel",
  teredo: "Teredo tunnel",
};

const results = ref<Record<string, TestResult>>({});
const sides = ref<Record<string, TestResult>>({});
const running = ref(false);
const finished = ref(false);
let controller: AbortController | null = null;

const report = computed(() => verdict(results.value));

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (!finished.value) return "idle" as const;
  if (report.value.head === "v_ready") return "ok" as const;
  if (report.value.head === "v_none" || report.value.head === "v_offline") {
    return "bad" as const;
  }
  return "warn" as const;
});

const title = computed(() => {
  if (running.value) return "Testing...";
  if (!finished.value) return "Does Your Network Support IPv6?";
  return `${report.value.score} / 10: ${HEADLINES[report.value.head]}`;
});

const summary = computed(() => {
  if (running.value) return "Your browser is contacting test hosts over IPv4 and IPv6.";
  if (!finished.value) {
    return "Checks IPv6-only and dual-stack sites, large packets, DNS, and NAT64.";
  }
  if (report.value.head === "v_ready") {
    return "Every test passed: IPv6-only sites open, and IPv6 slows nothing down.";
  }
  if (report.value.head === "v_none") {
    return "Sites work over IPv4. To get IPv6, turn it on in your router (WAN or IPv6 settings) or ask your provider.";
  }
  if (report.value.head === "v_offline") {
    return "Check your connection, or a firewall or extension that blocks these sites, then test again.";
  }
  return report.value.probs.map((key: string) => PROBLEMS[key]).join("\n");
});

const addressText = (result: TestResult | undefined, empty: string) => {
  if (!result) return running.value ? "Checking..." : "N/A";
  return result.ok && result.ip ? result.ip : empty;
};

const addressClass = (result: TestResult | undefined) =>
  result && !result.ok ? "tool-tone-bad" : "";

const addressDetail = (result: TestResult | undefined) => {
  if (!result?.ok) return "";

  const parts = [
    result.ip && KIND_TEXT[kind6(result.ip)],
    result.asn ? `AS${result.asn}` : "",
    result.cc ? countryName(result.cc) : "",
  ];
  return parts.filter(Boolean).join(" · ");
};

const resultCell = (id: string, result?: TestResult): [string, Tone] => {
  if (!result) return [running.value ? "Testing..." : "Not run", "muted"];
  if (!result.ok) return [result.err === "timeout" ? "Timed out" : "Failed", "bad"];
  if (result.ms !== undefined && result.ms > SLOW) return ["Slow", "warn"];
  if (id === "ds") return [`Browser picked IPv${result.fam}`, "ok"];
  return ["OK", "ok"];
};

const testRows = computed(() =>
  (TESTS as { id: string }[]).map(({ id }) => {
    const result = results.value[id];
    const [value, tone] = resultCell(id, result);

    return {
      id,
      label: TEST_TEXT[id][0],
      detail: result?.host
        ? `${TEST_TEXT[id][1]}. Answered by ${result.host}.`
        : TEST_TEXT[id][1],
      result: value,
      tone,
      first: formatMs(result?.ms),
      rtt: formatMs(result?.rtt),
    };
  }),
);

const sideText = (side?: TestResult) => {
  if (!side) return running.value ? "..." : "N/A";
  return side.ok ? formatMs(side.rtt ?? side.ms) : "Failed";
};

const pairRows = computed(() =>
  (PAIRS as { id: string; name: string; where: string }[]).map((pair) => {
    const v4 = sides.value[`${pair.id}4`];
    const v6 = sides.value[`${pair.id}6`];
    const difference =
      v4?.rtt !== undefined && v6?.rtt !== undefined ? v6.rtt - v4.rtt : null;

    return {
      id: pair.id,
      name: pair.name,
      where: WHERE[pair.where],
      v4: sideText(v4),
      v6: sideText(v6),
      diff:
        difference === null
          ? "N/A"
          : `${difference > 0 ? "+" : "−"}${formatMs(Math.abs(difference))}`,
    };
  }),
);

const comparison = computed(() => {
  if (!finished.value) {
    return {
      title: running.value ? "Comparing..." : "Not run",
      detail: "The same networks over each protocol, at the same time. Round trip: lower is faster.",
    };
  }

  const result = compare(sides.value);
  const [heading, detail] = COMPARISONS[result.key];
  return {
    title: heading.replace("{ms}", formatMs(Math.abs(result.diff ?? 0))),
    detail,
  };
});

const start = async () => {
  const active = new AbortController();
  const { signal } = active;
  const mePromise = fetchMe(signal);

  controller = active;
  running.value = true;
  finished.value = false;
  results.value = {};
  sides.value = {};

  const sideRuns = (SIDES as { id: string }[]).map(async (side) => {
    const result = await runTest(side, { signal });
    if (signal.aborted) return;
    sides.value[side.id] = result;
  });

  const testRuns = (TESTS as { id: string; fam: number }[]).map(async (test) => {
    const result: TestResult = await runTest(test, { signal });
    if (signal.aborted) return;

    if ((test.id === "v4" || test.id === "v6") && result.ok && !result.asn) {
      const me = await mePromise;
      const info =
        me?.asn && sameIp(me.ip, result.ip)
          ? { asn: me.asn, cc: me.country ?? "" }
          : await network(test.fam, result.ip, signal);
      if (signal.aborted) return;
      if (info) {
        result.asn = info.asn;
        result.cc = result.cc || info.cc;
      }
    }

    results.value[test.id] = result;
  });

  await Promise.all([...sideRuns, ...testRuns]);

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

onMounted(() => {
  void start();
});

onBeforeUnmount(() => {
  controller?.abort();
});
</script>
