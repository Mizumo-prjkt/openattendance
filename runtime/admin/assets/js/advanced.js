document.addEventListener('DOMContentLoaded', () => {
    const createBackupBtn = document.getElementById('create-backup-btn');
    const backupsTableBody = document.getElementById('backups-table-body');

    /**
     * Fetches and renders the list of database backups.
     */
    async function loadBackups() {
        backupsTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered">Loading backup list...</td></tr>`;

        try {
            const response = await fetch('/api/admin/database/backups');
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to fetch backups.');
            }
            const backups = await response.json();
            renderBackups(backups);
        } catch (error) {
            console.error('Error loading backups:', error);
            backupsTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered has-text-danger">${error.message}</td></tr>`;
        }
    }

    /**
     * Renders the backup data into the table.
     * @param {Array} backups - An array of backup file objects.
     */
    function renderBackups(backups) {
        backupsTableBody.innerHTML = ''; // Clear the table

        if (backups.length === 0) {
            backupsTableBody.innerHTML = `<tr><td colspan="4" class="has-text-centered">No backups found.</td></tr>`;
            return;
        }

        backups.forEach(backup => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${backup.filename}</td>
                <td>${new Date(backup.createdAt).toLocaleString()}</td>
                <td>${formatBytes(backup.size)}</td>
                <td class="has-text-right">
                    <button class="button is-small is-link download-btn" data-filename="${backup.filename}">
                        <span class="icon"><i class="fas fa-download"></i></span><span>Download</span>
                    </button>
                    <button class="button is-small is-danger delete-btn" data-filename="${backup.filename}">
                        <span class="icon"><i class="fas fa-trash"></i></span><span>Delete</span>
                    </button>
                </td>
            `;
            backupsTableBody.appendChild(row);
        });
    }

    /**
     * Handles the creation of a new backup.
     */
    createBackupBtn.addEventListener('click', async () => {
        createBackupBtn.classList.add('is-loading');
        try {
            const response = await fetch('/api/admin/database/backup', { method: 'POST' });
            const result = await response.json();
            if (!response.ok) throw new Error(result.error);
            alert(result.message);
            loadBackups(); // Refresh the list
        } catch (error) {
            alert(`Error creating backup: ${error.message}`);
        } finally {
            createBackupBtn.classList.remove('is-loading');
        }
    });

    /**
     * Handles download and delete actions using event delegation.
     */
    backupsTableBody.addEventListener('click', async (event) => {
        const target = event.target.closest('button');
        if (!target) return;

        const filename = target.dataset.filename;

        if (target.classList.contains('download-btn')) {
            window.location.href = `/api/admin/database/backups/${filename}`;
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm(`Are you sure you want to permanently delete the backup file '${filename}'?`)) {
                try {
                    const response = await fetch(`/api/admin/database/backups/${filename}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    alert(result.message);
                    loadBackups(); // Refresh the list
                } catch (error) {
                    alert(`Error deleting backup: ${error.message}`);
                }
            }
        }
    });

    /**
     * Utility to format bytes into a human-readable string.
     */
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Initial load of backups
    loadBackups();
});
