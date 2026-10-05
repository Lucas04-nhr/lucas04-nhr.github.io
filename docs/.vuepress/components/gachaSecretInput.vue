<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";

const value = defineModel<string>({ required: true });
const props = defineProps<{ disabled?: boolean }>();
const revealed = ref(false);
const hide = () => { revealed.value = false; };
function reveal(event: PointerEvent) {
  if (props.disabled || !event.isPrimary || event.button !== 0) return;
  revealed.value = true;
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function keyDown(event: KeyboardEvent) {
  if (![" ", "Enter"].includes(event.key)) return;
  event.preventDefault();
  if (!props.disabled) revealed.value = true;
}
function keyUp(event: KeyboardEvent) {
  if ([" ", "Enter"].includes(event.key)) { event.preventDefault(); hide(); }
}
watch(() => props.disabled, hide);
onMounted(() => {
  window.addEventListener("blur", hide);
  document.addEventListener("visibilitychange", hide);
});
onBeforeUnmount(() => {
  window.removeEventListener("blur", hide);
  document.removeEventListener("visibilitychange", hide);
});
</script>

<template>
  <div class="secret-field">
    <label for="personal-sync-token">PERSONAL_SYNC_TOKEN (optional)</label>
    <div class="secret-control">
      <input id="personal-sync-token" v-model="value" :type="revealed ? 'text' : 'password'" autocomplete="off" :disabled="disabled" spellcheck="false" autocapitalize="off" />
      <button type="button" :disabled="disabled" aria-label="Press and hold to show token" title="Press and hold to show token" :aria-pressed="revealed"
        @pointerdown="reveal" @pointerup="hide" @pointercancel="hide" @lostpointercapture="hide" @blur="hide"
        @keydown="keyDown" @keyup="keyUp" @contextmenu.prevent>
        <span v-show="!revealed" aria-hidden="true"><VPIcon name="mdi:eye-off-outline" size="22" /></span>
        <span v-show="revealed" aria-hidden="true"><VPIcon name="mdi:eye-outline" size="22" /></span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.secret-control { display: flex; gap: 8px; margin-top: 4px; }
input { box-sizing: border-box; min-width: 0; width: 100%; padding: 10px 12px; border: 1px solid var(--vp-c-divider); border-radius: 8px; color: var(--vp-c-text-1); background: var(--vp-c-bg); font-family: var(--vp-font-family-mono); font-size: inherit; }
button { display: inline-flex; align-items: center; justify-content: center; flex: 0 0 44px; border: 1px solid var(--vp-button-alt-border); border-radius: 8px; background: var(--vp-button-alt-bg); color: var(--vp-button-alt-text); cursor: pointer; touch-action: none; user-select: none; }
button:hover { background: var(--vp-button-alt-hover-bg); }
button:disabled { opacity: .5; cursor: not-allowed; }
:is(input, button):focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
</style>
