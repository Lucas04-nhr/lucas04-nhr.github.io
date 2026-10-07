<script setup lang="ts">
import { VPIcon } from "vuepress-theme-plume/client";
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = withDefaults(defineProps<{
  title: string;
  message: string;
  active: boolean;
  progress?: number;
  simulatedLimit?: number;
  tone?: "note" | "caution";
  completed?: boolean;
}>(), { tone: "note", simulatedLimit: 0.94, completed: false });
// Render data fragments as text nodes, including in errors returned by the service.
const messageParts = computed(() => props.message.split(
  /(batch \d+ of \d+|Page \d+|\b\d+(?:,\d{3})*(?:\.\d+)?%?\b|\b(?:ALLOWED_ORIGINS|JSON|UIGF|UID|HTTP|HTTPS|D1)\b)/g,
).map((text, index) => ({ text, code: index % 2 === 1 })));
const visualProgress = ref(0);
const measured = computed(() => props.active && props.progress !== undefined);
const state = computed(() => props.active ? "working" : props.tone === "caution" ? "error" : props.completed ? "success" : "working");
let timer: ReturnType<typeof setInterval> | undefined;
function stop() { clearInterval(timer); timer = undefined; }
watch(() => props.active, (active) => {
  stop();
  if (!active) {
    if (props.completed && props.tone !== "caution") visualProgress.value = 1;
    return;
  }
  visualProgress.value = props.progress ?? 0;
  // A new random duration for each operation; never imply completion early.
  const duration = 18000 + Math.random() * 24000;
  const started = Date.now();
  timer = setInterval(() => {
    if (props.progress !== undefined) return;
    visualProgress.value = Math.max(visualProgress.value,
      props.simulatedLimit * (1 - Math.exp(-3 * (Date.now() - started) / duration)));
  }, 100);
}, { immediate: true });
watch(() => props.progress, (progress) => {
  if (props.active && progress !== undefined)
    visualProgress.value = Math.max(visualProgress.value, Math.max(0, Math.min(1, progress)));
});
onBeforeUnmount(stop);
</script>

<template>
  <div class="progress-status" :class="`is-${state}`" :aria-busy="active">
    <div class="progress-content">
      <h4 class="progress-title">
      <VPIcon :name="state === 'success' ? 'mdi:check-circle-outline' : state === 'error' ? 'mdi:close-circle-outline' : 'mdi:help-circle-outline'"
        color="var(--progress-accent)" size="24" aria-hidden="true" />
      <span>{{ title }}</span>
    </h4>
      <div class="progress-track" role="progressbar" :aria-label="title"
        :aria-valuemin="0" :aria-valuemax="100"
        :aria-valuenow="measured || (!active && completed && tone !== 'caution') ? Math.round(visualProgress * 100) : undefined"
        :aria-valuetext="active && !measured ? 'In progress' : message">
        <span :style="{ transform: `scaleX(${visualProgress})` }" />
      </div>
    <Transition name="status-reveal" mode="out-in">
      <p :key="state" :role="tone === 'caution' ? 'alert' : 'status'" aria-live="polite"><template v-for="(part, index) in messageParts" :key="index"><code v-if="part.code" class="progress-data">{{ part.text }}</code><template v-else>{{ part.text }}</template></template></p>
    </Transition>
    <slot />
    </div>
    <div class="progress-actions"><slot name="actions" /></div>
  </div>
</template>

<style scoped>
.progress-status {
  --progress-accent: #64748b;
  --progress-soft: rgba(100, 116, 139, 0.12);
  display: flex;
  align-items: center;
  gap: 20px;
  margin: 16px 0;
  padding: 22px;
  border: 1px solid rgba(100, 116, 139, 0.22);
  border-left: 5px solid var(--progress-accent);
  border-radius: 8px;
  background: var(--progress-soft);
  transition: background-color 0.38s ease-out, border-color 0.38s ease-out;
}
.progress-status.is-success {
  --progress-accent: #16a34a;
  --progress-soft: rgba(22, 163, 74, 0.12);
}
.progress-status.is-error {
  --progress-accent: #dc2626;
  --progress-soft: rgba(220, 38, 38, 0.12);
}
.progress-title {
  display: flex;
  align-items: center;
  gap: 9px;
  margin: 0;
  color: var(--progress-accent);
  transition: color 0.38s ease-out;
}
.progress-content { flex: 1 1 auto; min-width: 0; }
.progress-track {
  width: 100%;
  min-width: 0;
  margin: 12px 0 10px;
  height: 6px;
  overflow: hidden;
  border-radius: 999px;
  background: rgba(100, 116, 139, 0.24);
}
.progress-track span {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: inherit;
  background: var(--progress-accent);
  transform-origin: left center;
  transition: transform 0.3s ease-out, background-color 0.38s ease-out;
}
.progress-actions { display: grid; gap: 10px; flex: 0 0 224px; width: 224px; }
.progress-actions :deep(.vp-button.medium),
.progress-actions :deep(.gacha-confirm-button) {
  box-sizing: border-box;
  width: 224px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 6px;
  white-space: nowrap;
}
.progress-actions :deep(.vp-button.brand) {
  background: var(--progress-accent);
  border-color: var(--progress-accent);
  color: #fff;
}
.progress-status .progress-data {
  font-family: var(--vp-font-family-mono);
  font-size: 0.9em;
  font-variant-numeric: tabular-nums;
}
.progress-status p { margin: 0; overflow-wrap: anywhere; color: var(--vp-c-text-2); }
:global(html.dark) .progress-status,
:global(:root[data-theme="dark"]) .progress-status { border-color: rgba(148, 163, 184, 0.32); border-left-color: var(--progress-accent); }
@media (max-width: 719px) {
  .progress-status { flex-direction: column; align-items: stretch; gap: 16px; }
  .progress-content { width: 100%; }
  .progress-actions { flex: none; width: 100%; }
  .progress-actions :deep(.vp-button.medium),
  .progress-actions :deep(.gacha-confirm-button) { width: 100%; }
}
.status-reveal-enter-active, .status-reveal-leave-active { transition: opacity 0.2s ease-out, transform 0.2s ease-out; }
.status-reveal-enter-from, .status-reveal-leave-to { opacity: 0; transform: translateY(-6px); }
@media (prefers-reduced-motion: reduce) {
  .status-reveal-enter-active, .status-reveal-leave-active { transition: none; }
  .progress-status, .progress-title, .progress-track span { transition: none; }
}
</style>
