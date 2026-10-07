<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(defineProps<{
  message: string;
  active: boolean;
  progress?: number;
  tone?: "note" | "caution";
}>(), { tone: "note" });
const measured = computed(() => props.active && props.progress !== undefined);
const value = computed(() => Math.round(Math.max(0, Math.min(1, props.progress ?? 0)) * 100));
</script>

<template>
  <div class="progress-status" :class="{ caution: tone === 'caution' }">
    <div
      :key="`${active}-${measured}`"
      class="progress-track"
      :class="{ simulated: active && !measured }"
      role="progressbar"
      :aria-label="message"
      :aria-valuemin="0"
      :aria-valuemax="100"
      :aria-valuenow="active ? (measured ? value : undefined) : (tone === 'caution' ? undefined : 100)"
      :aria-valuetext="active && !measured ? 'In progress' : undefined"
    >
      <span :style="{ transform: `scaleX(${active ? (measured ? value / 100 : 0) : 1})` }" />
    </div>
    <p :role="tone === 'caution' ? 'alert' : 'status'" aria-live="polite">{{ message }}</p>
  </div>
</template>

<style scoped>
.progress-status {
  --progress-accent: var(--vp-c-brand-1);
  margin: 16px 0;
}
.progress-status.caution {
  --progress-accent: var(--vp-c-caution-1, #dc2626);
}
.progress-track {
  width: 100%;
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
  transition: transform 0.3s ease-out;
}
.progress-track.simulated span {
  animation: progress-fill 30s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.progress-status p {
  margin: 10px 0 0;
  overflow-wrap: anywhere;
  color: var(--vp-c-text-2);
}
@keyframes progress-fill {
  0% { transform: scaleX(0); }
  62% { transform: scaleX(0.8); }
  100% { transform: scaleX(0.94); }
}
@media (prefers-reduced-motion: reduce) {
  .progress-track span { transition: none; }
  .progress-track.simulated span {
    animation: none;
    transform: scaleX(0.5) !important;
  }
}
</style>
