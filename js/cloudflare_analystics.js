fetch('https://bloglucas04analytics.azurewebsites.net/')
    .then(response => response.json())
    .then(data => {
        // 在这里处理返回的数据
        const dailyVisits = data.dailyVisits;
        const totalVisits = data.totalVisits;

        // 在网页中显示访问量
        document.getElementById('daily-visits').textContent = dailyVisits;
        document.getElementById('total-visits').textContent = totalVisits;
    })
    .catch(error => {
        // 处理错误
        console.error('Error:', error);
    });