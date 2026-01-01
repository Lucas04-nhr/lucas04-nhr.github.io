<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else class="vp-code-group" v-html="highlightedHtml"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { codeToHtml } from "shiki";

const API_URL = "https://ip.lucas04.top";
const data = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const highlightedHtml = ref("");

const fetchDebugInfo = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data.value = await response.json();

    // 生成高亮的 HTML
    const jsonOutput = JSON.stringify(data.value, null, 2);
    highlightedHtml.value = await codeToHtml(jsonOutput, {
      lang: "json",
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
    });
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchDebugInfo();
});
</script>

<style scoped>
.vp-code-group {
  max-width: 55%;
  margin: 0 auto;
}

:deep(pre) {
  white-space: pre-wrap;
  word-wrap: break-word;
  word-break: break-all;
}

:deep(code) {
  white-space: pre-wrap;
}

:deep(.shiki) {
  background-color: var(--vp-code-bg) !important;
  color: var(--vp-code-text);
}

:deep(.shiki span) {
  color: var(--shiki-token-${token-type}, inherit);
}
</style>
