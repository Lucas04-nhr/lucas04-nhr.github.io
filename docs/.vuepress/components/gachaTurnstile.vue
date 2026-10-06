<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";

type Turnstile = {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
};
const container = ref<HTMLElement>();
const dialog = ref<HTMLDialogElement>();
const purpose = ref("sync");
let widget: string | undefined;
let cancel: (() => void) | undefined;
const api = () => (window as unknown as { turnstile?: Turnstile }).turnstile;

// Load only when a configured Worker requests verification. Keep the shared
// script across route entries; remove each component's widget and listeners.
async function verify(siteKey: string, signal: AbortSignal, operation = "sync", action = "personal_sync"): Promise<string> {
  signal.throwIfAborted();
  if (cancel) throw new Error("Security verification is already in progress.");
  purpose.value = operation;
  await nextTick();
  try {
    dialog.value?.showModal();
    return await new Promise<string>((resolve, reject) => {
      let settled = false;
      const finish = (error?: Error, token?: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener("abort", aborted);
        script?.removeEventListener("load", loaded);
        script?.removeEventListener("error", failed);
        cancel = undefined;
        if (error) reject(error); else resolve(token!);
      };
      const aborted = () => finish(new Error("Security verification cancelled."));
      const failed = () => finish(new Error("Could not load security verification. Check your network or content blocker, then retry."));
      const loaded = () => {
        if (settled) return;
        const turnstile = api();
        if (!turnstile) { failed(); return; }
        turnstile.ready(() => {
          if (settled) return;
          try {
            widget = turnstile.render(container.value!, {
              sitekey: siteKey, action, theme: "auto", size: "flexible",
              "response-field": false,
              callback: (token: string) => finish(undefined, token),
              "error-callback": () => { finish(new Error("Security verification failed. Retry.")); return true; },
              "expired-callback": () => finish(new Error("Security verification expired. Retry.")),
              "timeout-callback": () => finish(new Error("Security verification timed out. Retry.")),
            });
          } catch { finish(new Error("Could not start security verification. Retry.")); }
        });
      };
      const timer = setTimeout(() => finish(new Error("Security verification timed out. Retry.")), 120000);
      let script = document.querySelector<HTMLScriptElement>('script[data-gacha-turnstile]');
      cancel = aborted;
      signal.addEventListener("abort", aborted, { once: true });
      if (signal.aborted) { aborted(); return; }
      if (api()) { loaded(); return; }
      if (!script) {
        script = document.createElement("script");
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.dataset.gachaTurnstile = "true";
        script.addEventListener("error", () => script?.remove(), { once: true });
        document.head.appendChild(script);
      }
      script.addEventListener("load", loaded, { once: true });
      script.addEventListener("error", failed, { once: true });
    });
  } finally {
    if (widget !== undefined) api()?.remove(widget);
    widget = undefined;
    dialog.value?.close();
  }
}
onBeforeUnmount(() => {
  cancel?.();
  if (widget !== undefined) api()?.remove(widget);
  widget = undefined;
});
defineExpose({ verify });
</script>

<template>
  <Teleport to="body">
    <dialog ref="dialog" class="gacha-turnstile-dialog" aria-label="Security verification"
      @cancel.prevent="cancel?.()">
      <h3>Security verification</h3>
      <p role="status">Complete verification to {{ purpose }}.</p>
      <div ref="container" class="gacha-turnstile-widget" />
      <button type="button" autofocus @click="cancel?.()">Cancel</button>
    </dialog>
  </Teleport>
</template>

<style scoped>
.gacha-turnstile-dialog {
  width: min(380px, calc(100vw - 32px));
  max-height: calc(100dvh - 32px);
  overflow: auto;
  box-sizing: border-box;
  margin: auto;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
}
.gacha-turnstile-widget {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  width: 100%;
  text-align: left;
}
.gacha-turnstile-dialog::backdrop { background: rgb(0 0 0 / 50%); }
h3 { margin: 0 0 12px; }
p { margin: 0 0 16px; }
button {
  margin-top: 16px;
  padding: 8px 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
  cursor: pointer;
}
button:focus-visible { outline: 2px solid var(--vp-c-brand-1); outline-offset: 2px; }
</style>
