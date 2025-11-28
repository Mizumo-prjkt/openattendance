// Use a custom event listener to wait for components.js to finish loading the sidebar
document.addEventListener('componentsLoaded', async () => {
    const tabs = document.querySelectorAll('.tabs li');
    const tabContent = document.querySelectorAll('.tab-pane');
    const addStaffModal = document.getElementById('add-staff-modal'); // For regular staff
    const addAdminModal = document.getElementById('add-admin-modal'); // For creating admins
    const editStaffModal = document.getElementById('edit-staff-modal'); // For editing staff
    const cropperModal = document.getElementById('cropper-modal');
    const editAdminModal = document.getElementById('edit-admin-modal'); // For editing admins

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetPaneId = tab.dataset.tab;

            // Deactivate all tabs and content panes
            tabs.forEach(item => item.classList.remove('is-active'));
            tabContent.forEach(pane => {
                pane.classList.remove('is-active');
                pane.style.display = 'none';
            });

            // Activate the clicked tab and its corresponding content
            const targetPane = document.getElementById(targetPaneId);
            tab.classList.add('is-active');
            if (targetPane) {
                targetPane.style.display = 'block';
            }
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
        document.getElementById('new-staff-profile-image').value = '';
        document.getElementById('teacher-fields').style.display = 'none'; // Hide teacher fields
    };

    addStaffBtn.addEventListener('click', openStaffModal);
    cancelStaffBtn.addEventListener('click', closeStaffModal);
    staffModalCloseBtn.addEventListener('click', closeStaffModal);
    staffModalBackground.addEventListener('click', closeStaffModal);

    // Cropper modal close logic
    cropperModal.querySelector('.delete').addEventListener('click', () => cropperModal.classList.remove('is-active'));
    cropperModal.querySelector('.modal-background').addEventListener('click', () => cropperModal.classList.remove('is-active'));

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

    // Save new staff account
    saveStaffBtn.addEventListener('click', async () => {
        const formData = new FormData();
        formData.append('staff_id', document.getElementById('new-staff-id').value);
        formData.append('name', document.getElementById('new-staff-name').value);
        formData.append('email_address', document.getElementById('new-staff-email').value);
        formData.append('staff_type', document.getElementById('new-staff-type').value);
        formData.append('adviser_unit', document.getElementById('new-adviser-unit').value);
        formData.append('username', document.getElementById('new-staff-username').value);
        formData.append('password', document.getElementById('new-staff-password').value);
        
        const imageFile = document.getElementById('new-staff-profile-image').files[0];
        if (imageFile) {
            formData.append('profile_image', imageFile);
        }

        try {
            const response = await fetch('/api/admin/staff', {
                method: 'POST',
                body: formData, // FormData sets the correct multipart header automatically
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            alert('Staff account created successfully!');
            closeStaffModal();
            loadAllAccounts(); // Reload all data
        } catch (error) {
            alert(`Error creating staff account: ${error.message}`);
        }
    });

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

    // Save new admin account
    saveAdminBtn.addEventListener('click', async () => {
        const username = document.getElementById('new-admin-username').value;
        const password = document.getElementById('new-admin-password').value;
        const confirmPassword = document.getElementById('new-admin-confirm-password').value;

        if (password !== confirmPassword) {
            return alert('Passwords do not match.');
        }

        try {
            const response = await fetch('/api/admin/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, privilege: 'admin' }),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            
            alert('Admin account created successfully!');
            closeAdminModal();
            loadAllAccounts(); // Reload all data
        } catch (error) {
            alert(`Error creating admin account: ${error.message}`);
        }
    });

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
            if (modal.id === 'edit-staff-modal') document.getElementById('edit-staff-profile-image').value = '';
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
        const row = target.closest('tr'); // Get the closest table row
        if (!row) return; // If no row, not an edit/delete button

        // Handle Edit Staff Button
        if (target.classList.contains('edit-staff-btn')) {
            const cells = row.querySelectorAll('td'); // Use the 'row' from the top of the listener
            const teacherFields = document.getElementById('edit-teacher-fields');
            const adviserUnitInput = document.getElementById('edit-adviser-unit');
            
            document.getElementById('edit-staff-db-id').value = target.dataset.id; // The database ID
            document.getElementById('edit-staff-id').value = cells[0].textContent; // Staff ID from table
            document.getElementById('edit-staff-name').value = cells[1].textContent; // Name from table
            document.getElementById('edit-staff-email').value = cells[2].textContent; // Email from table

            const staffType = row.dataset.staffType; // Get staff type from data attribute on row
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
            const cells = row.querySelectorAll('td');

            document.getElementById('edit-admin-id').value = target.dataset.id;
            document.getElementById('edit-admin-username').value = cells[1].textContent;
            document.getElementById('edit-admin-password').value = ''; // Clear password field

            editAdminModal.classList.add('is-active');
        }
    });

// Update staff account logic
    document.getElementById('update-staff-btn').addEventListener('click', async () => {
        const id = document.getElementById('edit-staff-db-id').value;
        const formData = new FormData();

        formData.append('staff_id', document.getElementById('edit-staff-id').value);
        formData.append('name', document.getElementById('edit-staff-name').value);
        formData.append('email_address', document.getElementById('edit-staff-email').value);
        formData.append('adviser_unit', document.getElementById('edit-adviser-unit').value);

        const password = document.getElementById('edit-staff-password').value;
        const confirmPassword = document.getElementById('edit-staff-confirm-password').value;
        if (password && password !== confirmPassword) {
            return alert('New passwords do not match.');
        }
        if (password) formData.append('password', password);

        const imageFile = document.getElementById('edit-staff-profile-image').files[0];
        if (imageFile) formData.append('profile_image', imageFile);

        try {
            const response = await fetch(`/api/admin/staff/${id}`, {
                method: 'PUT',
                body: formData,
            });
            if (!response.ok) throw new Error((await response.json()).error);
            alert('Staff account updated successfully!');
            editStaffModal.classList.remove('is-active');
            loadAllAccounts(); // Reload data to reflect changes
        } catch (error) {
            alert(`Error updating staff account: ${error.message}`);
        }
    });

    // Update admin account logic
    document.getElementById('update-admin-btn').addEventListener('click', async () => {
        const id = document.getElementById('edit-admin-id').value;
        const username = document.getElementById('edit-admin-username').value;
        const password = document.getElementById('edit-admin-password').value;

        const body = { username };
        if (password) {
            body.password = password; // Only send password if provided
        }

        try {
            const response = await fetch(`/api/admin/accounts/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            if (!response.ok) throw new Error((await response.json()).error);
            alert('Admin account updated successfully!');
            editAdminModal.classList.remove('is-active');
            loadAllAccounts(); // Reload data to reflect changes
        } catch (error) {
            alert(`Error updating admin: ${error.message}`);
        }
    });

    // --- Data Loading and Rendering ---
    async function loadAllAccounts() {
        try {
            // Fetch both staff and admin data concurrently
            const [staffRes, adminsRes] = await Promise.all([
                fetch('/api/admin/staff'),
                fetch('/api/admin/accounts')
            ]);

            // Check if both responses were successful
            if (!staffRes.ok || !adminsRes.ok) {
                throw new Error('Failed to fetch account data from server.');
            }

            const staff = await staffRes.json();
            const admins = await adminsRes.json();

            renderTables(staff, admins); // Render the fetched data into the tables

        } catch (error) {
            console.error('Failed to load accounts:', error);
            // Display an error message in all tables if data loading fails
            document.querySelectorAll('#tab-content tbody').forEach(tbody => {
                tbody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-danger">Failed to load data.</td></tr>`;
            });
        }
    }

    function renderTables(staff, admins) {
        // Map table body elements for easy access
        const tables = {
            teachers: document.querySelector('#teachers tbody'),
            'student-council': document.querySelector('#student-council tbody'),
            security: document.querySelector('#security tbody'),
            admins: document.querySelector('#admins tbody'),
        };

        // Clear existing content from all tables
        Object.values(tables).forEach(tbody => { tbody.innerHTML = ''; });

        // Populate staff tables (Teachers, Student Council, Security)
        staff.forEach(s => {
            // Determine which tab this staff member belongs to
            const tableKey = s.staff_type === 'teacher' ? 'teachers' : (s.staff_type === 'student_council' ? 'student-council' : 'security');
            const tbody = tables[tableKey];
            if (tbody) {
                const row = document.createElement('tr');
                row.dataset.staffType = s.staff_type; // Store staff_type on the row for edit modal
                row.innerHTML = `
                    <td>${s.staff_id}</td>
                    <td>${s.name}</td>
                    <td>${s.email_address || 'N/A'}</td>
                    <td>${s.adviser_unit || 'N/A'}</td>
                    <td>
                        <button class="button is-small is-info edit-staff-btn" data-id="${s.id}">Edit</button>
                        <button class="button is-small is-danger delete-staff-btn" data-id="${s.id}">Delete</button>
                    </td>
                `;
                tbody.appendChild(row);
            }
        });

        // Populate admin table
        admins.forEach(admin => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${admin.admin_id}</td>
                <td>${admin.username}</td>
                <td>${admin.privilege}</td>
                <td>
                    <button class="button is-small is-info edit-admin-btn" data-id="${admin.admin_id}">Edit</button>
                    <button class="button is-small is-danger delete-admin-btn" data-id="${admin.admin_id}" ${admin.privilege === 'superadmin' ? 'disabled' : ''}>Delete</button>
                </td>
            `;
            tables.admins.appendChild(row);
        });

        // Display "No accounts found" message if any table is empty
        Object.values(tables).forEach(tbody => {
            if (tbody.children.length === 0) {
                // Get the number of columns from the table header to correctly span the message
                const cols = tbody.closest('table').querySelector('thead tr').children.length;
                tbody.innerHTML = `<tr><td colspan="${cols}" class="has-text-centered">No accounts found.</td></tr>`;
            }
        });
    }

    // --- Delete Logic ---
    tabContainer.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id; // Get the database ID from the button's data-id attribute

        if (target.classList.contains('delete-staff-btn')) {
            if (confirm(`Are you sure you want to delete staff account with ID ${id}? This cannot be undone.`)) {
                try {
                    const response = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error((await response.json()).error);
                    alert('Staff account deleted.');
                    loadAllAccounts(); // Reload data after deletion
                } catch (error) {
                    alert(`Error deleting staff: ${error.message}`);
                }
            }
        }

        if (target.classList.contains('delete-admin-btn')) {
            if (confirm(`Are you sure you want to delete admin account with ID ${id}?`)) {
                try {
                    const response = await fetch(`/api/admin/accounts/${id}`, { method: 'DELETE' });
                    if (!response.ok) throw new Error((await response.json()).error);
                    alert('Admin account deleted.');
                    loadAllAccounts(); // Reload data after deletion
                } catch (error) {
                    alert(`Error deleting admin: ${error.message}`);
                }
            }
        }
    });

    // --- Cropper.js Logic ---
    let activeImageInput = null; // To track which input triggered the cropper

    const setupCropperListener = (inputId) => {
        const imageInput = document.getElementById(inputId);
        imageInput.addEventListener('change', (e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                activeImageInput = imageInput; // Set the active input
                const reader = new FileReader();
                reader.onload = () => {
                    document.getElementById('cropper-image-element').src = reader.result;
                    cropperModal.classList.add('is-active');
                };
                reader.readAsDataURL(files[0]);
            }
        });
    };

    setupCropperListener('new-staff-profile-image');
    setupCropperListener('edit-staff-profile-image');

    document.getElementById('apply-crop-btn').addEventListener('click', async () => {
        const cropperSelectionElement = document.getElementById('cropper-selection-element');
        if (cropperSelectionElement && activeImageInput) {
            const canvas = await cropperSelectionElement.$toCanvas({ width: 512, height: 512 });
            canvas.toBlob((blob) => {
                const file = new File([blob], "cropped_staff_image.png", { type: 'image/png' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                activeImageInput.files = dataTransfer.files; // Set the cropped file to the correct input
                cropperModal.classList.remove('is-active');
            }, 'image/png');
        }
    });

    document.getElementById('cancel-crop-btn').addEventListener('click', () => {
        if (activeImageInput) activeImageInput.value = ''; // Clear the file input
        cropperModal.classList.remove('is-active');
    });

    // Initial data load when the page first loads
    loadAllAccounts()
});
