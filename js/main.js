/**
 * `Category` expand
 */
function expandAll() {
  $(".collapsible-header").addClass("active");
  $(".collapsible").collapsible({ accordion: true });
}

function collapseAll() {
  $(".collapsible-header").removeClass("active");
  $(".collapsible").collapsible({ accordion: true });
}

document.addEventListener('copy', function(event) {
  var lang = navigator.language || navigator.userLanguage; // 获取用户的语言设置

  // 根据地区和语言设置确定要显示的禁止复制文本
  var forbiddenText = getForbiddenText(lang);

  // 写入禁止复制文本到剪贴板
  event.clipboardData.setData('text/plain', forbiddenText);

  // 阻止默认复制行为
  event.preventDefault();
});

function getForbiddenText(language) {
  // 根据语言设置返回相应的禁止复制文本
  switch (language) {
      case 'zh-CN':
          return '禁止复制';
      case 'en-US':
          return 'Copying is prohibited';
      // 添加其他语言的情况
      // ...
      default:
          return 'Copying is prohibited';
  }
}
