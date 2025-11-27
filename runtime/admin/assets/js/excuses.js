document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tabs li');
    const detailModal = document.getElementById('excuse-detail-modal');
    let allExcuses = {}; // Cache for details modal, keyed by status

    // --- Data Loading ---
    async function loadExcuses(status) {
        const tableId = `${status}-table-body`;
        const tableBody = document.getElementById(tableId);
        if (!tableBody) return;

        tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered">Loading requests...</td></tr>`;

        try {
            const apiStatus = status;
            const response = await fetch(`/api/admin/excuses?status=${apiStatus}`);
            if (!response.ok) throw new Error('Failed to fetch excuse requests.');
            
            const excuses = await response.json();
            allExcuses[status] = excuses; // Cache the data
            renderTable(status); // Render the data into the correct table
        } catch (error) {
            console.error(`Error loading ${status} excuses:`, error);
            tableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-danger">Error loading requests.</td></tr>`;
        }
    }

    function renderTable(status) {
        const tableBody = document.getElementById(`${status}-table-body`);
        const data = allExcuses[status] || [];
        tableBody.innerHTML = '';

        if (data.length === 0) {
            const cols = tableBody.closest('table').querySelector('thead tr').children.length;
            tableBody.innerHTML = `<tr><td colspan="${cols}" class="has-text-centered">No requests found.</td></tr>`;
            return;
        }

        data.forEach(excuse => {
            const row = document.createElement('tr');
            row.dataset.id = excuse.excused_id;

            let rowContent = `<td>${excuse.student_name || 'Unknown Student'} (${excuse.student_id})</td>`;
            rowContent += `<td>${new Date(excuse.request_datetime).toLocaleString()}</td>`;

            if (status === 'pending') { // For pending tab
                rowContent += `<td>${excuse.reason.substring(0, 50)}${excuse.reason.length > 50 ? '...' : ''}</td>`;
                rowContent += `<td>
                    <button class="button is-small is-success approve-btn" data-id="${excuse.excused_id}">Approve</button>
                    <button class="button is-small is-danger reject-btn" data-id="${excuse.excused_id}">Reject</button>
                    <button class="button is-small is-info view-btn" data-id="${excuse.excused_id}">View</button>
                </td>`;
            } else {
                rowContent += `<td>${new Date(excuse.verdict_datetime).toLocaleString()}</td>`; // For excused/rejected tabs
                rowContent += `<td>${excuse.processed_by || 'N/A'}</td>`;
                rowContent += `<td><button class="button is-small is-info view-btn" data-id="${excuse.excused_id}">View</button></td>`;
            }
            row.innerHTML = rowContent;
            tableBody.appendChild(row);
        });
    }

    // --- Actions ---
    async function takeAction(excuseId, action) {
        try {
            const apiAction = action === 'approve' ? 'approve' : 'reject';
            const response = await fetch(`/api/admin/excuses/${excuseId}/${apiAction}`, { method: 'POST' });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || `Failed to ${action} excuse request.`);
            }
            const result = await response.json();
            alert(result.message);
            // Refresh all tabs to move the item
            await loadExcuses('pending');
            await loadExcuses('excused');
            loadExcuses('rejected');
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    // --- Event Listeners ---
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            tabs.forEach(t => t.classList.remove('is-active'));
            document.querySelectorAll('.tab-pane').forEach(p => p.style.display = 'none');

            this.classList.add('is-active');
            const tabName = this.dataset.tab;
            const activePane = document.getElementById(tabName);
            if (activePane) { 
                activePane.style.display = 'block';
                // If data is not cached for this tab, load it. Otherwise, just render it.
                if (!allExcuses[tabName]) {
                    loadExcuses(tabName);
                } else {
                    renderTable(tabName);
                }
            }
        });
    });

    document.getElementById('tab-content').addEventListener('click', (event) => {
        const target = event.target;
        const excuseId = target.closest('tr')?.dataset.id;
        if (!excuseId) return;

        if (target.classList.contains('approve-btn')) {
            takeAction(excuseId, 'approve');
        } else if (target.classList.contains('reject-btn')) {
            takeAction(excuseId, 'reject');
        } else if (target.classList.contains('view-btn')) {
            const currentStatus = document.querySelector('.tabs li.is-active').dataset.tab;
            const excuse = (allExcuses[currentStatus] || []).find(e => e.excused_id == excuseId);
            if (excuse) openDetailModal(excuse);
        }
    });

    // --- Modal Control ---
    const closeModal = () => detailModal.classList.remove('is-active');
    detailModal.querySelectorAll('.delete, .modal-background').forEach(el => el.addEventListener('click', closeModal));

    function openDetailModal(excuse) {
        document.getElementById('detail-student-name').textContent = excuse.student_name || 'Unknown Student';
        document.getElementById('detail-student-id').textContent = excuse.student_id;
        document.getElementById('detail-requester-name').textContent = excuse.requester_name || 'Unknown Staff';
        document.getElementById('detail-request-date').textContent = new Date(excuse.request_datetime).toLocaleString();
        document.getElementById('detail-reason').textContent = excuse.reason;

        const verdictDetails = document.getElementById('verdict-details');
        const verdictStatusSpan = document.getElementById('detail-verdict-status');
        const stepItems = document.querySelectorAll('#excuse-steps .step-item');
        stepItems.forEach(item => item.classList.remove('is-active', 'is-completed'));

        // Correctly check for a final verdict vs. a pending state
        if (excuse.result === 'excused' || excuse.result === 'rejected') {
            // --- State: Approved or Rejected ---
            stepItems[0].classList.add('is-completed');
            stepItems[1].classList.add('is-completed');
            stepItems[2].classList.add('is-completed');

            // Reset colors and apply the correct one
            verdictStatusSpan.classList.remove('has-text-success', 'has-text-danger');
            if (excuse.result === 'excused') {
                verdictStatusSpan.textContent = 'Excused';
                verdictStatusSpan.classList.add('has-text-success');
            } else {
                verdictStatusSpan.textContent = 'Rejected';
                verdictStatusSpan.classList.add('has-text-danger');
            }

            document.getElementById('detail-processed-by').textContent = excuse.processed_by || 'N/A';
            document.getElementById('detail-verdict-date').textContent = new Date(excuse.verdict_datetime).toLocaleString();
            verdictDetails.classList.remove('is-hidden');
        } else {
            // --- State: Pending ---
            stepItems[0].classList.add('is-completed');
            stepItems[1].classList.add('is-active');
            verdictDetails.classList.add('is-hidden');
        }

        detailModal.classList.add('is-active');
    }

    // Initial load
    loadExcuses('pending');
});
