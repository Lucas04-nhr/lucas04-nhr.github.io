document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    var menu = document.getElementById('context-menu');
    menu.style.left = e.clientX + '10 px';
    menu.style.top = e.clientY + '10 px';
    menu.style.display = 'block';
});

document.getElementById('refresh').addEventListener('click', function() {
    location.reload();
});

document.getElementById('backward').addEventListener('click', function() {
    if (!history.back) {
        var backward_trigger = document.getElementById('backward');
        backward_trigger.style.display = 'none';
        return;
    }
    history.back();
});

document.getElementById('forward').addEventListener('click', function() {
    if (!history.forward) {
        var forward_trigger = document.getElementById('forward');
        forward_trigger.style.display = 'none';
        return;
    }
    history.forward();
});

document.getElementById('share').addEventListener('click', function() {
    var share_url = window.location.href;
    navigator.clipboard.writeText(share_url);
    alert('URL copied to clipboard, please add the source of my website if you want to share it due to CC-BY-NC-SA 4.0 License');
});

document.getElementById('translate').addEventListener('click', function() {
    var translateUrl = 'https://translate.google.com/translate?sl=auto&tl=en&u=' + encodeURIComponent(window.location.href);
    window.open(translateUrl, '_blank');
});


document.addEventListener('click', function(e) {
    if (e.target.closest('.context-menu')) return;
    document.getElementById('context-menu').style.display = 'none';
  });