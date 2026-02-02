<script setup lang="ts">
import { computed } from 'vue'
import { VPIcon, VPLink } from 'vuepress-theme-plume/client'
import { useRouteLocale } from 'vuepress/client'

interface Locale {
  gh: string
  sponsor: string
  email: string
}

const locales: Record<string, Locale> = {
  '/': { gh: 'See GitHub repo', sponsor: 'Buy me a Coffee', email: 'Contact Me' },
}

const lang = useRouteLocale()
const locale = computed(() => locales[lang.value])
</script>

<template>
  <div class="aside-nav-wrapper">
    <VPLink class="link" no-icon href="https://github.com/lucas04-nhr/lucas04-nhr.github.io">
      <icon name="mdi:github" />
      <span class="link-text">{{ locale.gh }}</span>
      <span class="vpi-arrow-right" />
    </VPLink>
    <VPLink class="link" href="/support/">
      <VPIcon name="ep:milk-tea" />
      <span class="link-text">{{ locale.sponsor }}</span>
      <span class="vpi-arrow-right" />
    </VPLink>
    <VPLink class="link" no-icon href="/about/#connect">
      <icon name="mdi:email-fast-outline" />
      <span class="link-text">{{ locale.email }}</span>
      <span class="vpi-arrow-right" />
    </VPLink>
  </div>
</template>

<style scoped>
.aside-nav-wrapper {
  display: flex;
  flex-direction: column;
  padding: 8px 0;
  margin: 16px 16px 0 0;
  line-height: 32px;
  border-top: solid 1px var(--vp-c-divider);
}

.aside-nav-wrapper .link {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
  transition: color var(--vp-t-color);
}

.aside-nav-wrapper .link:hover {
  color: var(--vp-c-brand-1);
}

.aside-nav-wrapper .link .link-text {
  flex: 1 2;
  font-size: 14px;
}

.aside-nav-wrapper :deep([class*=" vpi-"]) {
  margin: 0;
}
</style>