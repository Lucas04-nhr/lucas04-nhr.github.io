<script setup lang="ts">
import { onMounted, onUnmounted } from "vue";
import { useRouter } from "vuepress/client";
import { runUrlQueryHandlers } from "../utils/urlQueryHandlers";

const router = useRouter();

const decodeUrlQueryState = () => {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  const urlChanged = runUrlQueryHandlers(url);
  if (!urlChanged) return;

  const cleaned = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState(window.history.state, "", cleaned);
};

let removeAfterEachHook: (() => void) | undefined;

onMounted(() => {
  decodeUrlQueryState();
  removeAfterEachHook = router.afterEach(() => {
    decodeUrlQueryState();
  });
});

onUnmounted(() => {
  removeAfterEachHook?.();
});
</script>

<template></template>
