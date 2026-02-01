<template>
  <div class="debug-info-wrapper">
    <div v-if="loading" class="debug-loading">
      <p>Loading connection information...</p>
    </div>

    <div v-else-if="error" class="debug-error">
      <strong>Error loading connection information</strong><br />
      {{ error }}
    </div>

    <div v-else class="debug-content">
      <!-- IP Highlight -->
      <h3>Your IP Address</h3>
      <div class="ip-highlight">
        <code
          ><strong>{{ ipAddress }}</strong></code
        >
      </div>

      <!-- Location Information -->
      <h3>Location Information</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Continent</td>
            <td>
              <code>{{ data.IP.Continent || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Country</td>
            <td>
              <code>{{ data.IP.Country || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Region</td>
            <td>
              <code>{{ data.IP.Region || "N/A" }}</code> (<code>{{
                data.IP.RegionCode || "N/A"
              }}</code
              >)
            </td>
          </tr>
          <tr>
            <td>City</td>
            <td>
              <code>{{ data.IP.City || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Coordinates</td>
            <td>
              <code>{{ data.IP.Latitude || "N/A" }}</code
              >, <code>{{ data.IP.Longitude || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Postal Code</td>
            <td>
              <code>{{ data.IP.PostalCode || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Timezone</td>
            <td>
              <code>{{ data.IP.Timezone || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Metro Code</td>
            <td>
              <code>{{ data.IP.MetroCode || "N/A" }}</code>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Network Information -->
      <h3>Network Information</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>ASN</td>
            <td>
              <code>{{ data.IP.ASN || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>AS Organization</td>
            <td>
              <code>{{ data.IP.ASOrganization || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Cloudflare Colo</td>
            <td>
              <code>{{ data.IP.Colo || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>Is EU</td>
            <td>{{ data.IP.IsEU ? "Yes" : "No" }}</td>
          </tr>
        </tbody>
      </table>

      <!-- Security & Protocol -->
      <template v-if="data.Security">
        <h3>Security & Protocol</h3>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>HTTP Protocol</td>
              <td>
                <code>{{ data.Security.httpProtocol || "N/A" }}</code>
              </td>
            </tr>
            <tr>
              <td>TLS Version</td>
              <td>
                <code>{{ data.Security.tlsVersion || "N/A" }}</code>
              </td>
            </tr>
            <tr>
              <td>TLS Cipher</td>
              <td>
                <code>{{ data.Security.tlsCipher || "N/A" }}</code>
              </td>
            </tr>
            <tr>
              <td>Client TCP RTT</td>
              <td>{{ data.Security.clientTcpRtt || "N/A" }} ms</td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Request Information -->
      <!-- <h3>Request Information</h3>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Method</td>
            <td>
              <code>{{ data.Method || "N/A" }}</code>
            </td>
          </tr>
          <tr>
            <td>URL</td>
            <td>
              <code>{{ data.Url || "N/A" }}</code>
            </td>
          </tr>
        </tbody>
      </table> -->

      <!-- HTTP Headers -->
      <template v-if="data.Headers">
        <h3>HTTP Headers</h3>
        <table>
          <thead>
            <tr>
              <th>Header</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(value, key) in data.Headers" :key="key">
              <td>
                <code>{{ key }}</code>
              </td>
              <td>
                <code>{{ value }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, h } from "vue";

const API_URL = "https://ip.lucas04.top";
const data = ref<any>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const ipAddress = computed(() => {
  if (!data.value) return "Unknown";
  return data.value.IP?.IP || data.value.Headers?.["x-real-ip"] || "Unknown";
});

const fetchDebugInfo = async () => {
  loading.value = true;
  error.value = null;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    data.value = await response.json();
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
.debug-info-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

.debug-loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

.debug-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 20px;
  border-radius: 8px;
  border-left: 4px solid #dc2626;
  margin: 20px 0;
}

.ip-highlight {
  padding: 20px;
  border-radius: 8px;
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin: 20px 0;
  font-weight: 900;
  color: var(--vp-c-white, #ffffff);
}

.debug-content {
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 0;
}

.debug-content h3 {
  margin-top: 5px;
}

.debug-content table {
  width: 100%;
  margin: 20px auto 20px auto;
  border-collapse: collapse;
}

.debug-content th,
.debug-content td {
  padding: 10px;
  text-align: center;
  border-bottom: 1px solid #e5e7eb;
}

.debug-content th {
  background-color: #f3f4f6;
  font-weight: 900;
}

.debug-content code {
  background-color: #f3f4f6;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.debug-content pre {
  background-color: #f3f4f6;
  padding: 15px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 20px 0;
}

.debug-content pre code {
  background-color: transparent;
  padding: 0;
  font-family: "Courier New", monospace;
  font-size: 0.9em;
}

html.dark .debug-error,
:root[data-theme="dark"] .debug-error {
  background: #7f1d1d !important;
  color: #fecaca !important;
}

html.dark .debug-content th,
:root[data-theme="dark"] .debug-content th {
  background-color: #374151 !important;
  color: #f9fafb !important;
}

html.dark .debug-content td,
:root[data-theme="dark"] .debug-content td {
  color: #f9fafb !important;
}

html.dark .debug-content code,
:root[data-theme="dark"] .debug-content code {
  background-color: #374151 !important;
  color: #f9fafb !important;
}

html.dark .debug-content pre,
:root[data-theme="dark"] .debug-content pre {
  background-color: #1f2937 !important;
  color: #f9fafb !important;
}

html.dark .debug-content h2,
html.dark .debug-content h3,
:root[data-theme="dark"] .debug-content h2,
:root[data-theme="dark"] .debug-content h3 {
  color: #f9fafb !important;
}

html.dark .debug-content p,
:root[data-theme="dark"] .debug-content p {
  color: #d1d5db !important;
}

html.dark .ip-highlight,
:root[data-theme="dark"] .ip-highlight {
  color: #ffffff !important;
}

html.dark .debug-content table,
:root[data-theme="dark"] .debug-content table {
  border-bottom-color: #4b5563 !important;
}

html.dark .debug-content th,
html.dark .debug-content td,
:root[data-theme="dark"] .debug-content th,
:root[data-theme="dark"] .debug-content td {
  border-bottom-color: #4b5563 !important;
}

html.dark .debug-content th,
html.dark .debug-content td {
  border-bottom: 1px solid #4b5563 !important;
}
.vp-page-context-menu {
  display: none !important;
}
</style>
