document.addEventListener('DOMContentLoaded', async () => {
    const dateTimeElement = document.getElementById('current-datetime');
    let timeSource = null;

    // 1. Try to fetch the time from the NTP server
    try {
        const response = await fetch('/api/ntp', { method: 'POST' });
        if (!response.ok) {
            throw new Error(`NTP server responded with status: ${response.status}`);
        }
        const data = await response.json();
        if (data.success && data.time) {
            // If successful, use the server time as the source
            timeSource = new Date(data.time);
            console.log('Successfully synced time with NTP server.');

            // Add a validation check. If the date is invalid, throw an error to fall back.
            if (isNaN(timeSource.getTime())) {
                throw new Error('Parsed NTP date is invalid.');
            }
        } else {
            throw new Error('NTP API did not return a valid time.');
        }
    } catch (error) {
        // 2. If fetching fails, fall back to the client's local machine time
        console.warn(`Could not sync time with NTP server: ${error.message}. Falling back to local machine time.`);
        timeSource = new Date();
    }

    // 3. Function to update the clock display every second
    function updateClock() {
        if (!dateTimeElement || !timeSource) return;

        // Increment the timeSource by one second
        timeSource.setSeconds(timeSource.getSeconds() + 1);

        const options = {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        };
        
        dateTimeElement.textContent = timeSource.toLocaleDateString('en-US', options);
    }

    // Start the clock, updating every second
    setInterval(updateClock, 1000);
});
