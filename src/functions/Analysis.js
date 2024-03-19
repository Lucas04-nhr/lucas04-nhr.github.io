const fetch = require('node-fetch');

module.exports = async function (context, req) {
    const response = await fetch('https://api.cloudflare.com/client/v4/zones/9e9b526811464fd9dd8ff82af1c4d2df/analytics/dashboard', {
        headers: {
           Authorization': 'Bearer EeLlKIF4kKoyRlW8i0Vji9MlvE8R5svaffxnloWH',
            'Content-Type': 'application/json'
        }
    });
    const data = await response.json();
    context.res = {
        // status: 200, /* Defaults to 200 */
        headers: {
            'Access-Control-Allow-Origin': 'https://blog.lucas04.xyz',
            'Content-Type': 'application/json'
        },
        body: {
            dailyPageviews: data.result.timeseries[0].uniques.all,
            totalPageviews: data.result.totals.uniques.all
        }
    };
}