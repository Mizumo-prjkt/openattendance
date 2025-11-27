document.addEventListener('DOMContentLoaded', async () => {
    const studentSelect = document.getElementById('student-select');
    const studentIdInput = document.getElementById('student-id-input');
    const excuseForm = document.getElementById('excuse-form');
    const submitBtn = document.getElementById('submit-excuse-btn');
    const mainContent = document.querySelector('.box');
    const teacherSelector = document.getElementById('teacher-student-selector');
    const otherStaffInput = document.getElementById('other-staff-student-input');

    /**
     * Initializes the page by checking user role and loading necessary data.
     */
    async function initializePage() {
        try {
            // First, check if the user is a teacher
            const meResponse = await fetch('/api/client/me');
            if (!meResponse.ok) throw new Error('Could not verify your staff identity.');
            const staff = await meResponse.json();

            if (staff.staff_type === 'teacher') {
                // Show teacher UI and load their students
                teacherSelector.classList.remove('is-hidden');
                studentIdInput.disabled = true; // Disable the other input

                const studentsResponse = await fetch('/api/client/my-class-students');
                if (!studentsResponse.ok) {
                    const error = await studentsResponse.json();
                    throw new Error(error.error || 'Could not load student data.');
                }
                const students = await studentsResponse.json();
                populateStudentDropdown(students);
            } else {
                // Show UI for other staff (security, student council)
                otherStaffInput.classList.remove('is-hidden');
                studentSelect.disabled = true; // Disable the other input
            }

        } catch (error) {
            mainContent.innerHTML = `<div class="notification is-danger">${error.message}</div>`;
        }
    }

    /**
     * Populates the student selection dropdown.
     * @param {Array} students - An array of student objects.
     */
    function populateStudentDropdown(students) {
        if (students.length === 0) {
            studentSelect.innerHTML = '<option>You have no students in your advisory class.</option>';
            submitBtn.disabled = true;
            return;
        }
        students.forEach(student => {
            const option = document.createElement('option');
            option.value = student.student_id;
            option.textContent = `${student.last_name}, ${student.first_name} (${student.student_id})`;
            studentSelect.appendChild(option);
        });
    }

    /**
     * Handles the form submission.
     */
    excuseForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        submitBtn.classList.add('is-loading');

        // Determine which input to use for the student ID
        const studentId = studentSelect.disabled 
            ? studentIdInput.value 
            : studentSelect.value;

        const payload = {
            student_id: studentId,
            absence_date: document.getElementById('absence-date').value,
            reason: document.getElementById('excuse-reason').value,
        };

        try {
            const response = await fetch('/api/client/excuses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            alert(result.message);
            excuseForm.reset();
        } catch (error) {
            alert(`Error: ${error.message}`);
        } finally {
            submitBtn.classList.remove('is-loading');
        }
    });

    // Start the page initialization process
    initializePage();
});
