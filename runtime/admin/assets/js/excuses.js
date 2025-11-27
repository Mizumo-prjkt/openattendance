document.addEventListener('DOMContentLoaded', () => {
    console.log('Excuses page loaded.');

    const pendingTableBody = document.getElementById('pending-table-body');
    const approvedTableBody = document.getElementById('approved-table-body');
    const rejectedTableBody = document.getElementById('rejected-table-body');
    const tabs = document.querySelectorAll('.tabs li');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const detailModal = document.getElementById('excuse-detail-modal');

    let currentTab = 'pending';
    let allExcuses = [];

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            // Remove is-active class from all tabs and add to the clicked tab
            tabs.forEach(item => item.classList.remove('is-active'));
            tab.classList.add('is-active');
            // Hide all tab panes and show the selected tab pane
            tabPanes.forEach(pane => pane.style.display = pane.id === target ? 'block' : 'none');
            currentTab = target;
            loadExcuses(target);
        }); 
    });

    async function loadExcuses(status = null) {
        let tableBody;
        switch (status) {
            case 'approved':
                tableBody = approvedTableBody;
                break;
            case 'rejected':
                tableBody = rejectedTableBody;
                break;
            default:
                tableBody = pendingTableBody;
                break;
        } 

        tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered">Loading requests...</td></tr>`;

        try {
            const params = new URLSearchParams();
            // The API now expects 'pending', 'excused', or 'not_excused'
            if (status === 'approved') {
                params.append('status', 'excused');
            } else if (status === 'rejected') {
                params.append('status', 'not_excused');
            } else {
                params.append('status', 'pending');
            }
            const response = await fetch(`/api/admin/excuses?${params.toString()}`);
            if (!response.ok) throw new Error('Failed to fetch excuse requests.');
            const excuses = await response.json();
            allExcuses = excuses;
            renderExcuses(excuses, tableBody);
        } catch (error) {
            console.error('Error loading excuse requests:', error);
            tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-danger">Error loading requests.</td></tr>`;
        }
    }

    function renderExcuses(excuses, tableBody) {
        tableBody.innerHTML = '';
        if (excuses.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered">No requests found.</td></tr>`;
            return;
        }

        excuses.forEach(excuse => {
            const row = document.createElement('tr');
            let rowContent = `<td>${excuse.student_name} (${excuse.student_id})</td>`;

            if (currentTab === 'pending') {
                rowContent += `
                    <td>${new Date(excuse.request_datetime).toLocaleString()}</td>
                    <td>${excuse.reason.substring(0, 50)}${excuse.reason.length > 50 ? '...' : ''}</td>
                    <td>
                        <button class="button is-small is-success approve-btn" data-id="${excuse.excused_id}">Approve</button>
                        <button class="button is-small is-danger reject-btn" data-id="${excuse.excused_id}">Reject</button>
                        <button class="button is-small is-info view-btn" data-id="${excuse.excused_id}">View</button>
                    </td>`;
            } else {
                rowContent += `
                    <td>${new Date(excuse.request_datetime).toLocaleString()}</td>
                    <td>${new Date(excuse.verdict_datetime).toLocaleString()}</td>
                    <td>${excuse.processed_by || 'N/A'}</td>
                    <td><button class="button is-small is-info view-btn" data-id="${excuse.excused_id}">View</button></td>`;
            }
            row.innerHTML = rowContent;
            tableBody.appendChild(row);
        });
    }

    async function takeAction(excuseId, action) {
        try {
            const response = await fetch(`/api/admin/excuses/${excuseId}/${action}`, { method: 'POST' });
            if (!response.ok) throw new Error(`Failed to ${action} excuse request.`);
            const result = await response.json();
            alert(result.message);
            loadExcuses(currentTab); // Refresh current tab
        } catch (error) {
            alert(`Error ${action}ing excuse request: ${error.message}`);
        }
    }

    // --- Modal Control ---
    const closeModal = () => detailModal.classList.remove('is-active');
    detailModal.querySelector('.delete').addEventListener('click', closeModal);
    detailModal.querySelector('.modal-background').addEventListener('click', closeModal);

    // --- Event Delegation for all tables ---
    pendingTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const excuseId = target.dataset.id;

        if (target.classList.contains('approve-btn')) {
            takeAction(excuseId, 'approve');
        }
        if (target.classList.contains('reject-btn')) {
            takeAction(excuseId, 'reject');
        }
    });

    function openDetailModal(excuseId) {
        const excuse = allExcuses.find(e => e.excused_id == excuseId);
        if (excuse) {
            document.getElementById('detail-student-name').textContent = excuse.student_name;
            document.getElementById('detail-student-id').textContent = excuse.student_id;
            document.getElementById('detail-request-date').textContent = new Date(excuse.request_datetime).toLocaleString();
            document.getElementById('detail-reason').textContent = excuse.reason;

            const verdictDetails = document.getElementById('verdict-details');
            if (excuse.result) {
                document.getElementById('detail-verdict-status').textContent = excuse.result === 'excused' ? 'Approved' : 'Rejected';
                document.getElementById('detail-processed-by').textContent = excuse.processed_by || 'N/A';
                document.getElementById('detail-verdict-date').textContent = new Date(excuse.verdict_datetime).toLocaleString();
                verdictDetails.classList.remove('is-hidden');
            } else {
                verdictDetails.classList.add('is-hidden');
            }

            detailModal.classList.add('is-active');
        }
    }

    document.getElementById('tab-content').addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('view-btn')) {
            const excuseId = target.dataset.id;
            openDetailModal(excuseId);
        } else if (target.classList.contains('approve-btn')) {
            const excuseId = target.dataset.id;
            takeAction(excuseId, 'approve');
        } else if (target.classList.contains('reject-btn')) {
            const excuseId = target.dataset.id;
            takeAction(excuseId, 'reject');
        }
    });

    // bulmaSteps.attach();

    // Initial load
    loadExcuses(currentTab);
});
