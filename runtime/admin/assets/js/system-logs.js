document.addEventListener('DOMContentLoaded', () => {
    const tableBody = document.getElementById('logs-table-body');
    const paginationContainer = document.querySelector('.pagination');
    const filterBtn = document.getElementById('filter-logs-btn');
    const clearLogsBtn = document.getElementById('clear-logs-btn');
    const detailModal = document.getElementById('log-detail-modal');

    let cachedLogs = []; // To store logs for the current page view

    /**
     * Fetches logs from the API based on filters and page number.
     * @param {number} page The page number to fetch.
     */
    async function loadLogs(page = 1) {
        const level = document.getElementById('level-filter').value;
        const source = document.getElementById('source-filter').value;

        const params = new URLSearchParams({ page });
        if (level) params.append('level', level);
        if (source) params.append('source', source);

        tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered">Loading logs...</td></tr>`;

        try {
            const response = await fetch(`/api/admin/logs?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch logs.');
            
            const data = await response.json();
            cachedLogs = data.logs; // Cache for detail view
            renderLogs(data.logs);
            renderPagination(data.pagination);
        } catch (error) {
            console.error('Error loading logs:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-danger">Error loading logs.</td></tr>`;
        }
    }

    /**
     * Renders the log data into the table.
     * @param {Array} logs An array of log objects.
     */
    function renderLogs(logs) {
        tableBody.innerHTML = '';
        if (logs.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered">No logs found.</td></tr>`;
            return;
        }

        logs.forEach(log => {
            const row = document.createElement('tr');
            let levelClass = '';
            switch (log.level) {
                case 'ERROR':
                case 'FATAL':
                    levelClass = 'is-danger'; break;
                case 'WARN':
                    levelClass = 'is-warning'; break;
                case 'INFO':
                    levelClass = 'is-info'; break;
                case 'DEBUG':
                    levelClass = 'is-light'; break;
            }

            const shortMessage = log.message.length > 80 ? log.message.substring(0, 80) + '...' : log.message;

            row.innerHTML = `
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><span class="tag ${levelClass}">${log.level}</span></td>
                <td>${log.source || 'N/A'}</td>
                <td>${shortMessage}</td>
                <td><button class="button is-small is-info view-log-btn" data-log-id="${log.log_id}">View</button></td>
            `;
            tableBody.appendChild(row);
        });
    }

    /**
     * Renders the pagination controls.
     * @param {object} pagination The pagination object from the API.
     */
    function renderPagination({ currentPage, totalPages }) {
        paginationContainer.innerHTML = ''; // Clear existing pagination

        const prevButton = document.createElement('a');
        prevButton.className = 'pagination-previous';
        prevButton.textContent = 'Previous';
        if (currentPage === 1) prevButton.disabled = true;
        prevButton.addEventListener('click', () => loadLogs(currentPage - 1));

        const nextButton = document.createElement('a');
        nextButton.className = 'pagination-next';
        nextButton.textContent = 'Next page';
        if (currentPage === totalPages) nextButton.disabled = true;
        nextButton.addEventListener('click', () => loadLogs(currentPage + 1));

        const ul = document.createElement('ul');
        ul.className = 'pagination-list';

        // Simple pagination display logic
        for (let i = 1; i <= totalPages; i++) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.className = 'pagination-link';
            a.textContent = i;
            a.setAttribute('aria-label', `Goto page ${i}`);
            if (i === currentPage) {
                a.classList.add('is-current');
                a.setAttribute('aria-current', 'page');
            }
            a.addEventListener('click', () => loadLogs(i));
            li.appendChild(a);
            ul.appendChild(li);
        }

        paginationContainer.append(prevButton, nextButton, ul);
    }

    // --- Modal Control ---
    const closeModal = () => detailModal.classList.remove('is-active');
    detailModal.querySelector('.delete').addEventListener('click', closeModal);
    detailModal.querySelector('.modal-background').addEventListener('click', closeModal);

    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('view-log-btn')) {
            const logId = parseInt(event.target.dataset.logId, 10);
            const log = cachedLogs.find(l => l.log_id === logId);
            if (log) {
                document.getElementById('detail-timestamp').textContent = new Date(log.timestamp).toLocaleString();
                document.getElementById('detail-level').textContent = log.level;
                document.getElementById('detail-source').textContent = log.source || 'N/A';
                document.getElementById('detail-message').textContent = log.message;

                const extraContainer = document.getElementById('detail-extra-container');
                if (log.details) {
                    document.getElementById('detail-extra').textContent = log.details;
                    extraContainer.classList.remove('is-hidden');
                } else {
                    extraContainer.classList.add('is-hidden');
                }
                detailModal.classList.add('is-active');
            }
        }
    });

    // --- Event Listeners ---
    filterBtn.addEventListener('click', () => loadLogs(1));

    clearLogsBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to delete ALL system logs? This action cannot be undone.')) {
            try {
                const response = await fetch('/api/admin/logs', { method: 'DELETE' });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                alert(result.message);
                loadLogs(1); // Refresh the view
            } catch (error) {
                alert(`Error clearing logs: ${error.message}`);
            }
        }
    });

    // Initial load
    loadLogs(1);
});
