document.addEventListener('DOMContentLoaded', async () => {
    const studentModal = document.getElementById('student-modal');
    const studentInfoModal = document.getElementById('student-info-modal');
    const cropperModal = document.getElementById('cropper-modal');
    const studentsTableBody = document.getElementById('students-table-body');
    const searchInput = document.getElementById('search-student-input');
    let allStudents = []; // Cache for student data to enable client-side search
    let cropper = null;

    // --- Modal Control ---
    const openModal = (modal) => modal.classList.add('is-active');
    const closeModal = () => {
        studentModal.classList.remove('is-active');
        studentInfoModal.classList.remove('is-active');
        cropperModal.classList.remove('is-active');
        document.getElementById('student-form').reset();
    };

    document.getElementById('register-student-btn').addEventListener('click', () => {
        document.getElementById('student-modal-title').textContent = 'Register New Student';
        document.getElementById('student-db-id').value = ''; // Ensure ID is clear for creation
        openModal(studentModal);
    });

    studentModal.querySelector('.delete').addEventListener('click', closeModal);
    studentModal.querySelector('.modal-background').addEventListener('click', closeModal);
    document.getElementById('cancel-student-btn').addEventListener('click', closeModal);

    cropperModal.querySelector('.delete').addEventListener('click', closeModal);
    document.getElementById('cancel-crop-btn').addEventListener('click', closeModal);

    studentInfoModal.querySelector('.delete').addEventListener('click', closeModal);
    studentInfoModal.querySelector('.modal-background').addEventListener('click', closeModal);

    // --- Data Loading and Rendering ---
    async function loadStudents() {
        try {
            const response = await fetch('/api/admin/students');
            if (!response.ok) throw new Error('Failed to fetch student data.');
            allStudents = await response.json();
            renderStudents(allStudents);
        } catch (error) {
            console.error('Error loading students:', error);
            studentsTableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-danger">Error loading student records.</td></tr>`;
        }
    }

    function renderStudents(students) {
        studentsTableBody.innerHTML = ''; // Clear existing rows
        if (students.length === 0) {
            studentsTableBody.innerHTML = `<tr><td colspan="6" class="has-text-centered">No student records found.</td></tr>`;
            return;
        }

        students.forEach(student => {
            const fullName = [student.last_name, student.first_name, student.middle_name].filter(Boolean).join(', ');
            const emergencyContact = student.emergency_contact_name ? `${student.emergency_contact_name} (${student.emergency_contact_phone || 'N/A'})` : 'N/A';

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${student.student_id}</td>
                <td>${fullName}</td>
                <td>${student.classroom_section || 'N/A'}</td>
                <td>${student.phone_number || 'N/A'}</td>
                <td>${emergencyContact}</td>
                <td>
                    <button class="button is-small is-link view-btn" data-id="${student.id}">View</button>
                    <button class="button is-small is-info edit-btn" data-id="${student.id}">Edit</button>
                    <button class="button is-small is-danger delete-btn" data-id="${student.id}">Delete</button>
                </td>
            `;
            studentsTableBody.appendChild(row);
        });
    }

    // --- CRUD Operations ---

    // Save (Create or Update)
    document.getElementById('save-student-btn').addEventListener('click', async () => {
        const dbId = document.getElementById('student-db-id').value;
        const isUpdating = !!dbId;

        const formData = new FormData();
        formData.append('student_id', document.getElementById('student-id').value);
        formData.append('first_name', document.getElementById('student-first-name').value);
        formData.append('middle_name', document.getElementById('student-middle-name').value);
        formData.append('last_name', document.getElementById('student-last-name').value);
        formData.append('classroom_section', document.getElementById('student-classroom-section').value);
        formData.append('phone_number', document.getElementById('student-phone').value);
        formData.append('address', document.getElementById('student-address').value);
        formData.append('emergency_contact_name', document.getElementById('emergency-name').value);
        formData.append('emergency_contact_phone', document.getElementById('emergency-phone').value);
        formData.append('emergency_contact_relationship', document.getElementById('emergency-relationship').value);

        // If a new image was cropped, use it. Otherwise, multer will just get no file.
        const imageFile = document.getElementById('student-profile-image').files[0];
        if (imageFile) formData.append('profile_image', imageFile);

        const url = isUpdating ? `/api/admin/students/${dbId}` : '/api/admin/students';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                body: formData,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            alert(`Student record ${isUpdating ? 'updated' : 'created'} successfully!`);
            closeModal();
            loadStudents(); // Refresh the table
        } catch (error) {
            alert(`Error saving student record: ${error.message}`);
        }
    });

    // Edit and Delete (using event delegation)
    studentsTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;

        // Handle View
        if (target.classList.contains('view-btn')) {
            const student = allStudents.find(s => s.id == id);
            if (student) {
                document.getElementById('info-full-name').textContent = [student.last_name, student.first_name, student.middle_name].filter(Boolean).join(', ');
                document.getElementById('info-student-id').textContent = student.student_id;
                document.getElementById('info-classroom-section').textContent = student.classroom_section || 'No section assigned';
                document.getElementById('info-phone').textContent = student.phone_number || 'N/A';
                document.getElementById('info-address').textContent = student.address || 'N/A';
                document.getElementById('info-emergency-name').textContent = student.emergency_contact_name || 'N/A';
                document.getElementById('info-emergency-phone').textContent = student.emergency_contact_phone || 'N/A';
                document.getElementById('info-emergency-relationship').textContent = student.emergency_contact_relationship || 'N/A';
                const profileImage = document.getElementById('info-profile-image');
                profileImage.src = student.profile_image_path || 'https://bulma.io/images/placeholders/128x128.png';
                openModal(studentInfoModal);
            }
        }

        // Handle Edit
        if (target.classList.contains('edit-btn')) {
            const student = allStudents.find(s => s.id == id);
            if (student) {
                document.getElementById('student-modal-title').textContent = 'Edit Student Record';
                document.getElementById('student-db-id').value = student.id;
                document.getElementById('student-id').value = student.student_id;
                document.getElementById('student-first-name').value = student.first_name;
                document.getElementById('student-middle-name').value = student.middle_name;
                document.getElementById('student-last-name').value = student.last_name;
                document.getElementById('student-classroom-section').value = student.classroom_section;
                document.getElementById('student-phone').value = student.phone_number;
                document.getElementById('student-address').value = student.address;
                document.getElementById('emergency-name').value = student.emergency_contact_name;
                document.getElementById('emergency-phone').value = student.emergency_contact_phone;
                document.getElementById('emergency-relationship').value = student.emergency_contact_relationship;
                openModal(studentModal);
            }
        }

        // Handle Delete
        if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete student record ${id}? This action cannot be undone.`)) {
                try {
                    const response = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);

                    alert('Student record deleted successfully.');
                    loadStudents(); // Refresh the table
                } catch (error) {
                    alert(`Error deleting student: ${error.message}`);
                }
            }
        }
    });

    // --- Search/Filter Logic ---
    searchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredStudents = allStudents.filter(student => {
            const fullName = [student.first_name, student.middle_name, student.last_name].filter(Boolean).join(' ').toLowerCase();
            const studentId = student.student_id.toLowerCase();
            return fullName.includes(searchTerm) || studentId.includes(searchTerm);
        });
        renderStudents(filteredStudents);
    });

    // --- Cropper.js Logic ---
    let croppedImageBlob = null; // To store the cropped image blob
    const imageInput = document.getElementById('student-profile-image');

    imageInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const reader = new FileReader();
            reader.onload = () => {
                const cropperImageElement = document.getElementById('cropper-image-element');
                cropperImageElement.src = reader.result;
                openModal(cropperModal);
            };
            reader.readAsDataURL(files[0]);
        }
    });

    document.getElementById('apply-crop-btn').addEventListener('click', async () => {
        const cropperSelectionElement = document.getElementById('cropper-selection-element');
        if (cropperSelectionElement) {
            // Specify output dimensions for a high-quality, sharp image
            const canvas = await cropperSelectionElement.$toCanvas({
                width: 512,
                height: 512,
            });
            canvas.toBlob((blob) => {
                croppedImageBlob = blob;

                // Create a new File object to put back into the input
                const file = new File([blob], "cropped_image.png", { type: 'image/png' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                imageInput.files = dataTransfer.files;

                cropperModal.classList.remove('is-active');
            }, 'image/png');
        }
    });

    document.getElementById('cancel-crop-btn').addEventListener('click', () => {
        imageInput.value = ''; // Clear the file input if cropping is cancelled
        cropperModal.classList.remove('is-active');
    });

    // Initial data load
    loadStudents();
});
