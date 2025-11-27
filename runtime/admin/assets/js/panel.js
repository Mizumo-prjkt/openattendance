document.addEventListener('DOMContentLoaded', async () => {
    const logoutBtn = document.getElementById('logout-btn');
    const charts = []; // Array to hold all our chart instances

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/admin/logout', { method: 'POST' });
                if (response.ok) {
                    // Redirect to the login page after successful logout
                    window.location.href = '/admin-login';
                } else {
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                alert('An error occurred during logout.');
            }
        });
    }

    try {
        const response = await fetch('/api/admin/dashboard-stats');
        if (!response.ok) {
            throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
        }
        const stats = await response.json();

        // Populate summary tiles
        document.getElementById('total-students').textContent = stats.totalStudents.toLocaleString() || '0';
        document.getElementById('staff-accounts').textContent = stats.totalStaff.toLocaleString() || '0';
        document.getElementById('todays-attendance').textContent = stats.todaysAttendance.toLocaleString() || '0';

        // Initialize charts with fetched data
        charts.push(initWeeklyTrendChart(stats.weeklyTrend));
        charts.push(initDailyRatioChart(stats.todaysAttendance, stats.todaysAbsences, stats.todaysExcused));
        charts.push(initMonthlyOverviewChart(stats.monthlyOverview));

        // Fetch and display recent logs
        loadRecentLogs();

    } catch (error) {
        console.error("Could not load dashboard data:", error);
        // You could display an error message on the dashboard here
    }

    // Add a resize listener to make charts responsive after window changes.
    let resizeTimeout;
    window.addEventListener('resize', () => {
        // Debounce the resize event to avoid excessive redraws
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            charts.forEach(chart => {
                // Ensure chart instance is valid before resizing
                if (chart) chart.resize();
            });
        }, 250);
    });
});

async function loadRecentLogs() {
    const logsContainer = document.getElementById('recent-logs-content');
    if (!logsContainer) return;

    try {
        const response = await fetch('/api/admin/logs?limit=5'); // Fetch the 5 most recent logs
        if (!response.ok) {
            throw new Error('Failed to fetch logs');
        }
        const data = await response.json();

        if (data.logs && data.logs.length > 0) {
            logsContainer.innerHTML = ''; // Clear the "Loading..." message
            data.logs.forEach(log => {
                const logElement = document.createElement('p');
                const formattedDate = new Date(log.timestamp).toLocaleString();
                let levelClass = '';
                if (log.level === 'ERROR' || log.level === 'FATAL') levelClass = 'has-text-danger';
                if (log.level === 'WARN') levelClass = 'has-text-warning';

                logElement.innerHTML = `<strong class="${levelClass}">[${formattedDate}]</strong> ${log.message}`;
                logsContainer.appendChild(logElement);
            });
        } else {
            logsContainer.innerHTML = '<p>No recent system events found.</p>';
        }
    } catch (error) {
        console.error("Could not load recent logs:", error);
        logsContainer.innerHTML = '<p class="has-text-danger">Could not load recent system events.</p>';
    }
}

function initWeeklyTrendChart(data = []) {
    const canvas = document.getElementById('attendance-chart');
    if (!canvas) return null;

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const labels = days.map((day, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (d.getDay() - i + 7) % 7);
        return `${days[d.getDay()]} (${d.getMonth() + 1}/${d.getDate()})`;
    });

    const chartData = Array(7).fill(0);
    data.forEach(row => {
        chartData[row.day_of_week] = row.count;
    });

    return new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Students Present',
                data: chartData,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: { scales: { y: { beginAtZero: true } } }
    });
}

function initDailyRatioChart(present = 0, absent = 0, excused = 0) {
    const canvas = document.getElementById('ratio-chart');
    if (!canvas) return null;

    return new Chart(canvas.getContext('2d'), {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent', 'Excused'],
            datasets: [{
                label: 'Today\'s Ratio',
                data: [present, absent, excused],
                backgroundColor: [
                    'rgba(75, 192, 192, 0.6)',
                    'rgba(255, 99, 132, 0.6)',
                    'rgba(255, 206, 86, 0.6)'
                ],
                borderColor: [
                    'rgba(75, 192, 192, 1)',
                    'rgba(255, 99, 132, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                }
            }
        }
    });
}

function initMonthlyOverviewChart(data = []) {
    const canvas = document.getElementById('monthly-overview-chart');
    if (!canvas) return null;

    const labels = data.map(row => `Week ${parseInt(row.week.split('-')[1], 10) + 1}`);
    const presentData = data.map(row => row.present_count);
    const absentData = data.map(row => row.absent_count);
    const excusedData = data.map(row => row.excused_count);

    return new Chart(canvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total Presents',
                data: presentData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1
            }, {
                label: 'Total Absences',
                data: absentData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                fill: true,
                tension: 0.1
            }, {
                label: 'Total Excuses',
                data: excusedData,
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
                fill: true,
                tension: 0.1
            }]
        }
    });
}
