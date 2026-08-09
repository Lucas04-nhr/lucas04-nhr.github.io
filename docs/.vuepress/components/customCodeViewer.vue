<script setup lang="ts">
import { createHighlighter } from "shiki";
import { ref, computed, onMounted } from "vue";

const props = defineProps<{
  content: string;
  lang: string;
}>();

const highlighter = ref();

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ["vitesse-light", "vitesse-dark"],
    langs: [
      "javascript",
      "typescript",
      "python",
      "java",
      "cpp",
      "c",
      "go",
      "rust",
      "php",
      "ruby",
      "swift",
      "kotlin",
      "scala",
      "r",
      "matlab",
      "bash",
      "shell",
      "powershell",
      "sql",
      "html",
      "css",
      "scss",
      "less",
      "json",
      "xml",
      "yaml",
      "toml",
      "ini",
      "dockerfile",
      "makefile",
      "markdown",
      "tex",
      "latex",
      "bibtex",
      "diff",
      "log",
      "text",
    ],
  });
});

const escapeHtml = (content: string) =>
  content
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const highlightedCode = computed(() => {
  if (!highlighter.value) return escapeHtml(props.content);

  try {
    const highlighted = highlighter.value.codeToHtml(props.content, {
      lang: props.lang,
      themes: {
        light: "vitesse-light",
        dark: "vitesse-dark",
      },
      defaultColor: false,
    });

    return (
      highlighted.match(/<code(?:\s[^>]*)?>([\s\S]*?)<\/code>/)?.[1] ??
      escapeHtml(props.content)
    );
  } catch {
    return escapeHtml(props.content);
  }
});
</script>

<template>
  <div :class="`code-viewer language-${lang}`" :data-ext="lang">
    <pre class="shiki shiki-themes vitesse-light vitesse-dark vp-code"><code
      v-html="highlightedCode"
    /></pre>
  </div>
</template>
