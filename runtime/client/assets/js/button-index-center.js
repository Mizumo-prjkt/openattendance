document.addEventListener('DOMContentLoaded', () => {
    const actionButton = document.getElementById('action-redirect');

    if (actionButton) {
        // Check the login status using the function from auth.js
        const isLoggedIn = checkAuthStatus();

        if (isLoggedIn) {
            // If logged in, change the button to go to the client panel
            actionButton.textContent = 'Go to Client Panel';
            actionButton.href = '/client/panel'; // This page doesn't exist yet, but we set the link
        } else {
            // If not logged in, ensure the button points to the login page
            actionButton.textContent = 'Login to start scheduling';
            actionButton.href = '/login';
        }
    }
});
