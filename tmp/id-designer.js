document.addEventListener('DOMContentLoaded', async () => {
    const studentSelector = document.getElementById('student-selector');
    let allStudents = [];

    // --- Data Loading ---
    async function loadStudents() {
        try {
            const response = await fetch('/api/admin/students');
            if (!response.ok) throw new Error('Failed to fetch students.');
            allStudents = await response.json();

            studentSelector.innerHTML = '<option value="">-- Select a Student --</option>';
            allStudents.forEach(student => {
                const option = document.createElement('option');
                option.value = student.id;
                option.textContent = `${student.last_name || ''}, ${student.first_name || ''} (${student.student_id})`;
                studentSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading students:', error);
            studentSelector.innerHTML = '<option value="">Could not load students</option>';
        }
    }

    // --- ID Card Rendering ---
    function renderIdCard(student) {
        // --- Front of Card ---
        const idName = document.getElementById('id-name');
        const idStudentId = document.getElementById('id-student-id');
        const idClassroom = document.getElementById('id-classroom');
        const idPhoto = document.getElementById('id-photo');

        idName.textContent = `${student.first_name || ''} ${student.last_name || ''}`;
        idStudentId.textContent = student.student_id;
        idClassroom.textContent = student.classroom_section || 'N/A';
        idPhoto.src = student.profile_image_path || 'https://bulma.io/images/placeholders/128x128.png';

        // --- Back of Card (QR Code) ---
        const qrContainer = document.getElementById('qr-code-container');
        qrContainer.innerHTML = ''; // Clear previous QR code

        const canvas = document.createElement('canvas');
        qrContainer.appendChild(canvas);

        // Generate QR code with the student's unique ID
        QRCode.toCanvas(canvas, student.student_id, { width: 200 }, function (error) {
            if (error) console.error(error);
            console.log('QR code generated successfully!');
        });
    }

    // --- Event Listener ---
    studentSelector.addEventListener('change', () => {
        const selectedId = parseInt(studentSelector.value, 10);
        const selectedStudent = allStudents.find(s => s.id === selectedId);
        if (selectedStudent) {
            renderIdCard(selectedStudent);
        }
    });

    // --- Initial Load ---
    loadStudents();
});
