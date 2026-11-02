<template>
  <NetworkToolShell
    eyebrow="DNS Test"
    :title="title"
    :summary="summary"
    :kind="kind"
    :progress="progress"
    :button-text="finished ? 'Test again' : 'Start'"
    stoppable
    @run="toggle"
  >
    <div class="network-tool-table-wrap">
      <table class="network-tool-table">
        <thead>
          <tr>
            <th>#</th>
            <th>DNS</th>
            <th>DoH</th>
            <th>UDP ≈</th>
            <th>DoT ≈</th>
            <th>Uncached</th>
            <th>Loss</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.id">
            <td>{{ row.rank }}</td>
            <td>
              <details class="dns-test-resolver">
                <summary>
                  <strong>{{ row.name }}</strong>
                  <span v-if="row.badge" class="network-tool-count">{{ row.badge }}</span>
                </summary>
                <dl class="dns-test-usage">
                  <template v-for="item in row.usage" :key="item.label">
                    <dt>{{ item.label }}</dt>
                    <dd><code>{{ item.value }}</code></dd>
                  </template>
                </dl>
              </details>
            </td>
            <td :class="`tool-tone-${row.doh.tone}`">{{ row.doh.text }}</td>
            <td :class="`tool-tone-${row.udp.tone}`">{{ row.udp.text }}</td>
            <td :class="`tool-tone-${row.dot.tone}`">{{ row.dot.text }}</td>
            <td :class="row.rewrites && 'tool-tone-warn'">{{ row.uncached }}</td>
            <td>{{ row.loss }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <ul class="network-tool-notes">
      <li>Browsers can only send DNS over HTTPS. UDP and DoT values are estimates from a warm DoH query to the same server.</li>
      <li>Ranking uses the median cached DoH time, and each percent of lost queries makes it 3% worse. Uncached times are shown but not ranked.</li>
      <li>"Rewrites" means the resolver answered a name that does not exist with an address.</li>
      <li>A proxy or VPN changes the route to every resolver. Select a resolver's name to see the addresses it uses.</li>
    </ul>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, shallowRef } from "vue";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type Tone,
  formatMs,
  msTone,
} from "../theme/utils/networkTools/shared";
import {
  ROUNDS,
  loss,
  median,
  run,
  score,
  targets,
} from "../theme/utils/networkTools/vendor/dns-test/measure.mjs";
import {
  NAMES,
  NXZONE,
  RESOLVERS,
} from "../theme/utils/networkTools/vendor/dns-test/resolvers.mjs";

interface Resolver {
  id: string;
  name: string;
  doh: string;
  udp?: string[];
  udp6?: string[];
  dot?: string;
  est: { udp: string | null; dot: string | null };
  dnssec?: boolean;
  blocks?: string;
}

interface Target {
  r: Resolver;
  kind: "doh" | "ip";
  up: boolean | null;
  err: string;
  warm: number[];
  cached: number[];
  uncached: number[];
  sent: number;
  lost: number;
  rewrites: boolean;
}

interface Cell {
  text: string;
  tone: Tone;
}

const BLOCKS: Record<string, string> = {
  ads: "ads and trackers",
  malware: "malware and phishing domains",
  phishing: "phishing domains",
};

const list = shallowRef<Target[]>([]);
const tick = ref(0);
const steps = ref(0);
const running = ref(false);
const finished = ref(false);
let controller: AbortController | null = null;

const targetOf = (id: string, targetKind: "doh" | "ip") =>
  list.value.find((target) => target.r.id === id && target.kind === targetKind);

const cellOf = (target?: Target): Cell => {
  if (!target || target.up === null) {
    return { text: running.value ? "..." : "N/A", tone: "muted" };
  }
  if (!target.up) {
    return { text: target.err === "timeout" ? "Timed out" : "Failed", tone: "bad" };
  }

  const ms = target.cached.length ? median(target.cached) : median(target.warm);
  return { text: formatMs(ms), tone: msTone(ms) };
};

const estimateOf = (resolver: Resolver, protocol: "udp" | "dot"): Cell => {
  const source = resolver.est[protocol];
  if (!source) return { text: "N/A", tone: "muted" };
  return cellOf(targetOf(resolver.id, source as "doh" | "ip"));
};

const usageOf = (resolver: Resolver) =>
  [
    { label: "DNS servers", value: resolver.udp?.join(", ") },
    { label: "IPv6 DNS servers", value: resolver.udp6?.join(", ") },
    { label: "Private DNS (DoT)", value: resolver.dot },
    { label: "DNS over HTTPS", value: resolver.doh },
  ].filter((item) => item.value);

const badgeOf = (resolver: Resolver) =>
  [
    resolver.dnssec ? "DNSSEC" : "",
    resolver.blocks ? `Blocks ${BLOCKS[resolver.blocks] ?? resolver.blocks}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

const ranked = computed(() => {
  void tick.value;

  return (RESOLVERS as Resolver[])
    .map((resolver) => {
      const target = targetOf(resolver.id, "doh");
      return { resolver, target, value: target ? score(target) : null };
    })
    .sort((first, second) => {
      if (first.value === null && second.value === null) return 0;
      if (first.value === null) return 1;
      if (second.value === null) return -1;
      return first.value - second.value;
    });
});

const rows = computed(() =>
  ranked.value.map(({ resolver, target, value }, index) => {
    const uncached = target?.up ? median(target.uncached) : null;

    return {
      id: resolver.id,
      name: resolver.name,
      rank: value === null ? "" : index + 1,
      badge: badgeOf(resolver),
      usage: usageOf(resolver),
      doh: cellOf(target),
      udp: estimateOf(resolver, "udp"),
      dot: estimateOf(resolver, "dot"),
      rewrites: Boolean(target?.rewrites),
      uncached: target?.rewrites ? "Rewrites" : formatMs(uncached),
      loss: target?.sent ? `${Math.round(loss(target) * 100)}%` : "N/A",
    };
  }),
);

const leader = computed(() =>
  ranked.value[0]?.value === null ? null : ranked.value[0],
);

const totalSteps = computed(() => list.value.length * (ROUNDS + 1));
const progress = computed(() =>
  totalSteps.value ? steps.value / totalSteps.value : 0,
);

const kind = computed(() => {
  if (running.value) return "running" as const;
  if (!finished.value) return "idle" as const;
  return leader.value ? ("ok" as const) : ("bad" as const);
});

const title = computed(() => {
  if (running.value && leader.value) {
    return `In the lead: ${leader.value.resolver.name}`;
  }
  if (running.value) return "Testing...";
  if (!finished.value) return "Which DNS Is Fastest for You?";
  return leader.value
    ? `Fastest: ${leader.value.resolver.name}`
    : "No Resolver Answered";
});

const summary = computed(() => {
  if (finished.value && leader.value) {
    const { target } = leader.value;
    return `${formatMs(median(target?.cached ?? []))} median over DNS over HTTPS, with ${Math.round(loss(target) * 100)}% of queries lost.`;
  }
  if (finished.value) {
    return "Check your connection, or a firewall or extension that blocks these resolvers.";
  }
  if (running.value) {
    return "Each resolver gets the same names in random order, a few at a time.";
  }
  return `Times ${RESOLVERS.length} public resolvers from your browser. Nothing runs until you press Start.`;
});

const start = async () => {
  const active = new AbortController();
  const nextTargets = targets(RESOLVERS) as Target[];

  controller = active;
  list.value = nextTargets;
  steps.value = 0;
  running.value = true;
  finished.value = false;

  await run(nextTargets, {
    names: NAMES,
    nxzone: NXZONE,
    signal: active.signal,
    onStep: () => {
      if (controller !== active) return;
      steps.value += 1;
      tick.value += 1;
    },
  });

  if (controller === active) {
    controller = null;
    running.value = false;
    finished.value = !active.signal.aborted;
    tick.value += 1;
  }
};

const toggle = () => {
  if (controller) {
    controller.abort();
    controller = null;
    running.value = false;
    tick.value += 1;
    return;
  }
  void start();
};

onBeforeUnmount(() => {
  controller?.abort();
  controller = null;
});
</script>

<style scoped>
.dns-test-resolver summary {
  display: grid;
  gap: 2px;
  cursor: pointer;
  list-style: none;
}

.dns-test-resolver summary::-webkit-details-marker {
  display: none;
}

.dns-test-usage {
  display: grid;
  gap: 4px;
  margin: 8px 0 0;
  font-size: 0.82rem;
}

.dns-test-usage dt {
  color: var(--tool-muted);
  font-weight: 700;
}

.dns-test-usage dd {
  margin: 0;
}
</style>
