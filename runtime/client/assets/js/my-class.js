document.addEventListener('DOMContentLoaded', async () => {
    const studentTableBody = document.getElementById('student-table-body');
    const classTitle = document.getElementById('class-title');
    const detailModal = document.getElementById('student-detail-modal');
    let allStudents = []; // Cache for student data

    async function loadMyClass() {
        try {
            const response = await fetch('/api/client/my-class-students');
            if (!response.ok) {
                const error = await response.json();
                // If the user is not a teacher, the API will return a 403 Forbidden error.
                if (response.status === 403) {
                    document.querySelector('.container.is-fluid').innerHTML = `
                        <div class="notification is-warning">
                            ${error.error || 'This feature is only available for teachers with an assigned advisory class.'}
                        </div>`;
                }
                throw new Error(error.error || 'Failed to load class data.');
            }
            allStudents = await response.json();
            renderStudentTable(allStudents);
        } catch (error) {
            console.error('Error loading class list:', error);
            if (studentTableBody) {
                studentTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered has-text-danger">${error.message}</td></tr>`;
            }
        }
    }

    function renderStudentTable(students) {
        if (!studentTableBody) return;
        studentTableBody.innerHTML = ''; // Clear loading state

        if (students.length === 0) {
            studentTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered">No students found in your advisory class.</td></tr>`;
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.dataset.studentId = student.id; // Use internal DB ID for clicks
            const fullName = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
            const profilePic = student.profile_image_path || 'https://bulma.io/images/placeholders/128x128.png';

            row.innerHTML = `
                <td><figure class="image is-48x48"><img src="${profilePic}" alt="Profile" class="is-rounded"></figure></td>
                <td>${student.student_id}</td>
                <td>${fullName}</td>
                <td>${student.classroom_section || 'N/A'}</td>
            `;
            studentTableBody.appendChild(row);
        });
    }

    async function loadStudentDetails(studentId) {
        try {
            const response = await fetch(`/api/client/students/${studentId}/attendance`);
            if (!response.ok) throw new Error('Failed to load student details.');
            const data = await response.json();

            // Populate tallies
            document.getElementById('tally-present').textContent = data.stats.present_count || 0;
            document.getElementById('tally-absent').textContent = data.stats.absent_count || 0;
            document.getElementById('tally-excused').textContent = data.stats.excused_count || 0;

            // Populate pending excuses
            renderPendingExcuses(data.excuses);

        } catch (error) {
            console.error('Error loading student details:', error);
        }
    }

    // --- Modal Control ---
    function openStudentModal(student) {
        if (!student) return;

        // Populate modal fields
        detailModal.dataset.studentId = student.student_id; // Store student_id for actions
        document.getElementById('modal-student-name').textContent = `${student.first_name} ${student.last_name}`;
        document.getElementById('modal-profile-image').src = student.profile_image_path || 'https://bulma.io/images/placeholders/128x128.png';
        document.getElementById('modal-student-id').textContent = student.student_id;
        document.getElementById('modal-phone').textContent = student.phone_number || 'N/A';
        document.getElementById('modal-address').textContent = student.address || 'N/A';
        document.getElementById('modal-emergency-name').textContent = student.emergency_contact_name || 'N/A';
        document.getElementById('modal-emergency-phone').textContent = student.emergency_contact_phone || 'N/A';
        document.getElementById('modal-emergency-relationship').textContent = student.emergency_contact_relationship || 'N/A';

        // Fetch and populate attendance data
        loadStudentDetails(student.student_id);

        detailModal.classList.add('is-active');
    }

    const closeModal = () => detailModal.classList.remove('is-active');
    detailModal.querySelector('.delete').addEventListener('click', closeModal);
    detailModal.querySelector('.modal-background').addEventListener('click', closeModal);

    // Handle clicks on student rows to open the modal
    studentTableBody.addEventListener('click', (event) => {
        const row = event.target.closest('tr');
        if (row && row.dataset.studentId) {
            const studentId = parseInt(row.dataset.studentId, 10);
            const student = allStudents.find(s => s.id === studentId);
            openStudentModal(student);
        }
    });

    // Handle tab switching inside the modal
    const modalTabs = detailModal.querySelectorAll('.tabs li');
    const modalTabPanes = detailModal.querySelectorAll('.tab-pane');
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and panes
            modalTabs.forEach(t => t.classList.remove('is-active'));
            modalTabPanes.forEach(p => p.style.display = 'none');

            // Activate the clicked tab and its pane
            tab.classList.add('is-active');
            const targetPaneId = tab.dataset.tab;
            const targetPane = document.getElementById(targetPaneId);
            if (targetPane) {
                targetPane.style.display = 'block';
            }
        });
    });

    // --- Excuse Management in Modal ---
    function renderPendingExcuses(excuses) {
        const container = document.getElementById('pending-excuses-container');
        container.innerHTML = '';
        if (excuses.length === 0) {
            container.innerHTML = '<p class="has-text-grey">No pending excuse requests for this student.</p>';
            return;
        }
        excuses.forEach(excuse => {
            const item = document.createElement('div');
            item.className = 'notification is-light';
            item.innerHTML = `
                <p><strong>Date:</strong> ${new Date(excuse.request_datetime).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> ${excuse.reason}</p>
                <div class="buttons is-right mt-2">
                    <button class="button is-small is-success approve-excuse-btn" data-excuse-id="${excuse.excused_id}">Approve</button>
                    <button class="button is-small is-danger reject-excuse-btn" data-excuse-id="${excuse.excused_id}">Reject</button>
                </div>
            `;
            container.appendChild(item);
        });
    }

    async function handleExcuseVerdict(excuseId, action) {
        try {
            const response = await fetch(`/api/client/excuses/${excuseId}/${action}`, { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            alert(result.message);
            // Refresh the details
            const studentId = detailModal.dataset.studentId;
            if (studentId) loadStudentDetails(studentId);
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    document.getElementById('pending-excuses-container').addEventListener('click', (event) => {
        const target = event.target;
        const excuseId = target.dataset.excuseId;
        if (!excuseId) return;

        if (target.classList.contains('approve-excuse-btn')) {
            handleExcuseVerdict(excuseId, 'approve');
        } else if (target.classList.contains('reject-excuse-btn')) {
            handleExcuseVerdict(excuseId, 'reject');
        }
    });

    async function submitNewExcuse(approveNow) {
        const payload = {
            student_id: detailModal.dataset.studentId,
            absence_date: document.getElementById('new-excuse-date').value,
            reason: document.getElementById('new-excuse-reason').value,
            approve_now: approveNow
        };

        try {
            const response = await fetch('/api/client/excuses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            alert(result.message);
            loadStudentDetails(payload.student_id); // Refresh
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    }

    document.getElementById('submit-new-excuse-btn').addEventListener('click', () => submitNewExcuse(true));
    document.getElementById('submit-for-review-btn').addEventListener('click', () => submitNewExcuse(false));

    loadMyClass();
});
