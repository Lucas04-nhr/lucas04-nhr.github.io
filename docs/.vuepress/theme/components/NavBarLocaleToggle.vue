<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const props = defineProps<{
  placement: "desktop" | "mobile";
}>();

const current = ref<"simplified" | "traditional">("simplified");
const root = ref<HTMLElement | null>(null);
const isMobile = ref(false);
const mobileBreakpoint = 768;

const isTraditionalChineseLocale = () => {
  const locales = [
    typeof navigator !== "undefined" ? navigator.language : "",
    ...(typeof navigator !== "undefined" ? (navigator.languages ?? []) : []),
  ]
    .filter(Boolean)
    .map((locale) => locale.toLowerCase());

  return locales.some((locale) =>
    /^(zh-(hk|mo|tw)|zh-hant|zh-tw|zh-hk|zh-mo)\b/.test(locale),
  );
};

const applyTraditional = (showAlert: boolean) => {
  current.value = "traditional";
  try {
    localStorage.setItem("site-zh-script", "traditional");
  } catch {}

  const doc = typeof document !== "undefined" ? document.documentElement : null;
  if (doc) doc.classList.add("zh-traditional");
};

const setTraditional = (t: boolean) => {
  const doc = typeof document !== "undefined" ? document.documentElement : null;
  if (t) {
    applyTraditional(true);
  } else {
    current.value = "simplified";
    try {
      localStorage.setItem("site-zh-script", "simplified");
    } catch {}
    if (doc) doc.classList.remove("zh-traditional");
  }
};

const syncVisibility = () => {
  const visible =
    props.placement === "desktop" ? !isMobile.value : isMobile.value;

  if (root.value) {
    root.value.style.display = visible ? "inline-flex" : "none";
  }
};

const updateDeviceState = () => {
  if (typeof window === "undefined") return;

  isMobile.value = window.innerWidth < mobileBreakpoint;
  syncVisibility();
};

onMounted(() => {
  updateDeviceState();
  window.addEventListener("resize", updateDeviceState);

  try {
    const saved = localStorage.getItem("site-zh-script");
    if (saved === "traditional") {
      applyTraditional(false);
      return;
    }
    if (saved === "simplified") return;
  } catch {}

  if (isTraditionalChineseLocale()) {
    applyTraditional(false);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("resize", updateDeviceState);
  }
});
</script>

<template>
  <div
    ref="root"
    :class="['nav-bar-locale-toggle', `locale-toggle-${props.placement}`]"
    aria-hidden="false"
  >
    <button
      :class="['nav-toggle-btn', { active: current === 'simplified' }]"
      @click.prevent="setTraditional(false)"
      title="切换到简"
    >
      简
    </button>

    <span class="locale-toggle-divider" aria-hidden="true"></span>

    <button
      :class="['nav-toggle-btn', { active: current === 'traditional' }]"
      @click.prevent="setTraditional(true)"
      title="切换到繁"
    >
      繁
    </button>
  </div>
</template>

<style scoped>
.nav-bar-locale-toggle {
  display: inline-flex;
  gap: 6px;
  align-items: center;
  padding-left: 12px;
  margin-left: 12px;
  border-left: 1px solid var(--vp-c-divider);
}

.locale-toggle-desktop {
  .locale-toggle-divider {
    display: none;
  }
}

.locale-toggle-mobile {
  width: 100%;
  margin: 8px 0;
  padding: 0;
  border-left: 0;
  justify-content: center;
  align-items: center;
  gap: 0;
}

.locale-toggle-mobile .nav-toggle-btn {
  flex: 0 0 auto;
  padding: 10px;
  font-size: 0.92rem;
  line-height: 1;
  border: 0;
  background: transparent;
}

.locale-toggle-divider {
  width: 1px;
  height: 1.15em;
  margin: 0;
  align-self: center;
  background: var(--vp-c-divider);
}

.locale-toggle-mobile .nav-toggle-btn.active {
  background: transparent;
  color: var(--vp-c-brand-1);
}

.nav-toggle-btn {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  color: inherit;
  padding: 4px 6px;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 4px;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease;
}
.nav-toggle-btn.active {
  background-color: rgba(0, 0, 0, 0.06);
}
</style>
