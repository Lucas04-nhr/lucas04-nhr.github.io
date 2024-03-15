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
element.style.userSelect = 'none'; // Standard

// Get the elements which can be selected
var commentElement = document.getElementById('giscus_thread');
var giscusElements = document.getElementsByClassName('giscus');

// Allow selection for giscus_thread
commentElement.style.webkitUserSelect = 'text'; // Chrome, Safari, Opera
commentElement.style.MozUserSelect = 'text'; // Firefox
commentElement.style.msUserSelect = 'text'; // IE 10+
commentElement.style.userSelect = 'text'; // Standard

// Allow selection for giscus elements
for (var i = 0; i < giscusElements.length; i++) {
  giscusElements[i].style.webkitUserSelect = 'text'; // Chrome, Safari, Opera
  giscusElements[i].style.MozUserSelect = 'text'; // Firefox
  giscusElements[i].style.msUserSelect = 'text'; // IE 10+
  giscusElements[i].style.userSelect = 'text'; // Standard
}

// Add the copy event listener
document.addEventListener('copy', function(event) {
  var selection = window.getSelection();
  var selectedText = selection.toString();
  var sourceElement = selection.anchorNode.parentNode;

  // Check if the source element is giscus_thread, giscus or their child
  if (sourceElement.id === 'giscus_thread' || sourceElement.closest('#giscus_thread') || sourceElement.classList.contains('giscus') || sourceElement.closest('.giscus')) {
    // Allow the default copy action
    event.clipboardData.setData('text/plain', selectedText);
  } else {
    // Set the forbidden text to the clipboard
    event.clipboardData.setData('text/plain', '');

    // Prevent the default copy action
    event.preventDefault();
  }
});