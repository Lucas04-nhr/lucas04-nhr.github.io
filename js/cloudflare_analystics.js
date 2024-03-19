fetch('https://bloglucas04analytics.azurewebsites.net/')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.text();  // Use text() instead of json() to get the raw response body
    })
    .then(text => {
        try {
            const data = JSON.parse(text);  // Try to parse the response as JSON
            // Handle your data here
        } catch (error) {
            console.error('Could not parse response as JSON:', text);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });