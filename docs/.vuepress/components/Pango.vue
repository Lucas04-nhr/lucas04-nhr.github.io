<template>
  <span v-html="processedText"></span>
</template>

<script>
// 盘古之白自动插入空格实现
function panguSpacing(text) {
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

export default {
  name: "Pango",
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  computed: {
    processedText() {
      return panguSpacing(this.text);
    },
  },
};
</script>
