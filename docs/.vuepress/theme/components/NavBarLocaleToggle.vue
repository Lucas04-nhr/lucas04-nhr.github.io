<script setup lang="ts">
import { onMounted, ref } from "vue";

const current = ref<"simplified" | "traditional">("simplified");

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

onMounted(() => {
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
</script>

<template>
  <div class="nav-bar-locale-toggle" aria-hidden="false">
    <button
      :class="['nav-toggle-btn', { active: current === 'simplified' }]"
      @click.prevent="setTraditional(false)"
      title="切换到简"
    >
      简
    </button>

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
.nav-toggle-btn {
  appearance: none;
  background: transparent;
  border: 1px solid transparent;
  color: inherit;
  padding: 4px 6px;
  font-size: 0.85rem;
  cursor: pointer;
  border-radius: 4px;
}
.nav-toggle-btn.active {
  background-color: rgba(0, 0, 0, 0.06);
}
</style>
