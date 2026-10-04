<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{ text: string; disabled?: boolean; context?: string; action: () => boolean | Promise<boolean>; successText: string; beforeArm?: () => boolean; blocked?: boolean }>();
const executing = ref(false);
const succeeded = ref(false);
let feedback: ReturnType<typeof setTimeout> | undefined;
let mounted = true;
const armed = ref(false);
const holding = ref(false);
let expiry: ReturnType<typeof setTimeout> | undefined;
let hold: ReturnType<typeof setTimeout> | undefined;
let suppressClick = false;
let activePointer: number | undefined;
let activeKey: string | undefined;

function reset() {
  clearTimeout(expiry);
  clearTimeout(hold);
  armed.value = holding.value = false;
  activePointer = undefined;
  activeKey = undefined;
}
function waitForHold() {
  clearTimeout(expiry);
  clearTimeout(hold);
  holding.value = false;
  activePointer = undefined;
  activeKey = undefined;
  if (armed.value) expiry = setTimeout(reset, 5000);
}
function click() {
  if (suppressClick) { suppressClick = false; return; }
  if (props.disabled || executing.value || succeeded.value || armed.value) return;
  if (props.beforeArm && !props.beforeArm()) return;
  armed.value = true;
  waitForHold();
}
function start() {
  if (props.disabled || executing.value || succeeded.value || !armed.value || holding.value) return false;
  suppressClick = true;
  clearTimeout(expiry);
  holding.value = true;
  hold = setTimeout(() => {
    if (!holding.value || props.disabled) return;
    reset();
    void execute();
  }, 3000);
  return true;
}
async function execute() {
  executing.value = true;
  try {
    const success = await props.action();
    if (mounted && success) {
      succeeded.value = true;
      feedback = setTimeout(() => { succeeded.value = false; }, 1500);
    }
  } finally {
    executing.value = false;
  }
}
function pointerDown(event: PointerEvent) {
  if (!event.isPrimary || event.button !== 0) return;
  if (start()) {
    activePointer = event.pointerId;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
}
function pointerEnd(event: PointerEvent) {
  if (activePointer === event.pointerId) waitForHold();
}
function keyDown(event: KeyboardEvent) {
  if (event.key === "Escape") { reset(); return; }
  if (![" ", "Enter"].includes(event.key)) return;
  event.preventDefault();
  if (event.repeat) return;
  if (!armed.value) { click(); return; }
  if (start()) activeKey = event.key;
}
function keyUp(event: KeyboardEvent) {
  if (![" ", "Enter"].includes(event.key)) return;
  event.preventDefault();
  suppressClick = false;
  if (activeKey === event.key) waitForHold();
}
watch(() => [props.disabled, props.context], reset);
onBeforeUnmount(() => { mounted = false; reset(); clearTimeout(feedback); });
</script>

<template>
  <button type="button" class="gacha-confirm-button" :class="{ armed: armed || succeeded, holding, succeeded, blocked }" :aria-disabled="disabled || blocked || executing || succeeded" :disabled="disabled || executing || succeeded"
    :aria-label="succeeded ? successText : armed ? `${text}: Confirm? Press and hold to confirm` : text"
    @click="click" @pointerdown="pointerDown" @pointerup="pointerEnd"
    @pointercancel="pointerEnd" @lostpointercapture="pointerEnd"
    @keydown="keyDown" @keyup="keyUp" @blur="reset" @contextmenu.prevent>
    <span class="sizing" aria-hidden="true">{{ text }}</span>
    <span class="sizing" aria-hidden="true">Confirm?</span>
    <span class="sizing" aria-hidden="true">{{ successText }}</span>
    <span class="label" aria-live="polite">{{ succeeded ? successText : armed ? 'Confirm?' : text }}</span>
  </button>
</template>

<style scoped>
.gacha-confirm-button {
  position: relative;
  display: inline-grid;
  overflow: hidden;
  align-items: center;
  padding: 0 20px;
  border: 1px solid var(--vp-button-alt-border);
  border-radius: 20px;
  background: var(--vp-button-alt-bg);
  color: var(--vp-button-alt-text);
  font-size: 14px;
  font-weight: 600;
  line-height: 38px;
  cursor: pointer;
  touch-action: none;
  user-select: none;
  transition: background-color .5s ease, border-color .5s ease, color .5s ease;
}
.gacha-confirm-button:hover { background: var(--vp-button-alt-hover-bg); }
.gacha-confirm-button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 3px; }
.gacha-confirm-button.blocked, .gacha-confirm-button.blocked:hover { cursor: not-allowed; opacity: .5; background: var(--vp-button-alt-bg); }
.gacha-confirm-button:disabled { cursor: not-allowed; opacity: .5; }
.gacha-confirm-button.succeeded:disabled { opacity: 1; }
.sizing, .label { grid-area: 1 / 1; }
.sizing { visibility: hidden; }
.label { position: relative; z-index: 1; }
.armed, .armed:hover { background: var(--vp-c-danger-1); border-color: var(--vp-c-danger-1); color: var(--vp-c-white); }
.armed::before { content: ''; position: absolute; inset: 0; background: var(--vp-c-danger-3); transform: scaleX(0); transform-origin: left; }
.holding::before { animation: confirm-hold 3s linear forwards; }
@keyframes confirm-hold { to { transform: scaleX(1); } }
@media (prefers-reduced-motion: reduce) { .gacha-confirm-button { transition: none; } .holding::before { animation: none; transform: scaleX(1); } }
</style>
