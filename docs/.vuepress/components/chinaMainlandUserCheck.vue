<template>
  <section class="china-user-check" :class="`is-${verdict.kind}`">
    <header class="result-panel">
      <div>
        <p class="eyebrow">Mainland China User Check</p>
        <h2>{{ verdict.title }}</h2>
        <p>{{ verdict.summary }}</p>
      </div>
      <button type="button" class="refresh-button" @click="refresh" :disabled="loading">
        {{ loading ? "Checking..." : "Refresh" }}
      </button>
    </header>

    <div v-if="error" class="message error-message">
      <strong>IP API request failed.</strong>
      <span>{{ error }}</span>
    </div>

    <div class="slot-note">
      <slot name="note" />
    </div>

    <div class="signal-grid">
      <article class="signal-card ip-card">
        <div class="signal-header">
          <span class="status-dot" :class="statusClass(ipSignal?.result ?? null)" />
          <h3>IP geolocation</h3>
        </div>
        <p class="signal-value">{{ ipSignal?.value ?? "Loading..." }}</p>
        <p class="signal-detail">
          {{ loading ? "Fetching from ip.lucas04.top..." : ipSignal?.detail }}
        </p>
      </article>

      <article v-for="signal in browserSignals" :key="signal.id" class="signal-card">
        <div class="signal-header">
          <span class="status-dot" :class="statusClass(signal.result)" />
          <h3>{{ signal.label }}</h3>
        </div>
        <p class="signal-value">{{ signal.value }}</p>
        <p class="signal-detail">{{ signal.detail }}</p>
      </article>
    </div>

    <table class="details-table">
      <thead>
        <tr>
          <th>Signal</th>
          <th>Result</th>
          <th>Observed value</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>IP country</td>
          <td :class="resultClass(ipSignal?.result ?? null)">
            {{ formatResult(ipSignal?.result ?? null) }}
          </td>
          <td>{{ ipSignal?.data?.IP?.Country ?? "N/A" }}</td>
        </tr>
        <tr>
          <td>Non-IP mainland signals</td>
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

    <ul class="footnote footnote-list">
      <li>
        See <a href="/tools/connection-info/">Connection Info</a> for more details about your IP and network connection information.
      </li>
      <li>
        {{ fontFootnote }}
      </li>
      <li>
        The result is for reference only and may not be accurate. Some internet providers may use proxies automatically without action by the user.
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import {
  type BrowserSignal,
  type IpSignal,
  countMainlandBrowserSignals,
  detectBrowserSignals,
  fetchIpSignal,
  resolveMainlandVerdict,
} from "../theme/utils/chinaMainlandUserDetection";

const loading = ref(true);
const error = ref<string | null>(null);
const ipSignal = ref<IpSignal | null>(null);
const browserSignals = ref<BrowserSignal[]>([]);

const refresh = async () => {
  loading.value = true;
  error.value = null;
  browserSignals.value = detectBrowserSignals();

  try {
    ipSignal.value = await fetchIpSignal();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
    ipSignal.value = {
      result: null,
      value: "N/A",
      detail: "Could not fetch IP geolocation from ip.lucas04.top.",
      data: null,
    };
  } finally {
    loading.value = false;
  }
};

const verdict = computed(() =>
  resolveMainlandVerdict(ipSignal.value, browserSignals.value),
);

const mainlandSignalScore = computed(
  () => countMainlandBrowserSignals(browserSignals.value),
);

const browserSignalTotal = computed(() => browserSignals.value.length || 4);

const mainlandSignalRuleResult = computed(() =>
  mainlandSignalScore.value >= 3 ? "Mainland-like" : "Non-mainland",
);

const mainlandSignalRuleResultClass = computed(() =>
  mainlandSignalScore.value >= 3 ? "result-mainland-like" : "result-non-mainland",
);

const mainlandSignalRuleText = computed(() => {
  const score = mainlandSignalScore.value;
  const verb = score === 1 ? "is" : "are";

  return `${score} in ${browserSignalTotal.value} signals ${verb} treated as mainland-like.`;
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

const statusClass = (result: boolean | null) => {
  if (result === true) return "status-hit";
  if (result === false) return "status-miss";
  return "status-unknown";
};

const formatResult = (result: boolean | null) => {
  if (result === true) return "Mainland-like";
  if (result === false) return "Non-mainland";
  return "Unknown";
};

const resultClass = (result: boolean | null) => {
  if (result === true) return "result-mainland-like";
  if (result === false) return "result-non-mainland";
  return "";
};

onMounted(() => {
  void refresh();
});
</script>

<style scoped>
.china-user-check {
  --check-accent: #2563eb;
  --check-accent-soft: rgba(37, 99, 235, 0.1);
  --check-border: rgba(100, 116, 139, 0.22);
  --check-muted: #64748b;
  --check-card: rgba(255, 255, 255, 0.72);
  display: grid;
  gap: 18px;
  margin: 24px 0;
}

.china-user-check.is-mainland-ip {
  --check-accent: #dc2626;
  --check-accent-soft: rgba(220, 38, 38, 0.12);
}

.china-user-check.is-mainland-like {
  --check-accent: #d97706;
  --check-accent-soft: rgba(217, 119, 6, 0.12);
}

.china-user-check.is-non-mainland {
  --check-accent: #16a34a;
  --check-accent-soft: rgba(22, 163, 74, 0.12);
}

.result-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px;
  border: 1px solid var(--check-border);
  border-left: 5px solid var(--check-accent);
  border-radius: 8px;
  background: var(--check-accent-soft);
}

.result-panel h2 {
  margin: 4px 0 8px;
  font-size: 1.55rem;
  line-height: 1.2;
}

.result-panel p {
  margin: 0;
  white-space: pre-line;
}

.eyebrow {
  color: var(--check-accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.refresh-button {
  flex: 0 0 auto;
  min-width: 96px;
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid var(--check-accent);
  border-radius: 6px;
  background: var(--check-accent);
  color: #ffffff;
  font-weight: 700;
  cursor: pointer;
}

.refresh-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.message {
  padding: 14px 16px;
  border-radius: 8px;
}

.error-message {
  border: 1px solid rgba(220, 38, 38, 0.35);
  background: rgba(220, 38, 38, 0.1);
  color: #991b1b;
}

.error-message span {
  display: block;
  margin-top: 4px;
}

.slot-note :deep(*) {
  margin-top: 0;
}

.signal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.signal-card {
  min-height: 156px;
  padding: 18px;
  border: 1px solid var(--check-border);
  border-radius: 8px;
  background: var(--check-card);
}

.ip-card {
  grid-column: 1 / -1;
}

.signal-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.signal-header h3 {
  margin: 0;
  font-size: 1rem;
}

.status-dot {
  width: 11px;
  height: 11px;
  flex: 0 0 11px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-hit {
  background: #dc2626;
}

.status-miss {
  background: #16a34a;
}

.status-unknown {
  background: #94a3b8;
}

.signal-value {
  margin: 16px 0 8px;
  overflow-wrap: anywhere;
  font-size: 1.08rem;
  font-weight: 800;
}

.signal-detail,
.footnote {
  color: var(--check-muted);
  font-size: 0.92rem;
}

.details-table {
  display: table;
  width: 100%;
  border-collapse: collapse;
}

.details-table th,
.details-table td {
  padding: 10px;
  border-bottom: 1px solid var(--check-border);
  text-align: center;
  vertical-align: top;
}

.details-table th {
  background: rgba(148, 163, 184, 0.12);
  font-weight: 800;
}

.details-table code {
  overflow-wrap: anywhere;
}

.result-mainland-like {
  color: #dc2626;
  font-weight: 700;
}

.result-non-mainland {
  color: #16a34a;
  font-weight: 700;
}

.footnote {
  margin: 0;
}

.footnote-list {
  padding-left: 1.25rem;
}

.footnote-list li {
  margin: 4px 0;
}

html.dark .china-user-check,
:root[data-theme="dark"] .china-user-check {
  --check-border: rgba(148, 163, 184, 0.32);
  --check-muted: #cbd5e1;
  --check-card: rgba(15, 23, 42, 0.45);
}

html.dark .error-message,
:root[data-theme="dark"] .error-message {
  color: #fecaca;
}

@media (max-width: 719px) {
  .result-panel {
    align-items: stretch;
    flex-direction: column;
  }

  .refresh-button {
    width: 100%;
  }

  .signal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
