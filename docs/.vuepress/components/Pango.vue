<template>
  <span v-html="processedText"></span>
</template>

<script lang="ts">
// 盘古之白自动插入空格实现
export function panguSpacing(text: string): string {
  // 中英文、数字与汉字之间插入空格
  return (
    text
      // 中文与英文、数字之间
      .replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, "$1 $2")
      .replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, "$1 $2")
      // 中文与符号之间
      .replace(/([\u4e00-\u9fa5])([\!\?\,\.\;\:\)\]])/g, "$1 $2")
      .replace(/([\!\?\,\.\;\:\(\[])([\u4e00-\u9fa5])/g, "$1 $2")
  );
}

// 在 DOM 中应用盘古之白空格
export function applyPanguSpacingToDOM(selector: string = ".vp-doc"): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return;
  }

  const contentElement = document.querySelector(selector);
  if (!contentElement) {
    return;
  }

  const walker = document.createTreeWalker(
    contentElement,
    NodeFilter.SHOW_TEXT,
    null
  );

  const nodesToReplace: Text[] = [];
  let node = walker.nextNode() as Text | null;
  while (node) {
    // Skip empty or whitespace-only nodes
    if (node.textContent?.trim()) {
      nodesToReplace.push(node);
    }
    node = walker.nextNode() as Text | null;
  }

  nodesToReplace.forEach((textNode) => {
    const processedText = panguSpacing(textNode.textContent || "");
    if (processedText !== textNode.textContent) {
      const span = document.createElement("span");
      span.textContent = processedText;
      textNode.parentNode?.replaceChild(span, textNode);
    }
  });
}

export default {
  name: "Pango",
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  computed: {
    processedText(): string {
      return panguSpacing(this.text);
    },
  },
};
</script>
