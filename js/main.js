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
  var lang = navigator.language || navigator.userLanguage; // Get the language of the browser

  // Get the forbidden text according to the language
  var forbiddenText = getForbiddenText(lang);

  // Alert the forbidden text
  alert(forbiddenText);

  // Set the forbidden text to the clipboard
  event.clipboardData.setData('text/plain', forbiddenText);

  // Prevent the default copy action
  event.preventDefault();
});

function getForbiddenText(language) {
  // Return the forbidden text according to the language
  switch (language) {
      case 'zh-CN':
          return '禁止复制';
      case 'en-US':
          return 'Copying is prohibited';
      // Add more languages here
      // ...
      default:
          return 'Copying is prohibited';
  }
}
