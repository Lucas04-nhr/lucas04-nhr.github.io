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
      <h3>Your IP Address</h3>
      <div class="ip-highlight">
        <code
          ><strong>{{ ipAddress }}</strong></code
        >
      </div>

      <template v-for="section in sections" :key="section.title">
        <h3>{{ section.title }}</h3>
        <table>
          <thead>
            <tr>
              <th>Field</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in section.rows" :key="row.label">
              <td>{{ row.label }}</td>
              <td>
                <code>{{ row.value }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <template v-if="headerRows.length > 0">
        <h3>HTTP Headers</h3>
        <table>
          <thead>
            <tr>
              <th>Header</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in headerRows" :key="row.label">
              <td>
                <code>{{ row.label }}</code>
              </td>
              <td>
                <code>{{ row.value }}</code>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";

const API_URL = "https://ip.lucas04.top";

type NullableValue = string | number | boolean | null | undefined;

interface ConnectionInfo {
  ip?: {
    address?: string;
    version?: number;
    source?: string;
  };
  geo?: {
    continentCode?: string;
    countryCode?: string;
    isEU?: boolean;
    region?: {
      name?: string;
      code?: string;
    };
    city?: string;
    postalCode?: string;
    metroCode?: string;
    coordinates?: {
      latitude?: number;
      longitude?: number;
    };
    timezone?: string;
  };
  network?: {
    asn?: number;
    asOrganization?: string;
    connection?: {
      transport?: string;
      rttMs?: number;
      deliveryRateBps?: number;
    };
  };
  security?: {
    tls?: {
      version?: string;
      cipher?: string;
      clientCertificatePresented?: boolean;
    };
  };
  client?: {
    userAgent?: string;
    acceptLanguage?: string;
    acceptEncoding?: string;
    platform?: string;
    mobile?: boolean;
  };
  edge?: {
    colo?: string;
    rayId?: string;
  };
  request?: {
    method?: string;
    url?: {
      scheme?: string;
      host?: string;
      pathname?: string;
      queryKeys?: string[];
    };
    httpProtocol?: string;
    priority?: string;
    referrerOrigin?: string;
  };
  headers?: {
    values?: Record<string, NullableValue>;
  };
  api?: {
    version?: string;
    generatedAt?: string;
    processingTimeMs?: number;
    cache?: string;
  };
}

interface TableRow {
  label: string;
  value: string;
}

interface TableSection {
  title: string;
  rows: TableRow[];
}

const data = ref<ConnectionInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const formatValue = (value: NullableValue) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

const formatWithUnit = (value: NullableValue, unit: string) => {
  if (value === null || value === undefined || value === "") return "N/A";
  return `${value} ${unit}`;
};

const formatRegion = (name?: string, code?: string) => {
  if (!name && !code) return "N/A";
  if (!name) return code ?? "N/A";
  if (!code) return name;
  return `${name} (${code})`;
};

const formatCoordinates = (latitude?: number, longitude?: number) => {
  if (latitude === undefined || longitude === undefined) return "N/A";
  return `${latitude}, ${longitude}`;
};

const formatQueryKeys = (queryKeys?: string[]) => {
  if (!queryKeys || queryKeys.length === 0) return "None";
  return queryKeys.join(", ");
};

const formatUrl = (url?: ConnectionInfo["request"]["url"]) => {
  if (!url?.host) return "N/A";

  const scheme = url.scheme ? `${url.scheme}://` : "";
  const pathname = url.pathname ?? "";

  return `${scheme}${url.host}${pathname}`;
};

const ipAddress = computed(() => {
  if (!data.value) return "Unknown";
  return (
    data.value.ip?.address ||
    data.value.headers?.values?.["x-real-ip"] ||
    "Unknown"
  );
});

const sections = computed<TableSection[]>(() => {
  const info = data.value;
  if (!info) return [];

  return [
    {
      title: "IP Information",
      rows: [
        { label: "Address", value: formatValue(info.ip?.address) },
        { label: "Version", value: formatValue(info.ip?.version) },
        { label: "Source", value: formatValue(info.ip?.source) },
      ],
    },
    {
      title: "Location Information",
      rows: [
        { label: "Continent Code", value: formatValue(info.geo?.continentCode) },
        { label: "Country Code", value: formatValue(info.geo?.countryCode) },
        {
          label: "Region",
          value: formatRegion(info.geo?.region?.name, info.geo?.region?.code),
        },
        { label: "City", value: formatValue(info.geo?.city) },
        { label: "Postal Code", value: formatValue(info.geo?.postalCode) },
        { label: "Metro Code", value: formatValue(info.geo?.metroCode) },
        {
          label: "Coordinates",
          value: formatCoordinates(
            info.geo?.coordinates?.latitude,
            info.geo?.coordinates?.longitude,
          ),
        },
        { label: "Timezone", value: formatValue(info.geo?.timezone) },
        { label: "Is EU", value: formatValue(info.geo?.isEU) },
      ],
    },
    {
      title: "Network Information",
      rows: [
        { label: "ASN", value: formatValue(info.network?.asn) },
        {
          label: "AS Organization",
          value: formatValue(info.network?.asOrganization),
        },
        {
          label: "Transport",
          value: formatValue(info.network?.connection?.transport),
        },
        {
          label: "Round Trip Time",
          value: formatWithUnit(info.network?.connection?.rttMs, "ms"),
        },
        {
          label: "Delivery Rate",
          value: formatWithUnit(
            info.network?.connection?.deliveryRateBps,
            "bps",
          ),
        },
      ],
    },
    {
      title: "Security",
      rows: [
        {
          label: "TLS Version",
          value: formatValue(info.security?.tls?.version),
        },
        {
          label: "TLS Cipher",
          value: formatValue(info.security?.tls?.cipher),
        },
        {
          label: "Client Certificate Presented",
          value: formatValue(info.security?.tls?.clientCertificatePresented),
        },
      ],
    },
    {
      title: "Client",
      rows: [
        { label: "User Agent", value: formatValue(info.client?.userAgent) },
        {
          label: "Accept Language",
          value: formatValue(info.client?.acceptLanguage),
        },
        {
          label: "Accept Encoding",
          value: formatValue(info.client?.acceptEncoding),
        },
        { label: "Platform", value: formatValue(info.client?.platform) },
        { label: "Mobile", value: formatValue(info.client?.mobile) },
      ],
    },
    {
      title: "Cloudflare Edge",
      rows: [
        { label: "Colo", value: formatValue(info.edge?.colo) },
        { label: "Ray ID", value: formatValue(info.edge?.rayId) },
      ],
    },
    {
      title: "Request",
      rows: [
        { label: "Method", value: formatValue(info.request?.method) },
        { label: "URL", value: formatUrl(info.request?.url) },
        { label: "Scheme", value: formatValue(info.request?.url?.scheme) },
        { label: "Host", value: formatValue(info.request?.url?.host) },
        { label: "Pathname", value: formatValue(info.request?.url?.pathname) },
        {
          label: "Query Keys",
          value: formatQueryKeys(info.request?.url?.queryKeys),
        },
        {
          label: "HTTP Protocol",
          value: formatValue(info.request?.httpProtocol),
        },
        { label: "Priority", value: formatValue(info.request?.priority) },
        {
          label: "Referrer Origin",
          value: formatValue(info.request?.referrerOrigin),
        },
      ],
    },
    {
      title: "API",
      rows: [
        { label: "Version", value: formatValue(info.api?.version) },
        { label: "Generated At", value: formatValue(info.api?.generatedAt) },
        {
          label: "Processing Time",
          value: formatWithUnit(info.api?.processingTimeMs, "ms"),
        },
        { label: "Cache", value: formatValue(info.api?.cache) },
      ],
    },
  ];
});

const headerRows = computed<TableRow[]>(() => {
  const headers = data.value?.headers?.values;
  if (!headers) return [];

  return Object.entries(headers)
    .sort(([first], [second]) => first.localeCompare(second))
    .map(([label, value]) => ({
      label,
      value: formatValue(value),
    }));
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
  text-align: center;
}

.debug-content table {
  display: table;
  width: min(100%, 960px);
  margin: 20px auto;
  border-collapse: collapse;
  table-layout: fixed;
}

.debug-content th,
.debug-content td {
  padding: 10px;
  text-align: center;
  vertical-align: middle;
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
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: break-word;
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
