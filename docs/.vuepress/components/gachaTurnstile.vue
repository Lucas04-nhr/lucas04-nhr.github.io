<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from "vue";

type Turnstile = {
  ready(callback: () => void): void;
  render(container: HTMLElement, options: Record<string, unknown>): string;
  remove(id: string): void;
};
const container = ref<HTMLElement>();
const active = ref(false);
let widget: string | undefined;
let cancel: (() => void) | undefined;
const api = () => (window as unknown as { turnstile?: Turnstile }).turnstile;

// Load only when a configured Worker requests verification. Keep the shared
// script across route entries; remove each component's widget and listeners.
async function verify(siteKey: string, signal: AbortSignal): Promise<string> {
  signal.throwIfAborted();
  active.value = true;
  await nextTick();
  try {
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
      const failed = () => finish(new Error("Could not load security verification. Check your network or content blocker, then retry sync."));
      const loaded = () => {
        if (settled) return;
        const turnstile = api();
        if (!turnstile) { failed(); return; }
        turnstile.ready(() => {
          if (settled) return;
          try {
            widget = turnstile.render(container.value!, {
              sitekey: siteKey, action: "personal_sync", theme: "auto", size: "flexible",
              "response-field": false,
              callback: (token: string) => finish(undefined, token),
              "error-callback": () => { finish(new Error("Security verification failed. Retry sync.")); return true; },
              "expired-callback": () => finish(new Error("Security verification expired. Retry sync.")),
              "timeout-callback": () => finish(new Error("Security verification timed out. Retry sync.")),
            });
          } catch { finish(new Error("Could not start security verification. Retry sync.")); }
        });
      };
      const timer = setTimeout(() => finish(new Error("Security verification timed out. Retry sync.")), 120000);
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
    active.value = false;
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
  <div v-show="active" class="gacha-turnstile" aria-label="Sync security verification">
    <p class="muted" role="status">Complete security verification to start sync.</p>
    <div ref="container" />
  </div>
</template>

<style scoped>
.gacha-turnstile { margin: 12px 0; max-width: 100%; }
</style>
