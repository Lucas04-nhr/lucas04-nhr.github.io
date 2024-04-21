// 监听页面加载事件
window.addEventListener('load', function() {
    // 获取Lottie动画元素
    var lottieAnimation = document.getElementById('lottie-animation');
    // 设置初始透明度
    var opacity = 1;
    // 设置淡出的间隔时间
    var interval = setInterval(function() {
        // 逐步减小透明度
        opacity -= 0.01;
        // 设置Lottie动画元素的透明度
        lottieAnimation.style.opacity = opacity;
        // 当透明度小于或等于0时，停止淡出，并隐藏Lottie动画元素
        if (opacity <= 0) {
            clearInterval(interval);
            lottieAnimation.style.display = 'none';
        }
    }, 25); // 每25毫秒减小0.01的透明度，总共需要2.5秒完成淡出
});