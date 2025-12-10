// 盘古之白自动插入空格 VuePress 插件
export default (options, ctx) => ({
  name: "vuepress-plugin-pangu",
  extendMarkdown: (md) => {
    // 盘古分词算法
    function panguSpacing(text) {
      return text
        .replace(/([\u4e00-\u9fa5])([A-Za-z0-9])/g, "$1 $2")
        .replace(/([A-Za-z0-9])([\u4e00-\u9fa5])/g, "$1 $2")
        .replace(/([\u4e00-\u9fa5])([\!\?\,\.\;\:\)\]])/g, "$1 $2")
        .replace(/([\!\?\,\.\;\:\(\[])([\u4e00-\u9fa5])/g, "$1 $2");
    }
    // Markdown 渲染前处理
    md.core.ruler.push("pangu", (state) => {
      state.tokens.forEach((token) => {
        if (token.type === "inline" && token.children) {
          token.children.forEach((child) => {
            if (child.type === "text") {
              child.content = panguSpacing(child.content);
            }
          });
        }
      });
    });
  },
});
