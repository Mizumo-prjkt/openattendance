document.addEventListener('DOMContentLoaded', () => {
    const filterBtn = document.getElementById('filter-btn');
    const tableBody = document.getElementById('attendance-table-body');
    const detailModal = document.getElementById('attendance-detail-modal');

    let allLogs = []; // Cache for details view
    async function loadAttendanceLogs() {
        const dateFrom = document.getElementById('date-from-filter').value;
        const dateTo = document.getElementById('date-to-filter').value;
        const status = document.getElementById('status-filter').value;
        const studentSearch = document.getElementById('student-search-filter').value;

        // Construct query parameters
        const params = new URLSearchParams();
        if (dateFrom) params.append('dateFrom', dateFrom);
        if (dateTo) params.append('dateTo', dateTo);
        if (status) params.append('status', status);
        if (studentSearch) params.append('studentSearch', studentSearch);

        // Show loading state
        tableBody.innerHTML = `<tr><td colspan="8" class="has-text-centered">Loading logs...</td></tr>`;

        try {
            const response = await fetch(`/api/admin/attendance-logs?${params.toString()}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to fetch attendance logs.');
            }
            const logs = await response.json();
            allLogs = logs; // Cache the logs
            renderLogs(logs);
        } catch (error) {
            console.error('Error loading attendance logs:', error);
            tableBody.innerHTML = `<tr><td colspan="8" class="has-text-centered has-text-danger">Error loading logs: ${error.message}</td></tr>`;
        }
    }

    function renderLogs(logs) {
        tableBody.innerHTML = ''; // Clear existing rows

        if (logs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" class="has-text-centered">No attendance records found for the selected filters.</td></tr>`;
            return;
        }

        logs.forEach(log => {
            const row = document.createElement('tr');

            let statusTagClass = '';
            switch (log.status) {
                case 'Present':
                    statusTagClass = 'is-success';
                    break;
                case 'Absent':
                    statusTagClass = 'is-danger';
                    break;
                case 'Excused':
                    statusTagClass = 'is-warning';
                    break;
            }

            row.innerHTML = `
                <td>${log.log_date}</td>
                <td>${log.student_id}</td>
                <td>${log.student_name}</td>
                <td><span class="tag ${statusTagClass}">${log.status}</span></td>
                <td>${log.time_in || '-'}</td>
                <td>${log.time_out || '-'}</td>
                <td>${log.logged_by || 'System'}</td>
                <td><button class="button is-small is-info view-btn" data-log-id="${log.log_id}">View</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Modal Control ---
    const closeModal = () => detailModal.classList.remove('is-active');
    detailModal.querySelector('.delete').addEventListener('click', closeModal);
    detailModal.querySelector('.modal-background').addEventListener('click', closeModal);

    // --- Event Listeners ---
    filterBtn.addEventListener('click', loadAttendanceLogs);

    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-btn')) {
            const logId = event.target.dataset.logId;
            const logData = allLogs.find(log => log.log_id === logId);

            if (logData) {
                document.getElementById('detail-student-name').textContent = logData.student_name;
                document.getElementById('detail-student-id').textContent = logData.student_id;
                document.getElementById('detail-log-date').textContent = logData.log_date;
                document.getElementById('detail-status').textContent = logData.status;
                document.getElementById('detail-time-in').textContent = logData.time_in || 'N/A';
                document.getElementById('detail-time-out').textContent = logData.time_out || 'N/A';
                document.getElementById('detail-logged-by').textContent = logData.logged_by || 'System';

                const reasonContainer = document.getElementById('detail-reason-container');
                const reasonSpan = document.getElementById('detail-reason');

                if (logData.status === 'Absent' || logData.status === 'Excused') {
                    reasonSpan.textContent = logData.reason || 'No reason provided.';
                    reasonContainer.classList.remove('is-hidden');
                } else {
                    reasonContainer.classList.add('is-hidden');
                }

                detailModal.classList.add('is-active');
            }
        }
    });

    // Initial load on page render
    loadAttendanceLogs();
});
