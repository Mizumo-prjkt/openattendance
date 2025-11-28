document.addEventListener('DOMContentLoaded', async () => {
    const eventModal = document.getElementById('event-modal');
    const eventsTableBody = document.getElementById('events-table-body');
    let allEvents = [];

    // --- Modal Control ---
    const openModal = () => eventModal.classList.add('is-active');
    const closeModal = () => {
        eventModal.classList.remove('is-active');
        document.getElementById('event-form').reset();
        document.getElementById('event-db-id').value = '';
    };

    document.getElementById('create-event-btn').addEventListener('click', () => {
        document.getElementById('event-modal-title').textContent = 'Create New Event';
        openModal();
    });

    eventModal.querySelector('.delete').addEventListener('click', closeModal);
    eventModal.querySelector('.modal-background').addEventListener('click', closeModal);
    document.getElementById('cancel-event-btn').addEventListener('click', closeModal);

    // --- Data Loading and Rendering ---
    async function loadEvents() {
        try {
            const response = await fetch('/api/admin/events');
            if (!response.ok) throw new Error('Failed to fetch event data.');
            allEvents = await response.json();
            renderEvents(allEvents);
        } catch (error) {
            console.error('Error loading events:', error);
            eventsTableBody.innerHTML = `<tr><td colspan="6" class="has-text-centered has-text-danger">Error loading event records.</td></tr>`;
        }
    }

    function renderEvents(events) {
        eventsTableBody.innerHTML = '';
        if (events.length === 0) {
            eventsTableBody.innerHTML = `<tr><td colspan="6" class="has-text-centered">No events found. Create one to get started.</td></tr>`;
            return;
        }

        events.forEach(event => {
            const row = document.createElement('tr');
            
            let statusClass = 'is-info'; // Default for 'planned'
            if (event.status === 'ongoing') statusClass = 'is-success';
            if (event.status === 'completed') statusClass = 'is-light';
            if (event.status === 'cancelled') statusClass = 'is-danger';

            const formatDt = (dt) => new Date(dt).toLocaleString();
            row.innerHTML = `
                <td>${event.event_name}</td>
                <td>${event.location || 'N/A'}</td>
                <td>${formatDt(event.start_datetime)}</td>
                <td>${formatDt(event.end_datetime)}</td>
                <td><span class="tag ${statusClass}">${event.status}</span></td>
                <td>
                    <button class="button is-small is-info edit-btn" data-id="${event.event_id}">Edit</button>
                    <button class="button is-small is-danger delete-btn" data-id="${event.event_id}">Delete</button>
                </td>
            `;
            eventsTableBody.appendChild(row);
        });
    }

    // --- CRUD Operations ---
    document.getElementById('save-event-btn').addEventListener('click', async () => {
        const dbId = document.getElementById('event-db-id').value;
        const isUpdating = !!dbId;

        const eventData = {
            event_name: document.getElementById('event-name').value,
            event_description: document.getElementById('event-description').value,
            location: document.getElementById('event-location').value,
            start_datetime: document.getElementById('event-start').value,
            end_datetime: document.getElementById('event-end').value,
            status: document.getElementById('event-status').value,
        };

        const url = isUpdating ? `/api/admin/events/${dbId}` : '/api/admin/events';
        const method = isUpdating ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(eventData),
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);

            alert(`Event ${isUpdating ? 'updated' : 'created'} successfully!`);
            closeModal();
            loadEvents();
        } catch (error) {
            alert(`Error saving event: ${error.message}`);
        }
    });

    eventsTableBody.addEventListener('click', async (event) => {
        const target = event.target;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const eventToEdit = allEvents.find(e => e.event_id == id);
            if (eventToEdit) {
                document.getElementById('event-modal-title').textContent = 'Edit Event';
                document.getElementById('event-db-id').value = eventToEdit.event_id;
                document.getElementById('event-name').value = eventToEdit.event_name;
                document.getElementById('event-description').value = eventToEdit.event_description;
                document.getElementById('event-location').value = eventToEdit.location;
                // Format for datetime-local input: YYYY-MM-DDTHH:mm
                document.getElementById('event-start').value = new Date(eventToEdit.start_datetime).toISOString().slice(0, 16);
                document.getElementById('event-end').value = new Date(eventToEdit.end_datetime).toISOString().slice(0, 16);
                openModal();
            }
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to delete this event? This will also remove all attendee records for it.`)) {
                try {
                    const response = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);

                    alert('Event deleted successfully.');
                    loadEvents();
                } catch (error) {
                    alert(`Error deleting event: ${error.message}`);
                }
            }
        }
    });

    // Initial data load
    loadEvents();
});
