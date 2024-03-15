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




// Prevent the default copy action
var element = document.body;
element.style.webkitUserSelect = 'none'; // Chrome, Safari, Opera
element.style.MozUserSelect = 'none'; // Firefox
element.style.msUserSelect = 'none'; // IE 10+
element.style['-ms-user-select'] = 'none'; // IE 10+
element.style.userSelect = 'none'; // Standard

// Get the elements which can be selected
var giscusElements = document.getElementsByClassName('gsc-comment-box-main');
var giscusCommentElements = document.getElementsByClassName('gsc-comment-box-write');

// Allow selection for giscus elements
for (var i = 0; i < giscusElements.length; i++) {
  giscusElements[i].style.webkitUserSelect = 'text'; // Chrome, Safari, Opera
  giscusElements[i].style.MozUserSelect = 'text'; // Firefox
  giscusElements[i].style.msUserSelect = 'text'; // IE 10+
  giscusCommentElements[i].style['-ms-user-select'] = 'text'; // IE 10+
  giscusElements[i].style.userSelect = 'text'; // Standard
}

// Allow selection for giscus comment elements
for (var i = 0; i < giscusCommentElements.length; i++) {
  giscusCommentElements[i].style.webkitUserSelect = 'text'; // Chrome, Safari, Opera
  giscusCommentElements[i].style.MozUserSelect = 'text'; // Firefox
  giscusCommentElements[i].style.msUserSelect = 'text'; // IE 10+
  giscusCommentElements[i].style['-ms-user-select'] = 'text'; // IE 10+
  giscusCommentElements[i].style.userSelect = 'text'; // Standard
}

// Add the copy event listener
document.addEventListener('copy', function(event) {
  var selection = window.getSelection();
  var selectedText = selection.toString();
  var sourceElement = selection.anchorNode.parentNode;

  // Check if the source element is gsc-comment-box-main, gsc-comment-box-write or their child
  if (sourceElement.classList.contains('gsc-comment-box-main') || sourceElement.closest('.gsc-comment-box-main') || sourceElement.classList.contains('gsc-comment-box-write') || sourceElement.closest('.gsc-comment-box-write')) {
    // Allow the default copy action
    event.clipboardData.setData('text/plain', selectedText);
  } else {
    // Set the forbidden text to the clipboard
    event.clipboardData.setData('text/plain', '');

    // Prevent the default copy action
    event.preventDefault();
  }
});

// Allow copy on my own comment
var element = document.body;
if (window.enableCopyPassword !== '041104') {
  element.style.webkitUserSelect = 'none'; // Chrome, Safari, Opera
  element.style.MozUserSelect = 'none'; // Firefox
  element.style.msUserSelect = 'none'; // IE 10+
  element.style.userSelect = 'none'; // Standard
  element.style['-ms-user-select'] = 'none'; // Edge
} else {
  element.style.webkitUserSelect = 'text'; // Chrome, Safari, Opera
  element.style.MozUserSelect = 'text'; // Firefox
  element.style.msUserSelect = 'text'; // IE 10+
  element.style.userSelect = 'text'; // Standard
  element.style['-ms-user-select'] = 'text'; // Edge
}

// Listen to the copy event
document.addEventListener('copy', function(event) {
  // Check if the prompt has already been shown in this session
  if (!sessionStorage.getItem('promptShown')) {
    // Show a prompt for the user to enter the password
    var password = prompt('Please enter the password to enable copying:');

    // Check if the password is correct
    if (password === '041104') {
      // Enable copying
      var element = document.body;
      element.style.webkitUserSelect = 'text'; // Chrome, Safari, Opera
      element.style.MozUserSelect = 'text'; // Firefox
      element.style.msUserSelect = 'text'; // IE 10+
      element.style.userSelect = 'text'; // Standard
      element.style['-ms-user-select'] = 'text'; // Edge
    }

    // Set a flag in sessionStorage so the prompt won't show again in this session
    sessionStorage.setItem('promptShown', 'true');
  }
});