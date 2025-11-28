document.addEventListener('DOMContentLoaded', async () => {
    const eventSelector = document.getElementById('event-selector');
    const attendeeSection = document.getElementById('attendee-section');
    const attendeesTableBody = document.getElementById('attendees-table-body');
    const attendeeSearchInput = document.getElementById('attendee-search');
    const timeLogModal = document.getElementById('time-log-modal');
    let allAttendees = [];

    // --- Initial Data Loading ---
    async function loadEventsIntoSelector() {
        try {
            const response = await fetch('/api/admin/events');
            if (!response.ok) throw new Error('Failed to fetch events.');
            const events = await response.json();

            eventSelector.innerHTML = '<option value="">-- Please select an event --</option>';
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event.event_id;
                option.textContent = `${event.event_name} (${new Date(event.start_datetime).toLocaleDateString()})`;
                eventSelector.appendChild(option);
            });
        } catch (error) {
            console.error('Error loading events:', error);
            eventSelector.innerHTML = '<option value="">Could not load events</option>';
        }
    }

    // --- Modal Control ---
    const openLogModal = () => timeLogModal.classList.add('is-active');
    const closeLogModal = () => timeLogModal.classList.remove('is-active');

    timeLogModal.querySelector('.delete').addEventListener('click', closeLogModal);
    timeLogModal.querySelector('.modal-background').addEventListener('click', closeLogModal);


    // --- Attendee Loading and Rendering ---
    async function loadAttendees(eventId) {
        if (!eventId) {
            attendeeSection.classList.add('is-hidden');
            return;
        }

        attendeeSection.classList.remove('is-hidden');
        attendeesTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered">Loading attendees...</td></tr>`;
        
        try {
            const response = await fetch(`/api/admin/events/${eventId}/attendees`);
            if (!response.ok) throw new Error('Failed to fetch attendee data.');
            allAttendees = await response.json();
            renderAttendees(allAttendees);
        } catch (error) {
            console.error('Error loading attendees:', error);
            attendeesTableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered has-text-danger">Error loading attendee records.</td></tr>`;
        }
    }

    function renderAttendees(attendees) {
        attendeesTableBody.innerHTML = '';
        if (attendees.length === 0) {
            attendeesTableBody.innerHTML = `<tr><td colspan="5" class="has-text-centered">No attendees recorded for this event.</td></tr>`;
            return;
        }

        attendees.forEach(attendee => {
            const row = document.createElement('tr');
            const fullName = `${attendee.student_last_name || ''}, ${attendee.student_first_name || ''}`.trim();

            const statusTag = attendee.check_out_time 
                ? '<span class="tag is-light">Checked-out</span>' 
                : '<span class="tag is-success">Checked-in</span>';

            row.innerHTML = `
                <td>${attendee.student_id}</td>
                <td>${fullName}</td>
                <td>${statusTag}</td>
                <td>${attendee.checked_in_by_staff_name || 'N/A'}</td>
                <td>
                    <button class="button is-small is-info view-logs-btn" data-student-id="${attendee.student_id}" data-student-name="${fullName}">
                        <span class="icon is-small"><i class="fas fa-list-ol"></i></span>
                        <span>Logs</span>
                    </button>
                </td>
            `;
            attendeesTableBody.appendChild(row);
        });
    }

    async function showTimeLogModal(studentId, studentName, eventId) {
        document.getElementById('log-modal-student-name').textContent = studentName;
        const eventName = eventSelector.options[eventSelector.selectedIndex].text;
        document.getElementById('log-modal-event-name').textContent = eventName;

        // Find the full attendee record from the cache to get check-in/out times
        const attendeeRecord = allAttendees.find(a => a.student_id === studentId);
        const formatDt = (dt) => dt ? new Date(dt).toLocaleString() : 'N/A';
        if (attendeeRecord) {
            document.getElementById('log-modal-check-in').textContent = formatDt(attendeeRecord.check_in_time);
            document.getElementById('log-modal-check-out').textContent = formatDt(attendeeRecord.check_out_time);
        } else {
            document.getElementById('log-modal-check-in').textContent = 'N/A';
            document.getElementById('log-modal-check-out').textContent = 'N/A';
        }

        const container = document.getElementById('time-log-details-container');
        container.innerHTML = '<p class="has-text-grey">Loading time logs...</p>';
        openLogModal();

        try {
            const response = await fetch(`/api/admin/events/${eventId}/time-logs/${studentId}`);
            if (!response.ok) throw new Error('Failed to fetch time logs.');
            const logs = await response.json();

            const logMap = new Map(logs.map(log => [log.log_slot, { time: log.log_time, staff: log.staff_name }]));
            container.innerHTML = '';

            const slots = [
                { id: 'morning_in', label: 'Time In (Morning)' },
                { id: 'morning_out', label: 'Time Out (Morning)' },
                { id: 'afternoon_in', label: 'Time In (Afternoon)' },
                { id: 'afternoon_out', label: 'Time Out (Afternoon)' },
                { id: 'evening_in', label: 'Time In (Evening)' },
                { id: 'evening_out', label: 'Time Out (Evening)' },
            ];

            if (logs.length === 0) {
                container.innerHTML = '<p class="has-text-grey">No granular time logs recorded for this student at this event.</p>';
                return;
            }

            slots.forEach(slot => {
                const logEntry = logMap.get(slot.id);
                if (logEntry) {
                    const p = document.createElement('p');
                    p.innerHTML = `<strong>${slot.label}:</strong> ${logEntry.time} (by ${logEntry.staff})`;
                    container.appendChild(p);
                }
            });

        } catch (error) {
            container.innerHTML = '<p class="has-text-danger">Could not load time log details.</p>';
        }
    }

    function exportToCsv(data, eventName) {
        const headers = ['Student ID', 'Student Name', 'Status', 'First Check-in', 'Last Check-out', 'Checked-in By'];
        const formatDt = (dt) => dt ? `"${new Date(dt).toLocaleString()}"` : '""';

        const csvRows = [headers.join(',')];
        data.forEach(row => {
            const status = row.check_out_time ? 'Checked-out' : 'Checked-in';
            const values = [
                `"${row.student_id}"`,
                `"${row.student_last_name || ''}, ${row.student_first_name || ''}"`,
                `"${status}"`,
                formatDt(row.check_in_time),
                formatDt(row.check_out_time),
                `"${row.checked_in_by_staff_name || 'N/A'}"`
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', `event-attendance-${eventName.replace(/ /g, '_')}.csv`);
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    // --- Event Listeners ---
    eventSelector.addEventListener('change', () => {
        loadAttendees(eventSelector.value);
    });

    attendeeSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredAttendees = allAttendees.filter(attendee => {
            const fullName = `${attendee.student_first_name || ''} ${attendee.student_last_name || ''}`.toLowerCase();
            const studentId = attendee.student_id.toLowerCase();
            return fullName.includes(searchTerm) || studentId.includes(searchTerm);
        });
        renderAttendees(filteredAttendees);
    });

    document.getElementById('export-csv-btn').addEventListener('click', () => {
        if (allAttendees.length === 0) {
            alert('No attendee data to export.');
            return;
        }
        const eventName = eventSelector.options[eventSelector.selectedIndex].text;
        exportToCsv(allAttendees, eventName);
    });

    attendeesTableBody.addEventListener('click', (e) => {
        const button = e.target.closest('.view-logs-btn');
        if (button) {
            showTimeLogModal(button.dataset.studentId, button.dataset.studentName, eventSelector.value);
        }
    });

    // --- Initial Load ---
    loadEventsIntoSelector();
});
