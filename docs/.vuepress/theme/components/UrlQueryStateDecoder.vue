<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vuepress/client";
import {
  applyAndPersistScriptPreference,
  clearAndResetScriptPreference,
  parseLcQueryAction,
} from "../utils/localeScriptPreference";

const router = useRouter();

const decodeLocaleFromUrl = () => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const action = parseLcQueryAction(url.searchParams.get("lc"));

  if (!action) return;

  // Clean lc query after handling it to keep sharable URLs stable.
  const cleanupLcQuery = () => {
    url.searchParams.delete("lc");
    const cleaned = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, "", cleaned);
  };

  if (action === "reset") {
    clearAndResetScriptPreference();
    cleanupLcQuery();
    return;
  }

  applyAndPersistScriptPreference(action);
  cleanupLcQuery();
};

let removeAfterEachHook: (() => void) | undefined;

onMounted(() => {
  decodeLocaleFromUrl();
  removeAfterEachHook = router.afterEach(() => {
    decodeLocaleFromUrl();
  });
});

onUnmounted(() => {
  removeAfterEachHook?.();
});
</script>

<template></template>
