<template>
  <details class="raw-json-disclosure">
    <summary>View raw JSON output</summary>
    <p v-if="error" class="raw-json-error">Error: {{ error }}</p>
    <div v-else class="vp-code-group">
      <CodeViewer
        lang="json"
        :content="loading ? 'Loading...' : output"
      />
    </div>
  </details>
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
  padding: 0 16px 1px;
}

.raw-json-disclosure {
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
}

.raw-json-disclosure summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  color: var(--vp-c-brand-1);
  font-weight: 800;
  cursor: pointer;
  list-style: none;
}

.raw-json-disclosure summary::-webkit-details-marker {
  display: none;
}

.raw-json-disclosure summary::after {
  content: "+";
  width: 1.25rem;
  flex: 0 0 1.25rem;
  font-size: 1.2rem;
  line-height: 1;
  text-align: center;
}

.raw-json-disclosure[open] summary::after {
  content: "−";
}

.raw-json-error {
  margin: 0;
  padding: 0 16px 16px;
  color: var(--vp-c-danger-1);
}
</style>
