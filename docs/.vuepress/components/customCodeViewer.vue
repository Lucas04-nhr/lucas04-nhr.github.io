<script setup lang="ts">
import { createHighlighter } from "shiki";
import { ref, computed, onMounted } from "vue";

const props = defineProps<{
  content: string;
  lang: string;
}>();

const highlighter = ref();
const isCopied = ref(false);

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

const copyToClipboard = async () => {
  console.log("Copy button clicked");
  try {
    await navigator.clipboard.writeText(props.content);
    console.log("Copied to clipboard successfully");
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  } catch (err) {
    console.log("Clipboard API failed, using fallback", err);
    // Fallback for older browsers
    const textArea = document.createElement("textarea");
    textArea.value = props.content;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand("copy");
    document.body.removeChild(textArea);
    isCopied.value = true;
    setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
};

const highlightedCode = computed(() => {
  if (!highlighter.value) return props.content;
  try {
    return highlighter.value.codeToHtml(props.content, {
      lang: props.lang,
      themes: {
        light: "vitesse-light",
        dark: "vitesse-dark",
      },
      defaultColor: false,
    });
  } catch {
    return props.content;
  }
});
</script>

<template>
  <div :class="`code-viewer language-${lang}`" :data-title="lang">
    <button
      class="copy"
      :data-lang="lang"
      :title="isCopied ? 'Copied!' : 'Copy code'"
      @click="copyToClipboard"
    >
      <svg v-if="!isCopied" viewBox="0 0 24 24" width="16" height="16">
        <path
          fill="currentColor"
          d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"
        />
      </svg>
      <svg v-else viewBox="0 0 24 24" width="16" height="16">
        <path
          fill="currentColor"
          d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
        />
      </svg>
    </button>
    <div
      class="shiki shiki-themes vitesse-light vitesse-dark vp-code"
      v-html="highlightedCode"
    ></div>
  </div>
</template>

<style>
.code-viewer {
  position: relative;
}

.code-viewer .copy {
  position: absolute;
  top: 8px;
  right: 8px;
  display: none;
  background: none;
  border: 1px solid currentColor;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: inherit;
  opacity: 0.7;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  min-width: 32px;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transform: scale(1);
}

.code-viewer .copy:hover {
  opacity: 1;
  border-color: currentColor;
  transform: scale(1.05);
}

.code-viewer .copy:active {
  transform: scale(0.95);
  transition-duration: 0.1s;
}

.code-viewer .copy:hover {
  opacity: 1;
}

@media (min-width: 768px) {
  .code-viewer .copy {
    display: block;
  }
}
</style>
