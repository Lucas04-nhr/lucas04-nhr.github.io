<template>
  <section class="network-tool" :class="`is-${kind}`">
    <header class="network-tool-panel">
      <p class="network-tool-eyebrow">{{ eyebrow }}</p>
      <h2 class="network-tool-title">
        <VPIcon :key="icon" :name="icon" color="var(--tool-accent)" size="28" aria-hidden="true" />
        <span>{{ title }}</span>
      </h2>
      <div class="network-tool-action-row">
        <div class="network-tool-progress" aria-hidden="true">
          <span :style="{ transform: `scaleX(${progressValue})` }" />
        </div>
        <button
          type="button"
          class="network-tool-button"
          :disabled="running && !stoppable"
          @click="emit('run')"
        >
          {{ running ? (stoppable ? "Stop" : "Checking...") : buttonText }}
        </button>
      </div>
      <p class="network-tool-summary">{{ summary }}</p>
    </header>

    <div v-if="error" class="network-tool-error">
      <strong>The test could not finish.</strong>
      <span>{{ error }}</span>
    </div>

    <slot />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";

type ShellKind = "idle" | "running" | "ok" | "warn" | "bad";

const props = withDefaults(
  defineProps<{
    eyebrow: string;
    title: string;
    summary: string;
    kind?: ShellKind;
    progress?: number;
    buttonText?: string;
    stoppable?: boolean;
    error?: string | null;
  }>(),
  {
    kind: "idle",
    progress: 0,
    buttonText: "Start",
    stoppable: false,
    error: null,
  },
);

const emit = defineEmits<{ run: [] }>();

const icons: Record<ShellKind, string> = {
  idle: "mdi:play-circle-outline",
  running: "mdi:help-circle-outline",
  ok: "mdi:check-circle-outline",
  warn: "mdi:alert-circle-outline",
  bad: "mdi:close-circle-outline",
};

const icon = computed(() => icons[props.kind]);
const running = computed(() => props.kind === "running");
const progressValue = computed(() =>
  Math.min(1, Math.max(0, props.progress)),
);
</script>

<style>
.network-tool {
  --tool-accent: #1d4ed8;
  --tool-accent-soft: rgba(29, 78, 216, 0.1);
  --tool-on-accent: #ffffff;
  --tool-ok: #166534;
  --tool-warn: #92400e;
  --tool-bad: #b91c1c;
  --tool-border: rgba(100, 116, 139, 0.22);
  --tool-muted: #64748b;
  --tool-card: rgba(255, 255, 255, 0.72);
  display: grid;
  gap: 18px;
  margin: 24px 0;
}

.network-tool.is-ok {
  --tool-accent: var(--tool-ok);
  --tool-accent-soft: color-mix(in srgb, var(--tool-ok) 12%, transparent);
}

.network-tool.is-warn {
  --tool-accent: var(--tool-warn);
  --tool-accent-soft: color-mix(in srgb, var(--tool-warn) 12%, transparent);
}

.network-tool.is-bad {
  --tool-accent: var(--tool-bad);
  --tool-accent-soft: color-mix(in srgb, var(--tool-bad) 12%, transparent);
}

.network-tool.is-running {
  --tool-accent: #475569;
  --tool-accent-soft: rgba(71, 85, 105, 0.12);
}

.network-tool-panel {
  padding: 22px;
  border: 1px solid var(--tool-border);
  border-left: 5px solid var(--tool-accent);
  border-radius: 8px;
  background: var(--tool-accent-soft);
}

.network-tool .network-tool-panel p {
  margin: 0;
  white-space: pre-line;
}

.network-tool-panel h2.network-tool-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 4px 0 8px;
  padding: 0;
  border: 0;
  font-size: 1.55rem;
  line-height: 1.2;
}

.network-tool-eyebrow {
  color: var(--tool-accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0;
  text-transform: uppercase;
}

.network-tool-action-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 12px 0 10px;
}

.network-tool-progress {
  flex: 1 1 auto;
  height: 6px;
  min-width: 0;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.24);
}

.network-tool-progress span {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--tool-accent);
  transform-origin: left center;
  transition: transform 0.2s ease-out;
}

.network-tool-button,
.network-tool-secondary-button {
  min-height: 38px;
  padding: 8px 14px;
  border: 1px solid var(--tool-accent);
  border-radius: 6px;
  font-weight: 700;
  white-space: nowrap;
  cursor: pointer;
}

.network-tool-button {
  flex: 0 0 112px;
  width: 112px;
  background: var(--tool-accent);
  color: var(--tool-on-accent);
}

.network-tool-button:disabled,
.network-tool-secondary-button:disabled {
  cursor: wait;
  opacity: 0.72;
}

.network-tool-secondary-button {
  background: transparent;
  color: var(--tool-accent);
}

.network-tool-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.network-tool-error {
  padding: 14px 16px;
  border: 1px solid rgba(220, 38, 38, 0.35);
  border-radius: 8px;
  background: rgba(220, 38, 38, 0.1);
  color: #991b1b;
}

.network-tool-error span {
  display: block;
  margin-top: 4px;
}

.network-tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.network-tool-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid var(--tool-border);
  border-radius: 8px;
  background: var(--tool-card);
}

.network-tool-card.is-wide {
  grid-column: 1 / -1;
}

.network-tool-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.network-tool .network-tool-card-header h3 {
  margin: 0;
  padding: 0;
  font-size: 1rem;
}

.network-tool-card-header .vp-icon {
  flex: 0 0 auto;
  color: var(--tool-accent);
}

.network-tool .network-tool-value {
  margin: 16px 0 8px;
  overflow-wrap: anywhere;
  font-size: 1.08rem;
  font-weight: 800;
}

.network-tool .network-tool-detail {
  margin: 0;
  color: var(--tool-muted);
  font-size: 0.92rem;
  overflow-wrap: anywhere;
}

.network-tool-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
}

.network-tool-stat {
  display: grid;
  min-width: 0;
  gap: 4px;
  padding: 12px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
}

.network-tool-stat span {
  color: var(--tool-muted);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.network-tool-stat strong {
  overflow-wrap: anywhere;
  font-size: 1.04rem;
  line-height: 1.35;
}

.network-tool-table-wrap {
  overflow-x: auto;
}

.network-tool .network-tool-table {
  display: table;
  width: 100%;
  margin: 0;
  border-collapse: collapse;
}

.network-tool .network-tool-table th,
.network-tool .network-tool-table td {
  padding: 10px;
  border: 0;
  border-bottom: 1px solid var(--tool-border);
  font-size: 0.9rem;
  text-align: left;
  vertical-align: top;
}

.network-tool .network-tool-table th {
  background: rgba(148, 163, 184, 0.12);
  font-weight: 800;
  white-space: nowrap;
}

.network-tool-table tr {
  border: 0;
  background: transparent;
}

.network-tool .network-tool-table code,
.network-tool .network-tool-mono {
  padding: 0;
  background: transparent;
  color: inherit;
  font-family: var(--vp-font-family-mono);
  font-size: 0.84rem;
  overflow-wrap: anywhere;
}

.network-tool-disclosure {
  padding: 18px;
  border: 1px solid var(--tool-border);
  border-radius: 8px;
  background: var(--tool-card);
}

.network-tool-disclosure summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  color: var(--tool-accent);
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  list-style: none;
}

.network-tool-disclosure summary::-webkit-details-marker {
  display: none;
}

.network-tool-disclosure summary::after {
  content: "+";
  width: 1.25rem;
  font-size: 1.2rem;
  line-height: 1;
  text-align: center;
}

.network-tool-disclosure[open] summary::after {
  content: "−";
}

.network-tool-disclosure-body {
  margin-top: 14px;
}

.network-tool-count {
  color: var(--tool-muted);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.network-tool .network-tool-notes {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--tool-muted);
  font-size: 0.92rem;
}

.network-tool .network-tool-notes li {
  margin: 4px 0;
  overflow-wrap: anywhere;
}

.tool-tone-ok {
  color: var(--tool-ok);
  font-weight: 700;
}

.tool-tone-warn {
  color: var(--tool-warn);
  font-weight: 700;
}

.tool-tone-bad {
  color: var(--tool-bad);
  font-weight: 700;
}

.tool-tone-muted {
  color: var(--tool-muted);
}

html.dark .network-tool,
:root[data-theme="dark"] .network-tool {
  --tool-accent: #60a5fa;
  --tool-accent-soft: rgba(96, 165, 250, 0.1);
  --tool-on-accent: var(--vp-c-bg);
  --tool-ok: #22c55e;
  --tool-warn: #fbbf24;
  --tool-bad: #f87171;
  --tool-border: rgba(148, 163, 184, 0.32);
  --tool-muted: #cbd5e1;
  --tool-card: rgba(15, 23, 42, 0.45);
}

html.dark .network-tool.is-ok,
:root[data-theme="dark"] .network-tool.is-ok {
  --tool-accent: var(--tool-ok);
  --tool-accent-soft: color-mix(in srgb, var(--tool-ok) 12%, transparent);
}

html.dark .network-tool.is-warn,
:root[data-theme="dark"] .network-tool.is-warn {
  --tool-accent: var(--tool-warn);
  --tool-accent-soft: color-mix(in srgb, var(--tool-warn) 12%, transparent);
}

html.dark .network-tool.is-bad,
:root[data-theme="dark"] .network-tool.is-bad {
  --tool-accent: var(--tool-bad);
  --tool-accent-soft: color-mix(in srgb, var(--tool-bad) 12%, transparent);
}

html.dark .network-tool.is-running,
:root[data-theme="dark"] .network-tool.is-running {
  --tool-accent: #94a3b8;
  --tool-accent-soft: rgba(148, 163, 184, 0.12);
}

html.dark .network-tool-error,
:root[data-theme="dark"] .network-tool-error {
  color: #fecaca;
}

@media (max-width: 719px) {
  .network-tool-action-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .network-tool-progress {
    flex: 0 0 6px;
  }

  .network-tool-button {
    flex: 0 0 auto;
    width: 100%;
  }

  .network-tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
