<template>
  <NetworkToolShell
    eyebrow="Mainland China User Check"
    :title="displayVerdict.title"
    :summary="displayVerdict.summary"
    :kind="shellKind"
    :progress-range="PROGRESS_RANGE"
    button-text="Refresh"
    :error="error"
    @run="refresh"
  >
    <div v-if="$slots.note" class="region-detect-note">
      <slot name="note" />
    </div>

    <div class="network-tool-grid">
      <article class="network-tool-card is-wide">
        <header class="network-tool-card-header">
          <VPIcon
            :color="visibleStatusIconColor(ipSignal?.result ?? null)"
            name="mdi:map-marker-outline"
            size="22"
            aria-hidden="true"
          />
          <h3>IP Geolocation</h3>
        </header>
        <p class="network-tool-value">{{ visibleValue(ipSignal?.value) }}</p>
        <p v-if="isCheckingResult" class="network-tool-detail">
          Collecting detection signals...
        </p>
        <p v-else-if="hasIpLinkDetail" class="network-tool-detail">
          According to our data, you are visiting our site from
          <a
            :href="ipLookupUrl"
            class="no-icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ ipSignal?.ipAddress }}
          </a>
          with
          <a
            :href="asnLookupUrl"
            class="no-icon"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ ipSignal?.asn }}
          </a>,
          located in {{ ipSignal?.country }}.
        </p>
        <p v-else class="network-tool-detail">
          {{ ipSignal?.detail }}
        </p>
      </article>

      <article v-for="signal in browserSignals" :key="signal.id" class="network-tool-card">
        <header class="network-tool-card-header">
          <VPIcon
            :color="visibleStatusIconColor(signal.result)"
            :name="signalIcon(signal.id)"
            size="22"
            aria-hidden="true"
          />
          <h3>{{ signal.label }}</h3>
        </header>
        <p class="network-tool-value">{{ visibleValue(signal.value) }}</p>
        <p class="network-tool-detail">{{ signal.detail }}</p>
      </article>
    </div>

    <Transition name="result-reveal">
      <div v-if="!isCheckingResult" class="region-detect-details">
        <div class="network-tool-table-wrap">
          <table class="network-tool-table">
            <thead>
              <tr>
                <th>Signal</th>
                <th>Result</th>
                <th>Observed Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>IP Country</td>
                <td :class="resultClass(ipSignal?.result ?? null)">
                  {{ formatResult(ipSignal?.result ?? null) }}
                </td>
                <td>{{ ipSignal?.country ?? "N/A" }}</td>
              </tr>
              <tr>
                <td>Non-IP Mainland Signals</td>
                <td :class="mainlandSignalRuleResultClass">
                  {{ mainlandSignalRuleResult }}
                </td>
                <td>{{ mainlandSignalRuleText }}</td>
              </tr>
              <tr v-for="signal in browserSignals" :key="`row-${signal.id}`">
                <td>{{ signal.label }}</td>
                <td :class="resultClass(signal.result)">
                  {{ formatResult(signal.result) }}
                </td>
                <td>{{ signal.value }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <ul class="network-tool-notes">
          <li>
            {{ proxyFootnote }}
          </li>
          <li v-html="ipFootnote" />
          <li>
            Using a proxy, such as a VPN, or iCloud private relay, may change the country or region that is displayed on this page.
          </li>
          <li>
            {{ fontFootnote }}
          </li>
        </ul>
      </div>
    </Transition>
  </NetworkToolShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";
import NetworkToolShell from "./networkToolShell.vue";
import {
  type BrowserSignal,
  type InternalMainlandRuleSignal,
  type IpSignal,
  type MainlandVerdict,
  countMainlandBrowserSignals,
  detectBrowserSignals,
  detectInternalMainlandRule,
  fetchIpSignal,
  resolveMainlandVerdict,
} from "../theme/utils/chinaMainlandUserDetection";

const loading = ref(true);
const error = ref<string | null>(null);
const ipSignal = ref<IpSignal | null>(null);
const browserSignals = ref<BrowserSignal[]>([]);
const internalRuleSignal = ref<InternalMainlandRuleSignal | null>(null);
const internalRuleChecking = ref(true);

const CHECKING_TEXT = "Checking...";
const PROGRESS_RANGE: [number, number] = [1500, 2500];

const randomBetween = (min: number, max: number) =>
  min + Math.random() * (max - min);

const wait = (duration: number) =>
  new Promise((resolve) => {
    window.setTimeout(resolve, duration);
  });

const refresh = async () => {
  loading.value = true;
  error.value = null;
  ipSignal.value = null;
  const progressPromise = wait(Math.round(randomBetween(...PROGRESS_RANGE)));
  browserSignals.value = detectBrowserSignals();
  internalRuleSignal.value = null;
  internalRuleChecking.value = true;
  let nextInternalRuleSignal: InternalMainlandRuleSignal | null = null;
  const internalRulePromise = detectInternalMainlandRule().finally(() => {
    internalRuleChecking.value = false;
  });

  try {
    const [ipResult, internalRuleResult] = await Promise.allSettled([
      fetchIpSignal(),
      internalRulePromise,
    ]);

    nextInternalRuleSignal =
      internalRuleResult.status === "fulfilled"
        ? internalRuleResult.value
        : {
            id: "internal-rule-check-result",
            result: null,
            bypassed: false,
            detail: "Internal connectivity rule failed to run.",
          };

    if (ipResult.status === "fulfilled") {
      await progressPromise;
      internalRuleSignal.value = nextInternalRuleSignal;
      ipSignal.value = ipResult.value;
    } else {
      throw ipResult.reason;
    }
  } catch (err) {
    await progressPromise;
    error.value = err instanceof Error ? err.message : "Unknown error";
    ipSignal.value = {
      result: null,
      value: "N/A",
      detail: "Could not fetch IP geolocation from ip.lucas04.top.",
      data: null,
    };
    internalRuleSignal.value = nextInternalRuleSignal ?? {
      id: "internal-rule-check-result",
      result: null,
      bypassed: false,
      detail: "Internal connectivity rule failed to run.",
    };
  } finally {
    loading.value = false;
  }
};

const verdict = computed(() =>
  resolveMainlandVerdict(
    ipSignal.value,
    browserSignals.value,
    internalRuleSignal.value,
  ),
);

type DisplayVerdict = MainlandVerdict | {
  kind: "checking-internal-rule";
  title: string;
  summary: string;
};

const displayVerdict = computed<DisplayVerdict>(() => {
  if (loading.value || (internalRuleChecking.value && !internalRuleSignal.value)) {
    return {
      kind: "checking-internal-rule",
      title: "Checking Results...",
      summary: `Checking detection signals.\nThe final result will update shortly.`,
    };
  }

  return verdict.value;
});

const isCheckingResult = computed(
  () => displayVerdict.value.kind === "checking-internal-rule",
);

const shellKinds = {
  "suspected-mainland": "warn",
  "non-mainland": "ok",
  mainland: "bad",
  "checking-internal-rule": "running",
} as const satisfies Record<DisplayVerdict["kind"], string>;

const shellKind = computed(() => shellKinds[displayVerdict.value.kind]);

const hasIpLinkDetail = computed(
  () =>
    Boolean(
      ipSignal.value?.ipAddress && ipSignal.value?.asn && ipSignal.value?.country,
    ),
);

const formatIpLookupPathSegment = (ipAddress: string) =>
  /^[0-9a-fA-F:.]+$/.test(ipAddress)
    ? ipAddress
    : encodeURIComponent(ipAddress);

const ipLookupUrl = computed(() =>
  ipSignal.value?.ipAddress
    ? `https://www.whatismyip.com/ip/${formatIpLookupPathSegment(ipSignal.value.ipAddress)}/`
    : "",
);

const asnLookupUrl = computed(() =>
  ipSignal.value?.asn
    ? `https://www.whatismyip.com/asn/${encodeURIComponent(ipSignal.value.asn)}/`
    : "",
);

const ipFootnote = computed(() => {
  const externalLink =
    '<a href="https://ip.skk.moe" class="no-icon" target="_blank" rel="noopener noreferrer">an external website</a>';

  if (hasIpLinkDetail.value) {
    return `See <a href="/tools/who-are-you/">Who Are You</a> or go to ${externalLink} for more details about your IP and network connection information.`;
  }

  return `Go to ${externalLink} for more details about your IP and network connection information.`;
});

const mainlandSignalScore = computed(
  () => countMainlandBrowserSignals(browserSignals.value),
);

const browserSignalTotal = computed(() => browserSignals.value.length || 4);

const mainlandSignalRuleResult = computed(() => {
  if (mainlandSignalScore.value === browserSignalTotal.value) {
    return "Mainland-like";
  }

  if (mainlandSignalScore.value >= 2) {
    return "Suspected mainland-like";
  }

  return "Non-mainland";
});

const mainlandSignalRuleResultClass = computed(() => {
  if (mainlandSignalScore.value === browserSignalTotal.value) {
    return "tool-tone-bad";
  }

  if (mainlandSignalScore.value >= 2) {
    return "tool-tone-warn";
  }

  return "tool-tone-ok";
});

const mainlandSignalRuleText = computed(() => {
  const score = mainlandSignalScore.value;
  const subject = score === 1 ? "signal" : "signals";
  const verb = score === 1 ? "is" : "are";

  return `${score} in ${browserSignalTotal.value} ${subject} ${verb} treated as mainland-like.`;
});

const formatPlural = (
  count: number,
  singular: string,
  plural = `${singular}s`,
) => (count === 1 ? singular : plural);

const fontFootnote = computed(() => {
  const fontSignal = browserSignals.value.find((signal) => signal.id === "font");

  if (!fontSignal) {
    return "According to your browser's font detection, the font result is not available yet.";
  }

  const matchedFonts = fontSignal.matches ?? [];
  const matchedCount = matchedFonts.length;

  if (fontSignal.result === null) {
    return `According to your browser's font detection, the font result is unavailable: ${fontSignal.detail}`;
  }

  if (matchedCount === 0) {
    return "According to your browser's font detection, you have no matching fonts installed.";
  }

  return `According to your browser's font detection, you have the following ${formatPlural(matchedCount, "font")} installed: ${matchedFonts.join(", ")}.`;
});

const proxyFootnote = computed(() => {
  const base =
    "The result is for reference only and may not be accurate.";

  if (internalRuleSignal.value?.result === true) {
    return `One of the internal rules has flagged you as a mainland Chinese user. ${base}`;
  }

  return base;
});

const formatResult = (result: boolean | null) => {
  if (result === true) return "Mainland-like";
  if (result === false) return "Non-mainland";
  return "Unknown";
};

const resultClass = (result: boolean | null) => {
  if (result === true) return "tool-tone-bad";
  if (result === false) return "tool-tone-ok";
  return "";
};

const visibleStatusIconColor = (result: boolean | null) => {
  const visibleResult = isCheckingResult.value ? null : result;
  if (visibleResult === true) return "var(--tool-bad)";
  if (visibleResult === false) return "var(--tool-ok)";
  return "var(--tool-muted)";
};

const signalIcons: Record<BrowserSignal["id"], string> = {
  language: "mdi:translate",
  timezone: "mdi:clock-outline",
  emoji: "mdi:emoticon-outline",
  font: "mdi:format-font",
};

const signalIcon = (id: BrowserSignal["id"]) => signalIcons[id];

const visibleValue = (value?: string | null) =>
  isCheckingResult.value ? CHECKING_TEXT : value || "N/A";

onMounted(() => {
  void refresh();
});
</script>

<style scoped>
.region-detect-note :deep(*) {
  margin-top: 0;
}

.region-detect-details {
  display: grid;
  gap: 18px;
}

.result-reveal-enter-active {
  transition:
    opacity 0.38s ease-out,
    transform 0.38s ease-out,
    clip-path 0.42s ease-out;
}

.result-reveal-enter-from {
  opacity: 0;
  clip-path: inset(0 0 100% 0);
  transform: translateY(-10px);
}

.result-reveal-enter-to {
  opacity: 1;
  clip-path: inset(0);
  transform: translateY(0);
}
</style>
