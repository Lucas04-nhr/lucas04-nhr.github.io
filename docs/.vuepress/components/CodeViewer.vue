<script setup lang="ts">
defineProps<{
  content: string;
  lang: string;
}>();
</script>

<template>
  <div :class="`code-viewer language-${lang}`" :data-title="lang">
    <button
      class="copy"
      :data-lang="lang"
      title="Copy code"
      data-copied="Copied"
    />
    <pre
      class="shiki shiki-themes vitesse-light vitesse-dark vp-code"
    ><code>{{ content }}</code></pre>
  </div>
</template>

<style>
.code-viewer .copy {
  display: none;
}

@media (min-width: 768px) {
  .code-viewer .copy {
    display: block;
  }
}
</style>
