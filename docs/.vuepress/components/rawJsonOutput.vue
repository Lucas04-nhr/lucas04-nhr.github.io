<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>
    <div class="vp-code-group">
      <CodeViewer lang="json" :content="output" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import CodeViewer from "./customCodeViewer.vue";

const API_URL = "https://ip.lucas04.top";
const data = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const output = ref("");

const fetchDebugInfo = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data.value = await response.json();
    output.value = JSON.stringify(data.value, null, 2);
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
  margin: 0 auto;
}
</style>
