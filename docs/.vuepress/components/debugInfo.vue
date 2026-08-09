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
      <div class="info-grid" aria-label="Connection information summary">
        <article
          v-for="section in sections"
          :key="section.id"
          class="info-card"
        >
          <header class="info-card-header">
            <VPIcon class="section-icon" :name="section.icon" size="22" />
            <h3>{{ section.title }}</h3>
          </header>

          <div class="card-highlights">
            <div
              v-for="highlight in section.highlights"
              :key="highlight.label"
              class="card-highlight"
            >
              <VPIcon
                v-if="highlight.icon"
                class="highlight-icon"
                :name="highlight.icon"
                size="34"
              />
              <div class="highlight-content">
                <span class="highlight-label">{{ highlight.label }}</span>
                <strong
                  :class="{
                    'is-monospace': isMonospaceField(highlight.label),
                  }"
                >
                  {{ highlight.value }}
                </strong>
              </div>
            </div>
          </div>

          <details class="detail-disclosure">
            <summary>
              <span>Detailed information</span>
              <span class="field-count">{{ section.rows.length }} fields</span>
            </summary>
            <div class="detail-list">
              <div
                v-for="row in section.rows"
                :key="row.label"
                class="detail-row"
              >
                <span class="detail-label">{{ row.label }}</span>
                <code v-if="isMonospaceField(row.label)">
                  {{ row.value }}
                </code>
                <span v-else class="detail-value">{{ row.value }}</span>
              </div>
            </div>
          </details>
        </article>
      </div>

      <details v-if="headerRows.length > 0" class="headers-card">
        <summary>
          <span class="headers-title">
            <VPIcon name="mdi:page-next-outline" size="22" />
            <strong>HTTP Headers</strong>
          </span>
          <span class="field-count">{{ headerRows.length }} headers</span>
        </summary>
        <div class="detail-list headers-list">
          <div v-for="row in headerRows" :key="row.label" class="detail-row">
            <code class="detail-label">{{ row.label }}</code>
            <code>{{ row.value }}</code>
          </div>
        </div>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { VPIcon } from "vuepress-theme-plume/client";
import { detectClientEnvironment } from "../theme/utils/clientEnvironmentDetection";

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

interface CardHighlight extends TableRow {
  icon?: string;
}

interface InfoSection {
  id: string;
  title: string;
  icon: string;
  highlights: CardHighlight[];
  rows: TableRow[];
}

const MONOSPACE_FIELDS = new Set([
  "Address",
  "IP Version",
  "Version",
  "Source",
  "Country",
  "Continent Code",
  "Country Code",
  "Postal Code",
  "Metro Code",
  "Coordinates",
  "Timezone",
  "Is EU",
  "ASN",
  "Transport",
  "Round Trip Time",
  "Delivery Rate",
  "TLS Version",
  "TLS Cipher",
  "Client Certificate Presented",
  "User Agent",
  "Accept Language",
  "Accept Encoding",
  "Platform",
  "Mobile",
  "Colocation",
  "Colo",
  "Ray ID",
  "Method",
  "URL",
  "Scheme",
  "Host",
  "Pathname",
  "Query Keys",
  "HTTP Protocol",
  "Priority",
  "Referrer Origin",
  "Processing Time",
  "Cache",
]);

const isMonospaceField = (label: string) => MONOSPACE_FIELDS.has(label);

const data = ref<ConnectionInfo | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

const clientEnvironment = computed(() => {
  const userAgent =
    data.value?.client?.userAgent ??
    (typeof navigator === "undefined" ? "" : navigator.userAgent);

  return detectClientEnvironment(userAgent, data.value?.client?.platform);
});

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

const sections = computed<InfoSection[]>(() => {
  const info = data.value;
  if (!info) return [];

  return [
    {
      id: "ip",
      title: "IP Information",
      icon: "mdi:ip-network-outline",
      highlights: [
        { label: "Address", value: ipAddress.value },
        { label: "IP Version", value: formatValue(info.ip?.version) },
        { label: "Source", value: formatValue(info.ip?.source) },
      ],
      rows: [
        { label: "Address", value: formatValue(info.ip?.address) },
        { label: "Version", value: formatValue(info.ip?.version) },
        { label: "Source", value: formatValue(info.ip?.source) },
      ],
    },
    {
      id: "location",
      title: "Location Information",
      icon: "mdi:map-marker-outline",
      highlights: [
        { label: "Country", value: formatValue(info.geo?.countryCode) },
        {
          label: "Region",
          value: formatRegion(info.geo?.region?.name, info.geo?.region?.code),
        },
        { label: "City", value: formatValue(info.geo?.city) },
      ],
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
      id: "network",
      title: "Network Information",
      icon: "mdi:lan-connect",
      highlights: [
        {
          label: "AS Organization",
          value: formatValue(info.network?.asOrganization),
        },
        { label: "ASN", value: formatValue(info.network?.asn) },
        {
          label: "Round Trip Time",
          value: formatWithUnit(info.network?.connection?.rttMs, "ms"),
        },
      ],
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
      id: "security",
      title: "Security",
      icon: "mdi:shield-lock-outline",
      highlights: [
        {
          label: "TLS Version",
          value: formatValue(info.security?.tls?.version),
        },
        {
          label: "TLS Cipher",
          value: formatValue(info.security?.tls?.cipher),
        },
      ],
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
      id: "client",
      title: "Client",
      icon: "mdi:laptop",
      highlights: [
        {
          label: "Operating System",
          value: clientEnvironment.value.operatingSystem.name,
          icon: clientEnvironment.value.operatingSystem.icon,
        },
        {
          label: "Browser",
          value: clientEnvironment.value.browser.name,
          icon: clientEnvironment.value.browser.icon,
        },
      ],
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
      id: "edge",
      title: "Cloudflare Edge",
      icon: "mdi:cloud-outline",
      highlights: [
        { label: "Colocation", value: formatValue(info.edge?.colo) },
        { label: "Ray ID", value: formatValue(info.edge?.rayId) },
      ],
      rows: [
        { label: "Colo", value: formatValue(info.edge?.colo) },
        { label: "Ray ID", value: formatValue(info.edge?.rayId) },
      ],
    },
    {
      id: "request",
      title: "Request",
      icon: "mdi:web",
      highlights: [
        { label: "Method", value: formatValue(info.request?.method) },
        {
          label: "HTTP Protocol",
          value: formatValue(info.request?.httpProtocol),
        },
        { label: "Host", value: formatValue(info.request?.url?.host) },
      ],
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
      id: "api",
      title: "API",
      icon: "mdi:api",
      highlights: [
        { label: "Version", value: formatValue(info.api?.version) },
        {
          label: "Processing Time",
          value: formatWithUnit(info.api?.processingTimeMs, "ms"),
        },
        { label: "Cache", value: formatValue(info.api?.cache) },
      ],
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

.debug-content {
  --info-accent: var(--vp-c-brand-1);
  --info-border: rgba(100, 116, 139, 0.22);
  --info-muted: #64748b;
  --info-card: rgba(255, 255, 255, 0.72);
  max-width: 100%;
  margin: 0 auto;
  padding: 20px 0;
}

.info-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 14px;
}

.info-card,
.headers-card {
  min-width: 0;
  border: 1px solid var(--info-border);
  border-radius: 8px;
  background: var(--info-card);
}

.info-card {
  display: flex;
  flex-direction: column;
  padding: 18px;
}

.info-card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.info-card-header h3 {
  margin: 0;
  font-size: 1rem;
  text-align: left;
}

.section-icon,
.highlight-icon,
.headers-title .vp-icon {
  flex: 0 0 auto;
  color: var(--info-accent);
}

.card-highlights {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.card-highlight {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  background: rgba(148, 163, 184, 0.12);
}

.highlight-content {
  display: grid;
  min-width: 0;
  gap: 4px;
}

.highlight-label {
  color: var(--info-muted);
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
}

.card-highlight strong {
  overflow-wrap: anywhere;
  font-size: 1.04rem;
  line-height: 1.35;
}

.is-monospace {
  font-family: var(--vp-font-family-mono);
}

.detail-disclosure {
  margin-top: auto;
  padding-top: 18px;
}

.detail-disclosure summary,
.headers-card summary {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  color: var(--info-accent);
  font-size: 0.9rem;
  font-weight: 800;
  cursor: pointer;
  list-style: none;
}

.detail-disclosure summary {
  padding-top: 14px;
  border-top: 1px solid var(--info-border);
}

.detail-disclosure summary::-webkit-details-marker,
.headers-card summary::-webkit-details-marker {
  display: none;
}

.detail-disclosure summary::after,
.headers-card summary::after {
  content: "+";
  width: 1.25rem;
  font-size: 1.2rem;
  line-height: 1;
  text-align: center;
}

.detail-disclosure[open] summary::after,
.headers-card[open] summary::after {
  content: "−";
}

.field-count {
  color: var(--info-muted);
  font-size: 0.78rem;
  font-weight: 600;
  white-space: nowrap;
}

.detail-list {
  display: grid;
  margin-top: 12px;
  border-top: 1px solid var(--info-border);
}

.detail-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.45fr) minmax(0, 1fr);
  gap: 12px;
  padding: 10px 2px;
  border-bottom: 1px solid var(--info-border);
  align-items: start;
}

.detail-row:last-child {
  border-bottom: 0;
}

.detail-label {
  color: var(--info-muted);
  font-size: 0.84rem;
  font-weight: 700;
}

.detail-row code,
.detail-value {
  padding: 0;
  background: transparent;
  color: inherit;
  font-size: 0.84rem;
  overflow-wrap: anywhere;
  white-space: normal;
  word-break: break-word;
}

.detail-row code {
  font-family: var(--vp-font-family-mono);
}

.headers-card {
  margin-top: 14px;
  padding: 18px;
}

.headers-title {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 10px;
}

.headers-list {
  margin-top: 16px;
}

html.dark .debug-error,
:root[data-theme="dark"] .debug-error {
  background: #7f1d1d !important;
  color: #fecaca !important;
}

html.dark .debug-content,
:root[data-theme="dark"] .debug-content {
  --info-border: rgba(148, 163, 184, 0.32);
  --info-muted: #cbd5e1;
  --info-card: rgba(15, 23, 42, 0.45);
}

@media (max-width: 719px) {
  .card-highlights {
    grid-template-columns: 1fr;
  }

  .detail-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
}

.vp-page-context-menu {
  display: none !important;
}
</style>
