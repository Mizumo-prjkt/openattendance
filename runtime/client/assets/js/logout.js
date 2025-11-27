document.addEventListener('click', async (event) => {
    if (event.target.classList.contains('logout-button')) {
        try {
            const response = await fetch('/api/client/logout', {
                method: 'POST',
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                window.location.href = '/login'; // Redirect to staff login page
            } else {
                throw new Error(result.error || 'Logout failed.');
            }
        } catch (error) {
            console.error('Logout error:', error);
            alert('An error occurred during logout.');
        }
    }
});
