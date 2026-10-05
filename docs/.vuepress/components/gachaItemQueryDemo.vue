<script setup>
import { computed, ref } from "vue";

const game = ref("hk4e");
const lang = ref("en-us");
const ids = ref("10000003,11401");
const result = computed(() => {
  const raw = ids.value.split(",");
  if (raw.length > 90 || raw.some((id) => !/^\d{1,20}$/.test(id))) {
    return {
      error:
        "Enter 1–90 IDs of 1–20 digits each, separated by commas without spaces.",
    };
  }
  const unique = [...new Set(raw)];
  const params = new URLSearchParams({
    game: game.value,
    lang: lang.value,
    ids: unique.join(","),
  });
  return {
    count: unique.length,
    url: `https://helios.lucas04.top/api/v1/items?${params}`,
  };
});
</script>

<template>
  <div class="gacha-query-demo">
    <label
      >Game
      <select v-model="game">
        <option value="hk4e">Genshin Impact</option>
        <option value="hk4e_ugc">Genshin Impact - Miliastra Wonderland</option>
        <option value="hkrpg">Honkai: Star Rail</option>
        <option value="nap">Zenless Zone Zero</option>
      </select>
    </label>
    <label
      >Language
      <select v-model="lang">
        <option value="en-us">English</option>
        <option value="zh-cn">Simplified Chinese</option>
        <option value="zh-tw">Traditional Chinese</option>
        <option value="ja-jp">Japanese</option>
      </select>
    </label>
    <label
      >Item IDs <input v-model="ids" type="text" spellcheck="false"
    /></label>
    <p v-if="result.error" role="alert">{{ result.error }}</p>
    <template v-else>
      <p>
        Unique IDs: <code>{{ result.count }}</code>
      </p>
      <p>
        Request URL: <code>{{ result.url }}</code>
      </p>
    </template>
  </div>
</template>

<style scoped>
.gacha-query-demo {
  display: grid;
  gap: 12px;
}
.gacha-query-demo label {
  display: grid;
  gap: 6px;
}
.gacha-query-demo input,
.gacha-query-demo select {
  width: 100%;
  min-width: 0;
  padding: 8px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 6px;
  color: var(--vp-c-text-1);
  background: var(--vp-c-bg);
  font: inherit;
}
.gacha-query-demo code {
  overflow-wrap: anywhere;
  white-space: normal;
}
.gacha-query-demo p {
  margin: 0;
}
</style>
