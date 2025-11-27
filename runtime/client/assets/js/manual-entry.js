document.addEventListener('DOMContentLoaded', async () => {
    const searchInput = document.getElementById('student-search-input');
    const classroomFilter = document.getElementById('classroom-filter');
    const searchBtn = document.getElementById('search-btn');
    const resultsTableBody = document.getElementById('results-table-body');
    const detailModal = document.getElementById('student-detail-modal');
    let searchResults = []; // Cache for modal

    // --- Initial Data Population ---
    async function populateClassroomFilter() {
        try {
            const response = await fetch('/api/client/classrooms');
            if (!response.ok) throw new Error('Failed to load classrooms.');
            const classrooms = await response.json();
            classrooms.forEach(classroom => {
                const option = document.createElement('option');
                option.value = classroom;
                option.textContent = classroom;
                classroomFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error populating classroom filter:', error);
        }
    }

    // --- Search and Rendering ---
    async function performSearch() {
        const term = searchInput.value;
        const classroom = classroomFilter.value;

        if (!term && !classroom) {
            alert('Please enter a search term or select a classroom to begin.');
            return;
        }

        searchBtn.classList.add('is-loading');
        resultsTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered">Searching...</td></tr>`;

        const params = new URLSearchParams({ term, classroom });

        try {
            const response = await fetch(`/api/client/students/search?${params.toString()}`);
            if (!response.ok) throw new Error('Search request failed.');
            searchResults = await response.json();
            renderResults(searchResults);
        } catch (error) {
            console.error('Search error:', error);
            resultsTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered has-text-danger">Error performing search.</td></tr>`;
        } finally {
            searchBtn.classList.remove('is-loading');
        }
    }

    function renderResults(students) {
        resultsTableBody.innerHTML = '';
        if (students.length === 0) {
            resultsTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered">No students found matching your criteria.</td></tr>`;
            return;
        }

        students.forEach(student => {
            const row = document.createElement('tr');
            row.dataset.studentId = student.id;
            const fullName = `${student.last_name || ''}, ${student.first_name || ''}`.trim();
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${fullName}</td>
                <td>${student.classroom_section || 'N/A'}</td>
                <td><button class="button is-small is-link view-details-btn" data-id="${student.id}">View Details</button></td>
            `;
            resultsTableBody.appendChild(row);
        });
    }

    function renderPendingExcuses(excuses) {
        const container = document.getElementById('modal-pending-excuses-container');
        container.innerHTML = '';
        if (!excuses || excuses.length === 0) {
            container.innerHTML = '<p class="has-text-grey">No pending excuse requests for this student.</p>';
            return;
        }
        excuses.forEach(excuse => {
            const item = document.createElement('div');
            item.className = 'notification is-light';
            // Note: No action buttons are included here, as this is a read-only view.
            item.innerHTML = `
                <p><strong>Date of Absence:</strong> ${new Date(excuse.request_datetime).toLocaleDateString()}</p>
                <p><strong>Reason:</strong> ${excuse.reason}</p>
                <p><strong>Status:</strong> <span class="tag is-warning">${excuse.result}</span></p>
            `;
            container.appendChild(item);
        });
    }

    async function loadStudentDetails(studentId) {
        try {
            const response = await fetch(`/api/client/students/${studentId}/attendance`);
            if (!response.ok) throw new Error('Failed to load student attendance stats.');
            const data = await response.json();

            // Populate tallies
            document.getElementById('tally-present').textContent = data.stats.present_count || 0;
            document.getElementById('tally-absent').textContent = data.stats.absent_count || 0;
            document.getElementById('tally-excused').textContent = data.stats.excused_count || 0;

            // Populate pending excuses
            renderPendingExcuses(data.excuses);

        } catch (error) {
            console.error('Error loading student details:', error);
            // If it fails, the tallies will just remain at 0, which is a safe fallback.
        }
    }

    // --- Modal Control (Reused Logic) ---
    function openStudentModal(student) {
        if (!student) return;
        document.getElementById('modal-student-name').textContent = `${student.first_name} ${student.last_name}`;
        document.getElementById('modal-profile-image').src = student.profile_image_path || 'https://bulma.io/images/placeholders/128x128.png';
        document.getElementById('modal-student-id').textContent = student.student_id;
        document.getElementById('modal-phone').textContent = student.phone_number || 'N/A';
        document.getElementById('modal-address').textContent = student.address || 'N/A';
        document.getElementById('modal-emergency-name').textContent = student.emergency_contact_name || 'N/A';
        document.getElementById('modal-emergency-phone').textContent = student.emergency_contact_phone || 'N/A';
        document.getElementById('modal-emergency-relationship').textContent = student.emergency_contact_relationship || 'N/A';
        
        // Reset tallies before loading new ones
        document.getElementById('tally-present').textContent = '0';
        document.getElementById('tally-absent').textContent = '0';
        document.getElementById('tally-excused').textContent = '0';
        
        // Reset excuses tab
        document.getElementById('modal-pending-excuses-container').innerHTML = '<p class="has-text-grey">Loading pending requests...</p>';

        // Fetch and populate the attendance stats
        loadStudentDetails(student.student_id);

        detailModal.classList.add('is-active');
    }

    const closeModal = () => detailModal.classList.remove('is-active');
    detailModal.querySelector('.delete').addEventListener('click', closeModal);
    detailModal.querySelector('.modal-background').addEventListener('click', closeModal);

    // --- Event Listeners ---
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    resultsTableBody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('view-details-btn')) {
            const studentId = parseInt(target.dataset.id, 10);
            const student = searchResults.find(s => s.id === studentId);
            openStudentModal(student);
        }
    });

    // Tab switching for the modal
    const modalTabs = detailModal.querySelectorAll('.tabs li');
    const modalTabPanes = detailModal.querySelectorAll('.tab-pane');
    modalTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modalTabs.forEach(t => t.classList.remove('is-active'));
            modalTabPanes.forEach(p => p.style.display = 'none');
            tab.classList.add('is-active');
            const targetPane = document.getElementById(tab.dataset.tab);
            if (targetPane) targetPane.style.display = 'block';
        });
    });

    // --- Initial Load ---
    populateClassroomFilter();
});
