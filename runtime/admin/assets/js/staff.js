document.addEventListener('DOMContentLoaded', () => {
    const tabs = document.querySelectorAll('.tabs li');
    const tabContent = document.querySelectorAll('.tab-pane');
    const addStaffModal = document.getElementById('add-staff-modal'); // For regular staff
    const addAdminModal = document.getElementById('add-admin-modal'); // For creating admins
    const editStaffModal = document.getElementById('edit-staff-modal'); // For editing staff
    const editAdminModal = document.getElementById('edit-admin-modal'); // For editing admins

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Deactivate all tabs and content panes
            tabs.forEach(item => item.classList.remove('is-active'));
            tabContent.forEach(pane => {
                pane.classList.remove('is-active');
                pane.style.display = 'none';
            });

            // Activate the clicked tab and its corresponding content
            const targetPaneId = tab.dataset.tab;
            const targetPane = document.getElementById(targetPaneId);
            tab.classList.add('is-active');
            if (targetPane) targetPane.style.display = 'block';
        });
    });

    // --- Staff Modal Logic ---
    const addStaffBtn = document.getElementById('add-staff-btn');
    const saveStaffBtn = document.getElementById('save-staff-btn');
    const cancelStaffBtn = document.getElementById('cancel-staff-btn');
    const staffModalCloseBtn = addStaffModal.querySelector('.delete');
    const staffModalBackground = addStaffModal.querySelector('.modal-background');

    const openStaffModal = () => addStaffModal.classList.add('is-active');
    const closeStaffModal = () => {
        addStaffModal.classList.remove('is-active');
        document.getElementById('add-staff-form').reset(); // Reset form on close
        document.getElementById('teacher-fields').style.display = 'none'; // Hide teacher fields
    };

    addStaffBtn.addEventListener('click', openStaffModal);
    cancelStaffBtn.addEventListener('click', closeStaffModal);
    staffModalCloseBtn.addEventListener('click', closeStaffModal);
    staffModalBackground.addEventListener('click', closeStaffModal);

    // --- Conditional Form Fields ---
    const staffTypeSelect = document.getElementById('new-staff-type');
    const teacherFields = document.getElementById('teacher-fields');

    staffTypeSelect.addEventListener('change', () => {
        if (staffTypeSelect.value === 'teacher') {
            teacherFields.style.display = 'block';
        } else {
            teacherFields.style.display = 'none';
        }
    });

    // Placeholder for save functionality
    saveStaffBtn.addEventListener('click', () => alert('Save functionality to be implemented.'));

    // --- Admin Modal Logic ---
    const addAdminBtn = document.getElementById('add-admin-btn');
    const saveAdminBtn = document.getElementById('save-admin-btn');
    const cancelAdminBtn = document.getElementById('cancel-admin-btn');
    const adminModalCloseBtn = addAdminModal.querySelector('.delete');
    const adminModalBackground = addAdminModal.querySelector('.modal-background');

    const openAdminModal = () => addAdminModal.classList.add('is-active');
    const closeAdminModal = () => {
        addAdminModal.classList.remove('is-active');
        document.getElementById('add-admin-form').reset(); // Reset form on close
    };

    addAdminBtn.addEventListener('click', openAdminModal);
    cancelAdminBtn.addEventListener('click', closeAdminModal);
    adminModalCloseBtn.addEventListener('click', closeAdminModal);
    adminModalBackground.addEventListener('click', closeAdminModal);

    // Placeholder for save functionality
    saveAdminBtn.addEventListener('click', () => alert('Save Admin functionality to be implemented.'));

    // --- Edit Modals Logic ---
    const tabContainer = document.getElementById('tab-content');

    // Close handler for all modals
    const setupModalClose = (modal) => {
        const closeBtn = modal.querySelector('.delete');
        const cancelBtn = modal.querySelector('.modal-card-foot .button:not(.is-success)');
        const background = modal.querySelector('.modal-background');
        const closeModal = () => {
            modal.classList.remove('is-active');
            const form = modal.querySelector('form');
            if (form) form.reset(); // Reset form on close
        };
        
        if(closeBtn) closeBtn.addEventListener('click', closeModal);
        if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
        if(background) background.addEventListener('click', closeModal);
    };

    setupModalClose(editStaffModal);
    setupModalClose(editAdminModal);

    // Event delegation for all "Edit" buttons
    tabContainer.addEventListener('click', (event) => {
        const target = event.target;

        // Handle Edit Staff Button
        if (target.classList.contains('edit-staff-btn')) {
            const row = target.closest('tr');
            const cells = row.querySelectorAll('td');
            const teacherFields = document.getElementById('edit-teacher-fields');
            const adviserUnitInput = document.getElementById('edit-adviser-unit');
            
            document.getElementById('edit-staff-original-id').value = cells[0].textContent;
            document.getElementById('edit-staff-id').value = cells[0].textContent;
            document.getElementById('edit-staff-name').value = cells[1].textContent;
            document.getElementById('edit-staff-email').value = cells[2].textContent;

            const activeTab = document.querySelector('.tabs li.is-active').dataset.tab;
            const staffType = activeTab.replace(/s$/, ''); // "teachers" -> "teacher"
            document.getElementById('edit-staff-type').value = staffType;

            // Show/hide and populate teacher-specific fields
            teacherFields.style.display = (staffType === 'teacher') ? 'block' : 'none';
            if (staffType === 'teacher') {
                adviserUnitInput.value = cells[3].textContent; // Assumes Adviser Unit is the 4th column
            }

            // Always clear password fields when opening the edit modal
            document.getElementById('edit-staff-password').value = '';
            document.getElementById('edit-staff-confirm-password').value = '';

            editStaffModal.classList.add('is-active');
        }

        // Handle Edit Admin Button
        if (target.classList.contains('edit-admin-btn')) {
            const row = target.closest('tr');
            const cells = row.querySelectorAll('td');

            document.getElementById('edit-admin-id').value = cells[0].textContent;
            document.getElementById('edit-admin-username').value = cells[1].textContent;
            document.getElementById('edit-admin-password').value = ''; // Clear password field

            editAdminModal.classList.add('is-active');
        }
    });

    document.getElementById('update-staff-btn').addEventListener('click', () => alert('Update Staff functionality to be implemented.'));
    document.getElementById('update-admin-btn').addEventListener('click', () => alert('Update Admin functionality to be implemented.'));
});
